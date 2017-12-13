//
//  Sample.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 12/5/17.
//
//

#include "Sample.h"

using namespace std;
using namespace ci;

const std::string Sample::kRootXMLNodeName = "Sample";

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
		
		for ( auto i = root.begin("Fragment"); i != root.end(); ++i )
		{
			Fragment k;
			
			k.mBases	= childAttrValue( *i, "Bases",		k.mBases	);
			k.mMass		= childAttrValue( *i, "Mass",		k.mMass		);
			k.mDegrade	= childAttrValue( *i, "Degrage",	k.mDegrade	);
			
			mFragments.push_back(k);
			
			if (0)
			{
				cout << "Fragment bases=" << k.mBases << " mass=" << k.mMass << " degrade=" << k.mDegrade << endl;
			}		
		}
	}
}
