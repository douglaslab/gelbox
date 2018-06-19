//
//  GelSim.h
//  Gelbox
//
//  Created by Chaim Gingold on 1/31/18.
//
//

#pragma once

#include "Buffer.h"
#include "Band.h"
#include "Dye.h"
#include "cinder/Json.h"

class Sample;

namespace GelSim // unify namespace with Gelbox? (rename both Gelbox?)
{



/*
	Tuning
*/

class Tuning
{
public:

	void load( const ci::JsonTree& );
	
	
	/*
	 *		Sim
	 */
	 
	float mSampleMassHigh = 175.f; // 175ml
	int   mBaseCountHigh  = 14000;

	float mWellToDyeHeightScale = 4.f;
	//float mSampleMassTooHighStuckInWellThreshold = 150.f;


	/*
	 *		Slider
	 */

	int   mSliderTimelineMaxMinutes = 60 * 3; // 3 hrs

	float mSliderMassMin	  = 1.f;
	float mSliderMassMax	  = mSampleMassHigh;
	float mSliderDyeMassMin = 0.f;
	float mSliderDyeMassMax = Dye::kMaxMass;

	float mSliderVoltageLow   = -300;
	float mSliderVoltageHigh  =  300;
	float mSliderVoltageNotch =  70;
	float mSliderVoltageDefaultValue = mSliderVoltageNotch;

	int   mSliderNumLanesMin = 7;
	int   mSliderNumLanesMax = 20;

	float mSliderGelRotateMax = 20.f;

	float mSliderAspectRatioMax = 16.f;
	int   mSliderAggregateMaxMultimer = 7;

	int   mSliderBaseCountMin = 1;
	int   mSliderBaseCountMax = mBaseCountHigh;


	void constrain()
	{
		// called by load() after json is parsed.
		mSliderMassMax				= mSampleMassHigh;
		mSliderDyeMassMax			= Dye::kMaxMass;
		mSliderVoltageDefaultValue	= mSliderVoltageNotch;
		mSliderBaseCountMax			= mBaseCountHigh;
	}
		
};
extern       Tuning  gTuning;
extern const Tuning &kTuning;



struct Context
{
	float	mVoltage		= kTuning.mSliderVoltageDefaultValue;
	float	mTime			= 1.f;
	float	mYSpaceScale	= 1.f;
	float	mWellDamage		= 0.f; // 0..1; same for all wells (for now)
	
	Gelbox::Buffer mGelBuffer;
	Gelbox::Buffer mSampleBuffer;	
};

std::vector<Band> fragToBands(
	const Sample&	sample,
	int				fragi,
	ci::Rectf		wellRect,
	int				lane,
	Context			context );

} // namespace
