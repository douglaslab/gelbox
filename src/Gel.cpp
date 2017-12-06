//
//  Gel.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 12/4/17.
//
//

#include "Gel.h"
#include "GelParticleSource.h"

using namespace std;
using namespace ci;

const vec2 kLaneVec(1,0);
const vec2 kPosVec (0,1);

void Gel::setLayout(
	float		lane_dimension, 
	float		pos_elec_dimension,
	int			numLanes )
{
	mSize = vec2( lane_dimension, pos_elec_dimension );
	
	mNumLanes  = numLanes;
	mLaneWidth = mSize.x / (float)numLanes; 
}

void Gel::insertSamples( const GelParticleSource& src, int lane, int num )
{
	vec2 laneLoc = kLaneVec * ((float)lane*mLaneWidth + mLaneWidth/2.f);
	
	for( int i = 0; i<num; ++i )
	{
		GelParticleSource::Result gen = src.next(mRand);
		
		Particle p;
		
		p.mStartLoc		= p.mLoc = laneLoc;
		p.mSpeed		= gen.mSpeed;
		p.mCreateTime	= mTime;
		p.mExists		= true;
		p.mColor		= ColorA(1.f,1.f,1.f,.1f); // just make up a color for now...
		
		mParticles.push_back(p);
	}
	
	mDuration = calcDuration();
}

void Gel::clearSamples()
{
	mParticles.clear();
}

void Gel::stepTime ( float dt )
{
	mTime += dt;
	mTime = min( mTime, mDuration );
	updateParticlesWithTime(mTime);
}

void Gel::setTime( float t )
{
	mTime = t;
	updateParticlesWithTime(mTime);
}

float Gel::calcDuration() const
{
	if ( mParticles.empty() ) return 0.f;
	
	float d = MAXFLOAT;
	
	for( auto &p : mParticles )
	{
		// assume created at the top for now to simplify this...
		d = min( d, mSize.y / p.mSpeed );
	}
	
	return d;
}

void Gel::updateParticlesWithTime( float t )
{
	for( auto &p : mParticles )
	{
		p.mExists = t >= p.mCreateTime;
		
		float particleTime = max(t - p.mCreateTime,0.f);
		
		float travel = p.mSpeed * particleTime;
		
		travel = min( travel, mSize.y ); // no falling off the edge
		
		p.mLoc = p.mStartLoc + kPosVec * travel;
	}
}