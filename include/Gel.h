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
#include "Band.h"

class Sample;
typedef std::shared_ptr<Sample> SampleRef;

class Gel;
typedef std::shared_ptr<Gel> GelRef;


class Gel
{
public:
	
	Gel();
	Gel( const Gel& ) = delete; // sorry, this is broken right now because of Gelbox::BufferRef
	
	// Methods
	void setLayout(
		float		lane_dimension_length,		// x cm
		float		pos_elec_dimension_length,	// y cm
		int			numLanes,
		float		ymargin );
	
	void  setSample( SampleRef s, int lane );
	const std::vector<SampleRef>&	getSamples() { return mSamples; }
	void  syncBandsToSample( SampleRef ); // tell us when SampleRef changed...
	void  syncBandsToSample( int lane  ); // tell us when SampleRef changed...
	int	  getLaneForSample ( SampleRef ) const;
	int   getFirstEmptyLane() const; // -1 for none
	
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

	void  setWellDamage( float );
	float getWellDamage() const { return mWellDamage; }
	
	const std::vector<Band>&	getBands() const { return mBands; }
	const Band*	getSlowestBandInFragment( int lane, int frag ) const;
	Band		getSlowestBandInFragment( Band query );
	
	glm::vec2	getSize() const { return mSize; }
	float		getLaneWidth() const { return mLaneWidth; }
	int			getNumLanes() const { return mNumLanes; }
	ci::vec2	getWellSize() const;
	ci::Rectf	getWellBounds( int lane ) const;

	float		getSampleDeltaYSpaceScale() const { return mSize.y - mYMargin*2.f - mLaneWidth*.2f; }
	
	GelSim::Context getSimContext( const Sample& ) const;
	
private:
	
	std::vector<SampleRef>	mSamples;
	Gelbox::Buffer			mBuffer = Gelbox::kBufferPresets[Gelbox::kBufferDefaultPreset];
	
	void	  updateBands();
	
	void insertSample( const Sample&, int lane ); // at current time
	void clearSamples( int lane );	
	
	std::vector<Band>		mBands;

	float					mTime	  = 1.f;
	float					mDuration = 1.f;
	bool					mIsPaused = true;
	
	float					mVoltage;
	float					mWellDamage = 0.f;
	
	// layout
	glm::vec2				mSize; // ( lane dimension, pos elec dimension ) cm
	
	float					mYMargin;
	float					mLaneWidth; // = mSize.x / mNumLanes
	int						mNumLanes;
	
};
