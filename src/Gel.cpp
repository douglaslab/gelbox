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

void Gel::setLayout(
	glm::vec2	origin,
	glm::vec2	plusElectricVec,
	float		laneAxisLength,
	float		electricAxisLength,
	int			numLanes )
{
	mOrigin  = origin;
	mPosVec  = plusElectricVec;
	mLaneVec = -vec2( cross( vec3(0,0,1), vec3(mPosVec,0) ) );
	// not sure why -vec2, but it works
	
	mLengthInLaneVec = laneAxisLength;
	mLengthInPosVec  = electricAxisLength;
	
	mNumLanes  = numLanes;
	mLaneWidth = mLengthInLaneVec / (float)numLanes; 
}

void Gel::insertSamples( const GelParticleSource& src, int lane, int num )
{
	vec2 laneLoc = mLaneVec * ((float)lane*mLaneWidth + mLaneWidth/2.f) + mOrigin;
	
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
}

void Gel::clearSamples()
{
	mParticles.clear();
}

void Gel::tick   ( float dt )
{
	mTime += dt;
	updateParticlesWithTime(mTime);
}

void Gel::setTime( float t )
{
	mTime = t;
	updateParticlesWithTime(mTime);
}

void Gel::updateParticlesWithTime( float t )
{
	for( auto &p : mParticles )
	{
		p.mExists = t >= p.mCreateTime;
		
		float particleTime = max(t - p.mCreateTime,0.f);
		
		float travel = p.mSpeed * particleTime;
		
		travel = min( travel, mLengthInPosVec ); // no falling off the edge
		
		p.mLoc = p.mStartLoc + mPosVec * travel;
	}
}

ci::PolyLine2
Gel::getOutlineAsPolyLine() const
{
	PolyLine2 p;
	
	vec2 x = mLaneVec * mLengthInLaneVec;
	vec2 y = mPosVec  * mLengthInPosVec;
	
	p.push_back( vec2(0,0) );
	p.push_back( x );
	p.push_back( x + y );
	p.push_back( y );
	
	p.offset( mOrigin );
	
	p.setClosed();
	
	return p;
}