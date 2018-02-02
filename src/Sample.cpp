//
//  Sample.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 12/5/17.
//
//

#include "Sample.h"
#include <cstdlib>

using namespace std;
using namespace ci;

const std::string Sample::kRootXMLNodeName = "Sample";


bool SampleFragRef::isValid() const
{
	return mSample && mFrag >= 0 && mFrag < mSample->mFragments.size();
}

bool SampleFragRef::isValidIn( SampleRef inSample ) const
{
	return mSample && mSample==inSample && mFrag >= 0 && mFrag < mSample->mFragments.size();
}

bool SampleFragRef::isa( SampleRef s, int frag ) const
{
	SampleFragRef p;
	p.set(s,frag);
	
	do
	{
		if ( *this == p ) return true;
	}
	while ( p.setToOrigin() );
	
	return false;
} 

bool SampleFragRef::setToOrigin()
{
	if ( isValid() )
	{
		if ( mSample->mFragments[mFrag].mOriginSample )
		{
			SampleRef s = mSample->mFragments[mFrag].mOriginSample;
			int		  f = mSample->mFragments[mFrag].mOriginSampleFrag;
			
			mSample = s;
			mFrag   = f;
			
			return true; 
		}
	}
	
	return false;
}

bool SampleFragRef::setToRoot()
{
	bool changed=false;
	
	while (setToOrigin())
	{
		changed=true;
	};
	
	return changed;
}


void
Sample::loadXml( const XmlTree& xml )
{
	mFragments.clear();
	
	if ( !xml.hasChild(kRootXMLNodeName) )
	{
		cout << "Sample::loadXml no " << kRootXMLNodeName << " root node" << endl;
	}
	else
	{
		XmlTree root = xml.getChild(kRootXMLNodeName);
		
		mName			= root.getAttributeValue("name", string() );
		mIconFileName	= root.getAttributeValue("icon", string() );
		mIconScale		= root.getAttributeValue("iconScale", 1.f );
		
		auto childAttrValue = []( const XmlTree& xml, std::string child, auto def )
		{
			if ( xml.hasChild(child) )
			{
				auto j = xml.getChild(child);
				def = j.getAttributeValue("value",def);
			}
			
			return def;
		};

		auto childAttrValueColor = []( const XmlTree& xml, std::string child, Color def )
		{
			if ( xml.hasChild(child) )
			{
				auto j = xml.getChild(child);
				string s = j.getAttributeValue("value",string("000000"));
				
				def = Color::hex( strtoul( s.data(), 0, 16 ) );
			}
			
			return def;
		};
		
		for ( auto i = root.begin("Fragment"); i != root.end(); ++i )
		{
			Fragment k;
			
			k.mBases	= childAttrValue( *i, "Bases",		k.mBases	);
			k.mMass		= childAttrValue( *i, "Mass",		k.mMass		);
			k.mDegrade	= childAttrValue( *i, "Degrade",	k.mDegrade	);
			
			k.mColor	= childAttrValueColor( *i, "Color",		k.mColor	);
			
			// multimer aggregates
			for( auto m = i->begin("Aggregate"); m != i->end(); ++m )
			{
				if ( m->hasAttribute("Size") && m->hasAttribute("Weight") )
				{
					int   s = m->getAttributeValue<int>("Size");
					float w = m->getAttributeValue<int>("Weight");
					
					if ( k.mAggregate.size() < s ) k.mAggregate.resize(s,0.f);
					
					k.mAggregate[s] = w;
				}
				else cerr << "ERROR Sample::loadXml malformed <Aggregate> node; needs Size and Weight attributes." << endl;
			}
			
			mFragments.push_back(k);
			
			if (0)
			{
				cout << "Fragment bases=" << k.mBases << " mass=" << k.mMass << " degrade=" << k.mDegrade << endl;
			}		
		}
	}
}
