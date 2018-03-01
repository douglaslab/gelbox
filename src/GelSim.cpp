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

Output calc( Input i )
{
	Output o;
	o.mThickness	= calcThickness(i);
	o.mBrightness	= calcBrightness(i);

	o.mDeltaY		= calcDeltaY(i);
	o.mDiffusion	= calcDiffusionInflation(i);
	o.mFlames		= calcFlames(i.mIsDye,i.mMass);
	// smile
	// smile xp
	return o;
}

float calcDeltaY( Input i )
{
	// Constants
	const int   kHighBaseCountNorm = kBaseCountHigh;
	
	const float kHighAspectRatio   = 16.f;
	const float kAspectRatioScale  = .25f;
	
	const float kCurveExp = 3.7f;
	const float kCurveBase = .05f;
	
	
	float y;
	
	// size
	y  = i.mBases * i.mAggregation;
	
	// normalize
	y /= (float)kHighBaseCountNorm;
	y  = constrain( y, 0.f, 1.f );
	
	// aspect ratio
	float aspectDelta = ((i.mAspectRatio - 1.f) / kHighAspectRatio) * kAspectRatioScale;
	y -= aspectDelta * i.mTime ;
		// longer aspect ratio makes it behave 

	// -------------------
	// TEST buffers
	if (1)
	{
		for( int p=0; p<Gelbox::Buffer::kNumParams; ++p )
		{
			y += (.01f * (float)(p+1)) * (i.mSampleBuffer.mValue[p] - i.mGelBuffer.mValue[p]);
		}
	}	
	// -------------------
	
	// curve
	y = kCurveBase + powf( 1.f - y, kCurveExp );
	
	// voltage
	float vn = (i.mVoltage - kSliderVoltageDefaultValue) / kSliderVoltageDefaultValue; // using UI value since I hacked this param in and want it to behave the same as it did before!
	y *= (1.f + vn * 1.f);
	
	// time
	y *= i.mTime;
	
	// return
	return y;
}

float calcDiffusionInflation( Input i )
{
	const float kFraction = .01f;
	
	return kFraction * calcDeltaY(i);
}

float calcFlames( bool isDye, float mass )
{
	if (isDye) return 0.f;
	else
	{
		const float kOverloadThresh = GelSim::kSampleMassHigh * .8f;
		
		float fh = 0.f;
		
		if ( mass > kOverloadThresh )
		{
			fh  = (mass - kOverloadThresh) / (GelSim::kSampleMassHigh - kOverloadThresh);
	//		fh *= o.mWellRect.getHeight() * 2.f;
			fh *= 2.f;
		}
		
		return fh;
	}
}

float calcBrightness( Input i )
{
	float a = constrain( (i.mMass * (float)i.mAggregation) / GelSim::kSampleMassHigh, 0.1f, 1.f );

	a = powf( a, .5f ); // make it brighter
	
	return a;
}

float calcThickness ( Input i )
{
	return 1.f;
}

} // namespace