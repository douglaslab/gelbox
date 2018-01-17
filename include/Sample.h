//
//  Sample.h
//  Gelbox
//
//  Created by Chaim Gingold on 12/5/17.
//
//

#pragma once

#include <vector>
#include "cinder/Rand.h"
#include "cinder/Xml.h"

class Sample;
typedef std::shared_ptr<Sample> SampleRef;

class Sample
{
public:

	class Fragment
	{
	public:
		int   mBases		= 0;   // base count
		float mMass			= 0.f; // ng
		
		float mDegrade		= 0.f; // 0..2
		int   mAggregate	= 1; // default is 1, dimer is 2, etc...
		
		float mAspectRatio	= 1.f;
		ci::Color mColor	= ci::Color(.5,.5,.5);
	};

	std::vector<Fragment> mFragments;
	
	std::string mName;
	int			mID = -1;
	
	std::string mIconFileName;
	float		mIconScale=1.f;
	
	
	void degrade( float d ) {
		for ( auto& f : mFragments ) f.mDegrade = std::min( 2.f, f.mDegrade + d );
	}
	
	
	Sample() {}
	Sample( const ci::XmlTree& xml ) { loadXml(xml); }
	
	void   loadXml( const ci::XmlTree& ); // clears existing mFragments first
	
	static const std::string kRootXMLNodeName;
	
};