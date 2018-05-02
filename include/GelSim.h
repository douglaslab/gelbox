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

class Sample;

namespace GelSim // unify namespace with Gelbox? (rename both Gelbox?)
{


/*
	Tuning Values 
*/
const float kSampleMassHigh = 125.f; // 125ml
const int   kBaseCountHigh  = 14000;


/*
 * Slider Tuning Values
 */

const int   kSliderTimelineMaxMinutes = 60 * 3; // 3 hrs

const float kSliderMassMax	  = kSampleMassHigh;
const float kSliderDyeMassMax = kSampleMassHigh; // set to Dye::kMaxMass UNIFY

const float kSliderVoltageLow   = -300;
const float kSliderVoltageHigh  =  300;
const float kSliderVoltageNotch =  70;
const float kSliderVoltageDefaultValue = kSliderVoltageNotch;

const float kSliderAspectRatioMax = 16.f;
const int   kSliderAggregateMaxMultimer = 7;

const int   kSliderBaseCountMax = kBaseCountHigh;



/*
	Degrade [0..2]
	
	- as degrade goes 0..1, y2, baseCountLow,  lower end of band, moves to end of chart--shorter base pairs
	- as degrade goes 1..2, y1, baseCountHigh, upper end of band, moves to end of chart--shorter bp
*/
//void degradeBaseCount( int& baseCountHigh, int& baseCountLow, float degrade );


//float calcDiffusionInflation( Input ); // returns same units as above
//float calcFlames( bool isDye, float mass ); // normalized to height of band
//float calcBrightness( Input ); // 0..1
//float calcThickness ( Input ); // 0..1, proportional to well


/// NEW ////

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

float calcDeltaY( int bases, int aggregation, float aspectRatio, Context ctx );
	// 	How far on a normalized y axis of gel will this sample move?

} // namespace
