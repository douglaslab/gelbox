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

class Sample;

namespace GelSim // unify namespace with Gelbox? (rename both Gelbox?)
{


/*
	Tuning Values 
*/
const float kSampleMassHigh = 175.f; // 175ml
const int   kBaseCountHigh  = 14000;

const float kWellToDyeHeightScale = 4.f;
const float kSampleMassTooHighStuckInWellThreshold = 150.f;

/*
 * Slider Tuning Values
 */

const int   kSliderTimelineMaxMinutes = 60 * 3; // 3 hrs

const float kSliderMassMin	  = 1.f;
const float kSliderMassMax	  = kSampleMassHigh;
const float kSliderDyeMassMin = 0.f;
const float kSliderDyeMassMax = Dye::kMaxMass;

const float kSliderVoltageLow   = -300;
const float kSliderVoltageHigh  =  300;
const float kSliderVoltageNotch =  70;
const float kSliderVoltageDefaultValue = kSliderVoltageNotch;

const int   kSliderNumLanesMin = 7;
const int   kSliderNumLanesMax = 20;

const float kSliderGelRotateMax = 20.f;

const float kSliderAspectRatioMax = 16.f;
const int   kSliderAggregateMaxMultimer = 7;

const int   kSliderBaseCountMin = 1;
const int   kSliderBaseCountMax = kBaseCountHigh;



struct Context
{
	float	mVoltage		= kSliderVoltageDefaultValue;
	float	mTime			= 1.f;
	float	mYSpaceScale	= 1.f;
	
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
