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
				
		b.mStartLoc		= laneLoc;
		
		// calculate alpha
		float a = min( 1.f, b.mMass / 125.f ); // alpha set to mass 125ml
		
		if (b.mDegrade > 1.f) a *= min( b.mDegrade - 1.f, 1.f ); // degrade alpha
		
		
		b.mCreateTime	= 0.f; // always start it at the start (not mTime); otherwise is kind of silly...
		b.mExists		= true;
		b.mColor		= ColorA(1.f,1.f,1.f,a);
		
		b.mBounds		= calcBandBounds(b);
		
		mBands.push_back(b);
	}
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
		
		b.mBounds = calcBandBounds(b);
	}
}

ci::Rectf Gel::calcBandBounds( const Band& b ) const
{
	const float bandTime = max(mTime - b.mCreateTime,0.f);

	const float w2 = mLaneWidth * .25f;
	const float h2 = mLaneWidth * .05f;
	
	// what base pair location to use for y1 and y2
	float y1b = normalizeBases(b.mBases);
	float y2b = y1b;
	
	// degrade base pair location
	y2b -= min( 1.f, b.mDegrade ); // as degrade goes 0..1, y2 moves to end of chart--shorter base pairs
	if ( b.mDegrade > 1.f ) y1b -= min( 1.f, b.mDegrade - 1.f ); // as degrade goes 1..2, y1 moves to end of chart--shorter bp  
	
	// get bounds in cm
	Rectf r;
	
	r.x1 = b.mStartLoc.x - w2;
	r.x2 = b.mStartLoc.x + w2;
	
	r.y1 = b.mStartLoc.y - h2 + getYForNormalizedBases( y1b, bandTime );
	r.y2 = b.mStartLoc.y + h2 + getYForNormalizedBases( y2b, bandTime );
	
	return r;
}

float Gel::normalizeBases( int bases ) const
{
	return (float)bases / 10000.f;	
}

float Gel::getYForNormalizedBases( float normalizedBases, float t ) const
{
	float y = normalizedBases;
	// y=1 means lots of bases, slow, top of gel
	// y=0 means few bases, fast, bottom of gel
	
	// time (doing time here seems to mess things up, causing bands to disappear)
//	y = 1.f - t * (1.f - y);
	
	// output is non-linear
	if (0)
	{
		const float K = .5f;
	//	float K = lerp( 0.f, 2.f, t );
		
		y = powf( y, K );
	}
	
	// flip it, so that y=1 puts us at bottom of gel
	y = 1.f - y; 

	// time
	y *= t;
	
	// scale
	y *= mSize.y - mYMargin*2.f;
	
	// done
	return y;
}