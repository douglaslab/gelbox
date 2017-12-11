//
//  Gel.h
//  Gelbox
//
//  Created by Chaim Gingold on 12/4/17.
//
//

#pragma once

#include <vector>
#include <memory>
#include "glm/vec2.hpp"
#include "cinder/Rand.h"
#include "cinder/Color.h"

class GelParticleSource;
class Gel;
typedef std::shared_ptr<Gel> GelRef;

class Gel
{
public:
	
	// A single simulated particle of macromolecule/fragment
	class Particle
	{
	public:
		glm::vec2	mLoc, mStartLoc;
		float		mSpeed; // speed this particle travels at
			// unit is implicit/dimensionless, based on time + space scale used.
		float		mCreateTime;
		bool		mExists; // in case we are playing with time travel and go to time before creation
		ci::ColorA	mColor;
		glm::vec2	mSize;
	};
	
	// Methods
	void setLayout(
		float		lane_dimension_length,		// x 
		float		pos_elec_dimension_length,	// y
		int			numLanes );
	
	void insertSamples( const GelParticleSource&, int lane, int num ); // at current time
	void clearSamples();
	
	void  stepTime( float dt );
	
	void  setTime( float t );
	float getTime() const { return mTime; }
	float getDuration() const { return mDuration; }
	bool  getIsPaused() const { return mIsPaused; }
	void  setIsPaused( bool v ) { mIsPaused=v; }
	
	const std::vector<Particle>&	getParticles() const { return mParticles; }
	
	glm::vec2 getSize() const { return mSize; }
	float getLaneWidth() const { return mLaneWidth; }
	int   getNumLanes() const { return mNumLanes; }
	
private:
	
	void updateParticlesWithTime( float t );
	float calcDuration() const;
	
	ci::Rand				mRand;
	
	std::vector<Particle>	mParticles;

	float					mTime = 0.f;
	float					mDuration = 0.f;
	bool					mIsPaused = false;
	
	// layout
	glm::vec2				mSize; // ( lane dimension, pos elec dimension )
	
	float					mLaneWidth; // = mSize.x / mNumLanes
	int						mNumLanes;
	
};