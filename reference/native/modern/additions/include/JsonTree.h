//
//  JsonTree.h
//  Gelbox
//
//  Compatibility wrapper that reproduces the subset of Cinder 0.9.0's
//  ci::JsonTree API that Gelbox uses, on top of ci::Json (nlohmann::json),
//  which replaced JsonTree in Cinder 0.9.3.
//
//  Semantics preserved from the old JsonTree:
//    - a node carries an optional key; addChild() files it under that key
//    - getValue<T>() parses string-encoded numbers ("175", ".06"), which
//      is how the tuning files in assets/tuning store most values
//    - float values are written with ~6 significant digits, not 17
//

#pragma once

#include <string>
#include <vector>
#include <stdexcept>
#include <memory>
#include <ostream>

#include "cinder/Json.h"
#include "cinder/DataSource.h"
#include "cinder/Utilities.h"
#include "cinder/Filesystem.h"

namespace cinder {

class JsonTree
{
public:
	class ExcChildNotFound : public std::runtime_error {
	public:
		ExcChildNotFound( const std::string& path ) : std::runtime_error( "JsonTree: child not found: " + path ) {}
	};

	JsonTree() = default;

	//! Parse a JSON document from a data source (file, resource, ...)
	explicit JsonTree( const DataSourceRef& source )
		: mValue( loadJson( source, /*stripComments*/ true ) ) {}

	//! Wrap an existing ci::Json value, optionally with a key
	static JsonTree fromJson( const Json& value, const std::string& key = "" )
	{
		JsonTree t;
		t.mValue = value;
		t.mKey   = key;
		return t;
	}

	//! Value node: JsonTree( "Time", 42.f ), JsonTree( "name", "foo" ), JsonTree( "", 1.5f )
	template<class T>
	JsonTree( const std::string& key, const T& value )
		: mKey( key ), mValue( toJsonValue( value ) ) {}

	static JsonTree makeObject( const std::string& key = "" ) { return fromJson( Json::object(), key ); }
	static JsonTree makeArray ( const std::string& key = "" ) { return fromJson( Json::array(),  key ); }

	// --- building ---

	//! Add a keyed child to an object node (a null node becomes an object)
	void addChild( const JsonTree& child )
	{
		if ( mValue.is_null() ) mValue = Json::object();
		if ( mValue.is_object() ) {
			mValue[child.mKey] = child.mValue;
		} else if ( mValue.is_array() ) {
			mValue.push_back( child.mValue );
		} else {
			throw std::runtime_error( "JsonTree::addChild on a value node" );
		}
	}

	//! Append a child to an array node (a null node becomes an array)
	void pushBack( const JsonTree& child )
	{
		if ( mValue.is_null() ) mValue = Json::array();
		if ( !mValue.is_array() ) throw std::runtime_error( "JsonTree::pushBack on a non-array node" );
		mValue.push_back( child.mValue );
	}

	// --- querying ---

	const std::string& getKey() const { return mKey; }
	const Json&        getJson() const { return mValue; }

	size_t getNumChildren() const
	{
		return ( mValue.is_object() || mValue.is_array() ) ? mValue.size() : 0;
	}

	//! \a relativePath may be dotted, e.g. "Gelbox.version"
	bool hasChild( const std::string& relativePath ) const
	{
		return findChild( relativePath ) != nullptr;
	}

	JsonTree getChild( const std::string& relativePath ) const
	{
		const Json* j = findChild( relativePath );
		if ( !j ) throw ExcChildNotFound( relativePath );
		return fromJson( *j, lastPathComponent( relativePath ) );
	}

	//! Index into an array (or the i-th member of an object)
	JsonTree operator[]( size_t index ) const
	{
		if ( mValue.is_array() ) {
			return fromJson( mValue.at( index ) );
		}
		if ( mValue.is_object() ) {
			auto it = mValue.begin();
			std::advance( it, index );
			if ( it == mValue.end() ) throw std::out_of_range( "JsonTree::operator[]" );
			return fromJson( it.value(), it.key() );
		}
		throw std::out_of_range( "JsonTree::operator[] on a value node" );
	}

	template<class T>
	T getValue() const { return valueAs<T>( mValue ); }

	template<class T = std::string>
	T getValueForKey( const std::string& relativePath ) const
	{
		return getChild( relativePath ).getValue<T>();
	}

	// --- iteration over children (yields JsonTree by value) ---

	class ConstIter
	{
	public:
		ConstIter( Json::const_iterator it, bool keyed ) : mIt( it ), mKeyed( keyed ) {}

		JsonTree operator*() const { return make(); }
		const JsonTree* operator->() const { mCurrent = std::make_shared<JsonTree>( make() ); return mCurrent.get(); }

		ConstIter& operator++() { ++mIt; return *this; }
		bool operator==( const ConstIter& o ) const { return mIt == o.mIt; }
		bool operator!=( const ConstIter& o ) const { return mIt != o.mIt; }

	private:
		JsonTree make() const { return fromJson( mIt.value(), mKeyed ? mIt.key() : std::string() ); }

		Json::const_iterator mIt;
		bool                 mKeyed;
		mutable std::shared_ptr<JsonTree> mCurrent; // shared_ptr: JsonTree is incomplete here
	};

	ConstIter begin() const { return ConstIter( iterable().begin(), mValue.is_object() ); }
	ConstIter end()   const { return ConstIter( iterable().end(),   mValue.is_object() ); }

	// --- output ---

	void write( const fs::path& path ) const { writeJson( path, mValue ); }
	std::string serialize() const { return mValue.dump( 4 ); }

private:
	// A value node has no children to iterate; hand back a shared empty array
	// so begin()==end() instead of nlohmann's "iterate a scalar" behaviour.
	const Json& iterable() const
	{
		static const Json kEmpty = Json::array();
		return ( mValue.is_object() || mValue.is_array() ) ? mValue : kEmpty;
	}

	static std::string lastPathComponent( const std::string& path )
	{
		auto dot = path.rfind( '.' );
		return dot == std::string::npos ? path : path.substr( dot + 1 );
	}

	const Json* findChild( const std::string& relativePath ) const
	{
		const Json* cur = &mValue;
		size_t start = 0;
		while ( true ) {
			size_t dot = relativePath.find( '.', start );
			std::string part = relativePath.substr( start, dot == std::string::npos ? std::string::npos : dot - start );
			if ( !cur->is_object() ) return nullptr;
			auto it = cur->find( part );
			if ( it == cur->end() ) return nullptr;
			cur = &*it;
			if ( dot == std::string::npos ) return cur;
			start = dot + 1;
		}
	}

	// Floats go through toString() (6 significant digits) so files stay tidy
	// and match what the old JsonTree wrote, rather than 0.10000000149011612.
	static Json toJsonValue( float v )              { return Json( std::stod( toString( v ) ) ); }
	static Json toJsonValue( const char* v )        { return Json( std::string( v ) ); }
	template<class T>
	static Json toJsonValue( const T& v )           { return Json( v ); }

	template<class T>
	static T valueAs( const Json& j )
	{
		if ( j.is_string() )  return fromString<T>( j.get<std::string>() );
		if ( j.is_boolean() ) return static_cast<T>( j.get<bool>() );
		if ( j.is_number() )  return static_cast<T>( j.get<double>() );
		throw std::runtime_error( "JsonTree::getValue on a non-value node" );
	}

	std::string mKey;
	Json        mValue;
};

template<>
inline std::string JsonTree::valueAs<std::string>( const Json& j )
{
	if ( j.is_string() ) return j.get<std::string>();
	return j.dump();
}

template<>
inline bool JsonTree::valueAs<bool>( const Json& j )
{
	if ( j.is_boolean() ) return j.get<bool>();
	if ( j.is_number() )  return j.get<double>() != 0.0;
	if ( j.is_string() ) {
		const std::string s = j.get<std::string>();
		return s == "true" || s == "1";
	}
	throw std::runtime_error( "JsonTree::getValue<bool> on a non-value node" );
}

inline std::ostream& operator<<( std::ostream& os, const JsonTree& j )
{
	return os << j.serialize();
}

} // namespace cinder
