//
//  GelSim.h
//  Gelbox
//
//  Created by Chaim Gingold on 1/31/18.
//
//

#pragma once

namespace GelSim
{


/*
	Tuning Values 
*/
const float kSampleMassHigh = 125.f; // 125ml
const int   kBaseCountHigh  = 14000;


/*
	Degrade [0..2]
	
	- as degrade goes 0..1, y2, baseCountLow,  lower end of band, moves to end of chart--shorter base pairs
	- as degrade goes 1..2, y1, baseCountHigh, upper end of band, moves to end of chart--shorter bp
*/
void degradeBaseCount( int& baseCountHigh, int& baseCountLow, float degrade );


/*
	Calc Delta Y
	
	How far on a normalized y axis of gel will this sample move?
*/
float calcDeltaY( int bases, int aggregation, float aspectRatio, float time );

float calcDiffusionInflation( int bases, int aggregation, float aspectRatio, float time ); // returns same units as above


} // namespace