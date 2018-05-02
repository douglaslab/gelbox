//
//  GelSim.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 1/31/18.
//
//

#include "GelSim.h"
#include "Sample.h"

using namespace std;
using namespace ci;

namespace GelSim {

/*
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
*/

float calcDeltaY( int bases, int aggregation, float aspectRatio, Context ctx )
{
	// Constants
	const int   kHighBaseCountNorm = kBaseCountHigh;
	
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
	y -= aspectDelta * ctx.mTime ;
		// longer aspect ratio makes it behave 

	// -------------------
	// TEST buffers
	if (1)
	{
		for( int p=0; p<Gelbox::Buffer::kNumParams; ++p )
		{
			y += (.01f * (float)(p+1)) * (ctx.mSampleBuffer.mValue[p] - ctx.mGelBuffer.mValue[p]);
		}
	}	
	// -------------------
	
	// curve
	y = kCurveBase + powf( 1.f - y, kCurveExp );
	
	// voltage
	float vn = (ctx.mVoltage - kSliderVoltageDefaultValue) / kSliderVoltageDefaultValue; // using UI value since I hacked this param in and want it to behave the same as it did before!
	y *= (1.f + vn * 1.f);
	
	// time
	y *= ctx.mTime;
	
	// return
	return y;
}

#if 0
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

float calcThickness ( Input i )
{
	return 1.f;
}

Band calcRenderParams( Input input, Band i )
{
	Band o=i;
			
	o.mColor.a  = GelSim::calcBrightness( input );
				
	o.mRect = i.mRect; // just pass in output rect for now (not mBands, since that is already inflated with blur)
	o.mBlur	= i.mBlur + 1;
	
	o.mFlameHeight = o.mRect.getHeight() * GelSim::calcFlames(i.mDye!=-1,i.mMass);
	
	o.mSmileHeight = o.mRect.getHeight() * .35f; 
	o.mSmileExp = 4.f;
	
//		o.mSmearBelow = o.mWellRect.getHeight() * 3.f;
//		o.mSmearAbove = o.mWellRect.getHeight() * 3.f;
	
	o.mRandSeed =
		i.mLane * 17
//		  + i.mFragment * 13 // this means insertions, etc... will shuffle coherency
//		  + i.mBases[0] * 1080
//		  + i.mDye * 2050
	  + (int)(i.mRect.y1)
//		  + (int)(mGel->getTime() * 100.f)
	  + (int)(input.mVoltage * 200.f)
	  + (int)(i.mMass * 10.f)
	  ; 
		
	
	return o;
}

Band calcBandState( const Band& i )
{
	Band b = i;
	
	// band bounds
	const float ySpaceScale = getSampleDeltaYSpaceScale();	
//	const float thicknessNorm = GelSim::calcThickness(GelSim::Input) ;
	
	b.mRect = b.mWellRect;
//	b.mRect.y1 = b.mRect.y2 - thicknessNorm * b.mWellRect.getHeight(); 
	
	b.mRect.y1 += GelSim::calcDeltaY( gelSimInput(b,0) ) * ySpaceScale;
	b.mRect.y2 += GelSim::calcDeltaY( gelSimInput(b,1) ) * ySpaceScale;
	
	// blur, bounds
	b.mBlur = GelSim::calcDiffusionInflation( gelSimInput(b,1) ) * ySpaceScale;
	b.mRect = b.mRect.inflated( vec2(b.mBlur) );
	b.mUIRect = b.mRect;
	// use smaller (faster, more inflation) size. we could use a poly, and inflate top vs. bottom differently.
	// with degradation, to see more diffusion we need to use [1], since that's what moves first
	
	// render params
	b = GelSim::calcRenderParams( gelSimInput(b,0), b );
	
	// alpha
	b.mColor.a = calcBandAlpha(b,0);
	
	//
	return b;
}
#endif

float calcBandAlpha ( const Band& b )
{
	float a = constrain( (b.mMass * (float)b.mAggregate) / GelSim::kSampleMassHigh, 0.1f, 1.f );

	a = powf( a, .5f ); // make it brighter
	
	return a;

	// Below--old code that dims with diffusion/spread of rectangle
	
	/*
	float a = GelSim::calcBrightness( gelSimInput(b,i) );
	
	auto area = []( Rectf r ) {
		return r.getWidth() * r.getHeight();
	};
	
	if (1)
	{
		float diffuseScale = area( b.mWellRect ) / area(b.mRect);
		// for diffusion, look at ratio of areas
		
		diffuseScale = powf( diffuseScale, .15f ); // tamp it down so we can still see things
		diffuseScale = max ( diffuseScale, .1f  );
		
		a *= diffuseScale;
	}
	
	return a;*/
}

Band calcBandGeometry( Context ctx, Band b, Rectf wellRect )
{
	float deltaY = calcDeltaY( b.mBases, b.mAggregate, b.mAspectRatio, ctx );
	
	deltaY *= ctx.mYSpaceScale;
	
	b.mWellRect = wellRect;
	b.mRect		= wellRect;
	b.mRect	   += vec2( 0.f, deltaY );
	b.mUIRect	= b.mRect;
	
	return b;
}

Band dyeToBand( int lane, int fragment, int dye, float mass )
{
	assert( Dye::isValidDye(dye) );
	
	Band b;
	
	b.mLane			= lane;
	b.mFragment 	= fragment;
	b.mDye			= dye;

	b.mBases		= Dye::kBPLo[dye];
	b.mMass			= mass;
	
	b.mColor		= Dye::kColors[dye];
	b.mColor.a		= calcBandAlpha(b);
	b.mFocusColor	= lerp( Color(b.mColor), Color(0,0,0), .5f );
	
	// not done:
	// - geometry
	// - render params (except mColor.rgb)
	
	return b;
}

Band fragAggregateToBand( int lane, int fragi, const Sample::Fragment& frag, int aggregate, float massScale )
{
	Band b;

	b.mLane			= lane;
	b.mFragment		= fragi;
	
	b.mBases		= frag.mBases;
	b.mAggregate	= aggregate;
	
	// not done: (TODO)
//	b.mDegradeLo;
//	b.mDegradeHi;
	
	b.mMass			= frag.mMass * massScale;
	b.mAspectRatio	= frag.mAspectRatio;
	
	b.mFocusColor	= frag.mColor;
	b.mColor		= ColorA( 1.f, 1.f, 1.f, calcBandAlpha(b) );

	// not done:
	// - geometry
	// - render params (except mColor.rgb)

	return b;	
}

std::vector<Band> fragToBands(
	const Sample&	sample,
	int				fragi,
	ci::Rectf		wellRect,
	int				lane,
	Context			context )
{
	const Sample::Fragment& frag = sample.mFragments[fragi];

	vector<Band> result;
	
	auto addDye = [=,&result]()
	{
		result.push_back( dyeToBand( lane, fragi, frag.mDye, frag.mMass) );
	};
	
	auto addMonomer = [=,&result]()
	{
		result.push_back( fragAggregateToBand( lane, fragi, frag, 1, 1.f ) );
	};

	auto addMultimer = [=,&result]( float wsum )
	{
		// add band for each multimer size
		for( int m=0; m<frag.mAggregate.size(); ++m )
		{
			if ( frag.mAggregate[m] > 0.f )
			{
				float massScale = (frag.mAggregate[m] / wsum);
				
				result.push_back( fragAggregateToBand( lane, fragi, frag, m, massScale ) );
			}
		}
	};	

	// do it
	const float wsum = frag.calcAggregateWeightedSum();

	if      ( frag.mDye >= 0 && frag.mMass > 0.f )	 addDye();
	else if ( frag.mAggregate.empty() || wsum==0.f ) addMonomer();
	else											 addMultimer(wsum);
	
	// finish them
	for( auto &b : result )
	{
		b = calcBandGeometry( context, b, wellRect );
	}
	
	//
	return result;
}

} // namespace
