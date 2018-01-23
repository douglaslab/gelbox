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
		float mSampleSizeBias = -1.f; // -1 for none, 0 to skew towards big + slow, 1 for small + fast 
		
		std::vector<float> mAggregate;
		/* - empty means default (monomer)
		   - dimer is {0,1} (0 for size 1, 1 for size 2)
		   - 50/50 dimers and trimers is {0,1,1}
		   - can no non-uniform distributions, e.g.: {.5,1,2}
		   etc...
		*/
		
		float calcAggregateSum() const {
			float sum = 0.f;
			for( auto w : mAggregate ) sum += w;
			return sum; 
		}

		float calcAggregateWeightedSum() const {
			float sum = 0.f;
			for( int i=0; i<mAggregate.size(); ++i ) sum += mAggregate[i] * (float)i;
			return sum; 
		}
		
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
