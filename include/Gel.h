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
		int			mFragment	= -1;
		
		ci::Rectf	mStartBounds; // well 
		
		// for top (higher bp) and bottom (lower bp) of band, how many bases, and what is aggregate/multimer count?
		int			mBases[2];
		int			mMultimer[2];
		
		float		mMass		= 0.f;
		float		mDegrade	= 0.f;
		
		float		mAspectRatio = 1.f;
		
		float		mCreateTime;
		bool		mExists; // in case we are playing with time travel and go to time before creation
		ci::ColorA	mColor;
		ci::Rectf	mBounds;
	
		ci::Color   mFocusColor;
		
		std::vector<float> mAggregate; // population ratios, as represented elsewhere with mAggregate
	};
	
	// Methods
	void setLayout(
		float		lane_dimension_length,		// x cm
		float		pos_elec_dimension_length,	// y cm
		int			numLanes,
		float		ymargin );
	
	void  setSample( SampleRef s, int lane ) { mSamples[lane]=s; syncBandsToSample(s); }
	std::vector<SampleRef>&	getSamples() { return mSamples; }
	void  syncBandsToSample( SampleRef ); // tell us when SampleRef changed...
	int	  getLaneForSample ( SampleRef ) const;
	
	void  stepTime( float dt );
	
	void  setTime( float t );
	float getTime() const { return mTime; }
	float getDuration() const { return mDuration; }
	bool  getIsPaused() const { return mIsPaused; }
	void  setIsPaused( bool v ) { mIsPaused=v; }
	bool  isFinishedPlaying() const { return getTime() >= getDuration(); }
	
	const std::vector<Band>&	getBands() const { return mBands; }
	
	glm::vec2	getSize() const { return mSize; }
	float		getLaneWidth() const { return mLaneWidth; }
	int			getNumLanes() const { return mNumLanes; }
	ci::Rectf	getWellBounds( int lane ) const;

	float		getBandLocalTime( const Band& b ) const { return std::max(mTime - b.mCreateTime,0.f); }
	float		getSampleDeltaYSpaceScale() const { return mSize.y - mYMargin*2.f; }
	
private:
	
	std::vector<SampleRef>	mSamples;
	
	void updateBandsWithTime( float t );
	ci::Rectf calcBandBounds( const Band& ) const;
	
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