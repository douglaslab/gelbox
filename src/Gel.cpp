//
//  Gel.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 12/4/17.
//
//

#include "Gel.h"
#include "Sample.h"

using namespace std;
using namespace ci;

const vec2 kLaneVec(1,0);
const vec2 kPosVec (0,1);

void Gel::setLayout(
	float		lane_dimension, 
	float		pos_elec_dimension,
	int			numLanes,
	float		ymargin )
{
	mYMargin = ymargin;
	
	mSize = vec2( lane_dimension, pos_elec_dimension );
	
	mNumLanes  = numLanes;
	mLaneWidth = mSize.x / (float)numLanes; 
}

void Gel::insertSample( const Sample& src, int lane )
{
	vec2 laneLoc = vec2(0.f,mYMargin) + kLaneVec * ((float)lane*mLaneWidth + mLaneWidth/2.f);
	
	vec2 size;
	size.x = mLaneWidth * .25f;
	size.y = mLaneWidth * .05f;
	
	for( auto frag : src.mFragments )
	{
		Band b;

		b.mBases		= frag.mBases;
		b.mMass			= frag.mMass;
		b.mDegrade		= frag.mDegrade;
				
		b.mStartLoc		= b.mLoc = laneLoc;
		
		float a = min( 1.f, b.mMass / 125.f ); // alpha set to mass 125ml
		
		b.mCreateTime	= 0.f; // always start it at the start (not mTime); otherwise is kind of silly...
		b.mExists		= true;
		b.mColor		= ColorA(1.f,1.f,1.f,a);
		b.mSize			= size;
		
		mBands.push_back(b);
	}
	
	updateBandsWithTime(mTime);
}

void Gel::clearSamples()
{
	mBands.clear();
}

void Gel::stepTime ( float dt )
{
	mTime += dt;
	mTime = min( mTime, mDuration );
	updateBandsWithTime(mTime);
}

void Gel::setTime( float t )
{
	mTime = t;
	updateBandsWithTime(mTime);
}

void Gel::updateBandsWithTime( float t )
{
	for( auto &b : mBands )
	{
		b.mExists = t >= b.mCreateTime;
		
		float bandTime = max(t - b.mCreateTime,0.f);
		
		float y = getYForBases( b.mBases, bandTime );
		
		b.mLoc = b.mStartLoc + kPosVec * y;
	}
}

float Gel::getYForBases( int bases, float t ) const
{
	// map domain to 0..1
	float y = (float)bases / 10000.f;
		// y=1 means lots of bases, slow, top of gel
		// y=0 means few bases, fast, bottom of gel

	// time
	y = 1.f - t * (1.f - y);
		
	// output is non-linear
	const float K = .5f;
//	float K = lerp( 0.f, 2.f, t );
	
	y = powf( y, K );
	
	// flip it, so that y=1 puts us at bottom of gel
	y = 1.f - y; 
	
	// scale
	y *= mSize.y - mYMargin*2.f;
	
	// done
	return y;
}