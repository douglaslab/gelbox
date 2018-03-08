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
#include "Buffer.h"
#include "GelSim.h"

class Sample;
typedef std::shared_ptr<Sample> SampleRef;

class Gel;
typedef std::shared_ptr<Gel> GelRef;


class Gel
{
public:
	
	Gel();
	Gel( const Gel& ) = delete; // sorry, this is broken right now because of Gelbox::BufferRef
	
	// A single simulated Band of macromolecule/fragment
	class Band
	{
	public:
		int			mLane		= -1;
		int			mFragment	= -1;
		int			mDye		= -1;
		
		ci::Rectf	mStartBounds; // well 
		
		// for top (higher bp) and bottom (lower bp) of band, how many bases and aggregates?
		int			mBases[2]; // degrade causes these values to drop
		int			mMultimer[2];
		
		float		mMass		= 0.f;
		float		mDegrade	= 0.f;
		
		float		mAspectRatio = 1.f;
		
		float		mCreateTime;
		bool		mExists; // in case we are playing with time travel and go to time before creation
		ci::Color	mColor;
		
		ci::Rectf	mBounds; // of everything
		
		ci::Rectf	mBandBounds; // just the band (might be degraded)
//		ci::Rectf	mBandDegradedBounds;
//		ci::Rectf	mBandBoundsDiffuse; // band inflated with diffuse effect
		
		float		mAlpha[2]; // from top (y1) to bottom (y2)

		float		mDiffuseBlur = 0.f;
//		GelSim::Output mGelSimOutput;
		
		ci::Color   mFocusColor;
		
		std::vector<float> mAggregate; // population ratios, as represented elsewhere with mAggregate
	};
	
	// Methods
	void setLayout(
		float		lane_dimension_length,		// x cm
		float		pos_elec_dimension_length,	// y cm
		int			numLanes,
		float		ymargin );
	
	void  setSample( SampleRef s, int lane );
	std::vector<SampleRef>&	getSamples() { return mSamples; }
	void  syncBandsToSample( SampleRef ); // tell us when SampleRef changed...
	int	  getLaneForSample ( SampleRef ) const;
	
	void  setBuffer( const Gelbox::Buffer& b );
	const Gelbox::Buffer& getBuffer() { return mBuffer; }
	
	void  stepTime( float dt );
	
	void  setTime( float t );
	float getTime() const { return mTime; }
	float getDuration() const { return mDuration; }
	bool  getIsPaused() const { return mIsPaused; }
	void  setIsPaused( bool v ) { mIsPaused=v; }
	bool  isFinishedPlaying() const { return getTime() >= getDuration(); }
	
	void  setVoltage( float );
	float getVoltage() const { return mVoltage; }
	
	const std::vector<Band>&	getBands() const { return mBands; }
	const Band*	getSlowestBandInFragment( int lane, int frag ) const;
	Band		getSlowestBandInFragment( Band query );
	
	glm::vec2	getSize() const { return mSize; }
	float		getLaneWidth() const { return mLaneWidth; }
	int			getNumLanes() const { return mNumLanes; }
	ci::Rectf	getWellBounds( int lane ) const;

	float		getBandLocalTime( const Band& b ) const { return std::max(mTime - b.mCreateTime,0.f); }
	float		getSampleDeltaYSpaceScale() const { return mSize.y - mYMargin*2.f; }
	
	GelSim::Input gelSimInput ( const Gel::Band& b, int i ) const;
		
private:
	
	std::vector<SampleRef>	mSamples;
	Gelbox::Buffer			mBuffer = Gelbox::kBufferPresets[Gelbox::kBufferDefaultPreset];
	
	void updateBands();
	void	  updateBandState( Band& ) const;
//	ci::Rectf calcBandBounds( const Band& ) const;
	float     calcBandAlpha ( const Band&, int i ) const; // uses bounds, so do that first
	
	void insertSample( const Sample&, int lane ); // at current time
	void clearSamples( int lane );	
	
	std::vector<Band>		mBands;

	float					mTime	  = 1.f;
	float					mDuration = 1.f;
	bool					mIsPaused = true;
	
	float					mVoltage;
	
	// layout
	glm::vec2				mSize; // ( lane dimension, pos elec dimension ) cm
	
	float					mYMargin;
	float					mLaneWidth; // = mSize.x / mNumLanes
	int						mNumLanes;
	
};
