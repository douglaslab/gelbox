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
#include "cinder/PolyLine.h"

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
	};
	
	// Methods
	void setLayout(
		glm::vec2	origin,
		glm::vec2	plusElectricVec,
		float		laneAxisLength,
		float		electricAxisLength,
		int			numLanes );
	
	void insertSamples( const GelParticleSource&, int lane, int num ); // at current time
	void clearSamples();
	
	void  tick   ( float dt );
	void  setTime( float t );
	float getTime() const { return mTime; }
	float getDuration() const { return mDuration; }
	
	const std::vector<Particle>&	getParticles() const { return mParticles; }
	ci::PolyLine2					getOutlineAsPolyLine() const;
	
	float getLaneWidth() const { return mLaneWidth; }
	
private:
	
	void updateParticlesWithTime( float t );
	float calcDuration() const;
	
	ci::Rand				mRand;
	
	std::vector<Particle>	mParticles;

	float					mTime = 0.f;
	float					mDuration = 0.f;
	
	// layout
	glm::vec2				mOrigin;  // loc lane 0, -			 (i.e. translation)
	glm::vec2				mPosVec;  // orientation of   - => + (i.e. y+)
	glm::vec2				mLaneVec; // vector from lane 0 => 1 (i.e. x+)
	
	float					mLengthInPosVec, mLengthInLaneVec; // size(y,x)
	
	float					mLaneWidth;
	int						mNumLanes;
	
};