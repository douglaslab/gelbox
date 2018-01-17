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

class Sample;
typedef std::shared_ptr<Sample> SampleRef;

class Gel;
typedef std::shared_ptr<Gel> GelRef;

class Gel
{
public:
	
	// A single simulated Band of macromolecule/fragment
	class Band
	{
	public:
		int			mLane		= -1;
		
		glm::vec2	mStartLoc;
		
		int			mBases		= 0;
		float		mMass		= 0.f;
		float		mDegrade	= 0.f;
		
		float		mCreateTime;
		bool		mExists; // in case we are playing with time travel and go to time before creation
		ci::ColorA	mColor;
		ci::Rectf	mBounds;
	};
	
	// Methods
	void setLayout(
		float		lane_dimension_length,		// x cm
		float		pos_elec_dimension_length,	// y cm
		int			numLanes,
		float		ymargin );
	
	std::vector<SampleRef>&	getSamples() { return mSamples; }
	void  syncBandsToSample( SampleRef ); // tell us when SampleRef changed...
	
	void  stepTime( float dt );
	
	void  setTime( float t );
	float getTime() const { return mTime; }
	float getDuration() const { return mDuration; }
	bool  getIsPaused() const { return mIsPaused; }
	void  setIsPaused( bool v ) { mIsPaused=v; }
	bool  isFinishedPlaying() const { return getTime() >= getDuration(); }
	
	const std::vector<Band>&	getBands() const { return mBands; }
	
	glm::vec2 getSize() const { return mSize; }
	float getLaneWidth() const { return mLaneWidth; }
	int   getNumLanes() const { return mNumLanes; }
	
private:
	
	std::vector<SampleRef>	mSamples;
	
	void updateBandsWithTime( float t );
	ci::Rectf calcBandBounds( const Band& ) const;
	
	float normalizeBases( int bases ) const; // 0...10000 mapped to 0...1
	float getYForNormalizedBases( float normalizedBases, float t ) const; // t=1.f means when done
	
	void insertSample( const Sample&, int lane ); // at current time
	void clearSamples( int lane );	
	
	std::vector<Band>		mBands;

	float					mTime	  = 1.f;
	float					mDuration = 1.f;
	bool					mIsPaused = true;
	
	// layout
	glm::vec2				mSize; // ( lane dimension, pos elec dimension ) cm
	
	float					mYMargin;
	float					mLaneWidth; // = mSize.x / mNumLanes
	int						mNumLanes;
	
};