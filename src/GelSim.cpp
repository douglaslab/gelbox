//
//  GelSim.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 1/31/18.
//
//

#include "GelSim.h"

using namespace std;
using namespace ci;

namespace GelSim {

void degradeBaseCount( int& baseCountHigh, int& baseCountLow, float degrade )
{
	// as degrade goes 0..1, y2 moves to end of chart--shorter base pairs
	// as degrade goes 1..2, y1 moves to end of chart--shorter bp
	
	baseCountLow -= min( 1.f, degrade ) * (float)baseCountLow;
	
	if ( degrade > 1.f ) baseCountHigh -= min( 1.f, degrade - 1.f ) * (float)baseCountHigh;		
	
	baseCountLow  = max( 1, baseCountLow  );
	baseCountHigh = max( 1, baseCountHigh );
	
//	y2b -= min( 1.f, b.mDegrade ); // as degrade goes 0..1, y2 moves to end of chart--shorter base pairs
//	if ( b.mDegrade > 1.f ) y1b -= min( 1.f, b.mDegrade - 1.f ); // as degrade goes 1..2, y1 moves to end of chart--shorter bp  
}

float calcDeltaY( int bases, int aggregation, float aspectRatio, float time )
{
	// Constants
	const int   kHighBaseCountNorm = 10000;
	
	const float kHighAspectRatio   = 16.f;
	const float kAspectRatioScale  = .25f;
	
	const float kCurveExp = 3.7f;
	const float kCurveBase = .05f;
	
	
	float y;
	
	// size
	y  = bases * aggregation;
	
	// normalize
	y /= (float)kHighBaseCountNorm;
	y  = constrain( y, 0.f, 1.f );
	
	// aspect ratio
	float aspectDelta = ((aspectRatio - 1.f) / kHighAspectRatio) * kAspectRatioScale;
	y -= aspectDelta * time ;
		// longer aspect ratio makes it behave 
	
	// curve
	y = kCurveBase + powf( 1.f - y, kCurveExp );
	
	// time
	y *= time;
	
	// return
	return y;
}


} // namespace