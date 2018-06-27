//
//  Serialize.h
//  Gelbox
//
//  Created by Chaim Gingold on 6/27/18.
//

#include <string>
#include "cinder/Json.h"
#include "cinder/Xml.h"
#include "cinder/Color.h"

#pragma once

inline ci::JsonTree toJson( glm::vec3 v, std::string key="" )
{
	ci::JsonTree j = ci::JsonTree::makeArray(key);
	for( int i=0; i<3; ++i ) {
		j.pushBack( ci::JsonTree("",v[i]) );
	}
	return j;
}

inline ci::JsonTree toJson( glm::vec4 v, std::string key="" )
{
	ci::JsonTree j = ci::JsonTree::makeArray(key);
	for( int i=0; i<4; ++i ) {
		j.pushBack( ci::JsonTree("",v[i]) );
	}
	return j;
}

template<class T> void jsonValue( const ci::JsonTree& j, std::string key, T& val )
{
	if ( j.hasChild(key) )
	{
		val = j.getValueForKey<T>(key);
	}
}

inline void jsonValue( const ci::JsonTree& j, std::string key, glm::vec3& val )
{
	if ( j.hasChild(key) )
	{
		ci::JsonTree c = j.getChild(key);
		if (c.getNumChildren()==3)
		{
			for ( int i=0; i<3; ++i )
			{
				val[i] = c[i].getValue<float>();
			}
		}
	}
}

inline void jsonValue( const ci::JsonTree& j, std::string key, glm::vec4& val )
{
	if ( j.hasChild(key) )
	{
		ci::JsonTree c = j.getChild(key);
		if (c.getNumChildren()==4)
		{
			for ( int i=0; i<4; ++i )
			{
				val[i] = c[i].getValue<float>();
			}
		}
	}
}

inline void jsonValue( const ci::JsonTree& j, std::string key, ci::Color& val )
{
	glm::vec3 v;
	jsonValue(j,key,v);
	val = ci::Color( ci::CM_RGB, v );
}

inline void jsonValue( const ci::JsonTree& j, std::string key, ci::ColorA& val )
{
	glm::vec4 v;
	jsonValue(j,key,v);
	val = v;
}

inline void addChildAttrValue( ci::XmlTree& x, std::string child, std::string value )
{
	ci::XmlTree c(child,"");
	c.setAttribute("value",value);
	x.push_back(c);
};
