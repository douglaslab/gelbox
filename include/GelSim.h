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
	float mWellToHeightScale	= 2.f;
	//float mSampleMassTooHighStuckInWellThreshold = 150.f;

	float mSmearUpWithH2O		 = 2.f;
	float mSmearUpWithWellDamage = 2.f;
	float mSmearUpWithWellDamageThreshold = .5f;
	
	struct DeltaY
	{
		float mCurveExp			= 3.7f;
		float mCurveBase		= .05f;
		float mAspectRatioScale = .06f; 
	}
	mDeltaY;
	
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


void calcDegradeAsFrac( float degrade, float& degradeLo, float& degradeHi );
	//	as degrade goes 0..1, y2, degradeLo, lower end of band, goes to 1
	//	as degrade goes 1..2, y1, degradeHi, upper end of band, goes to 1

void calcDegradeAsBP  ( float degrade, int bases, int& degradeLo, int& degradeHi );
	// as degrade goes 0..1, band.y2 moves to end of chart--shorter base pairs (degradeLo)
	// as degrade goes 1..2, band.y1 moves to end of chart--shorter bp (degradeHi)

} // namespace
