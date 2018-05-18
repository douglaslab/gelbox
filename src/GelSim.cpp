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
	Degrade [0..2]
	
	- as degrade goes 0..1, y2, baseCountLow,  lower end of band, moves to end of chart--shorter base pairs
	- as degrade goes 1..2, y1, baseCountHigh, upper end of band, moves to end of chart--shorter bp
*/

void calcDegrade( int bases, float degrade, int& degradeLo, int& degradeHi )
{
	// as degrade goes 0..1, band.y2 moves to end of chart--shorter base pairs (degradeLo)
	// as degrade goes 1..2, band.y1 moves to end of chart--shorter bp (degradeHi)
	
	degradeLo = min( 1.f, degrade ) * (float)bases;
	
	if ( degrade > 1.f ) degradeHi = min( 1.f, degrade - 1.f ) * (float)bases;		
	else degradeHi = 0;
}

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

float calcFlames( float mass )
{
	// not for dyes
	
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

int calcRandSeed( const Band& b, Context context )
{
	return
		b.mLane * 17
//		  + i.mFragment * 13 // this means insertions, etc... will shuffle coherency
//		  + i.mBases[0] * 1080
//		  + i.mDye * 2050
	  + (int)(b.mRect.y1)
//		  + (int)(mGel->getTime() * 100.f)
	  + (int)(context.mVoltage * 200.f)
	  + (int)(b.mMass * 10.f)
	  ;	
}

int calcWellDamageRandSeed( const Band& b, Context context )
{
	return
		b.mLane * 23
	  ;	
}

float calcBandAlpha ( float mass, float degrade )
{
	float a = constrain( mass / GelSim::kSampleMassHigh, 0.1f, 1.f );
	
	float d = degrade / 2.f;
	d = powf( d, .5f );
	a *= 1.f - d;
	
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

float calcBandDiffusion( int bases, int aggregation, float aspectRatio, Context ctx )
{
	// TODO: consider ctx.mYSpaceScale?
	
	const int kThresh = 1500;
	const int kUpperThresh = 10000;
	const float kThreshAmount = 2.f; 
	const float kTinyScale = 16.f;
	const float kBaseline = 1.f;
	
	float v;
	
	if ( bases > kThresh )
	{
		v = lmap( (float)bases, (float)kThresh, (float)kUpperThresh, (float)kThreshAmount, (float)0.f );
		
		v = max( 0.f, v ); // in case bases is out of bounds
		
		v += kBaseline;
	}
	else
	{
		v = (float)(kThresh - bases) / (float)kThresh;
		// v 0..1
		
		v = kBaseline + kThreshAmount + (v * kTinyScale);		
	}

	// time, voltage
	v *= ctx.mTime;
	v *= fabsf(ctx.mVoltage) / kSliderVoltageDefaultValue; // normalize to default

	// min
	v = max( 1.f, v );	
	
	// done
	return v;
}

Band calcBandGeometry( Context ctx, Band b, Rectf wellRect, float fatness )
{
	float deltaY1, deltaY2;
	
	if ( b.mMass > kSampleMassTooHighStuckInWellThreshold )
	{
		deltaY1 = deltaY2 = 0.f;
	}
	else {
		deltaY1 = calcDeltaY( b.mBases - b.mDegradeHi, b.mAggregate, b.mAspectRatio, ctx );
		deltaY2 = calcDeltaY( b.mBases - b.mDegradeLo, b.mAggregate, b.mAspectRatio, ctx );
	}
		
	deltaY1 *= ctx.mYSpaceScale;
	deltaY2 *= ctx.mYSpaceScale;
	
	b.mWellRect = wellRect;
	b.mRect		= wellRect;
	
	b.mRect.y1 += deltaY1;
	b.mRect.y2 += deltaY1;
	
	b.mSmearBelow = (b.mWellRect.y2 + deltaY2) - b.mRect.y2;

	float fatscale = ctx.mTime;
	b.mRect.inflate( vec2( 0.f, (fatness-1.f) * fatscale * .5f * b.mRect.getHeight() ) );
	
	b.mUIRect	= b.mRect;
	b.mUIRect.y1 -= max( b.mSmearAbove, b.mFlameHeight );
	b.mUIRect.y2 += b.mSmearBelow;
	b.mUIRect.inflate(vec2(b.mBlur));

	return b;
}

Band dyeToBand( int lane, int fragi, int dye, float mass, Context context, Rectf wellRect )
{
	assert( Dye::isValidDye(dye) );
	
	Band b;
	
	b.mLane			= lane;
	b.mFragment 	= fragi;
	b.mDye			= dye;

	b.mBases		= Dye::kBPLo[dye];
	b.mMass			= mass;
	
	b.mColor		= Dye::kColors[dye];
	b.mColor.a		= calcBandAlpha(mass,0.f);
	b.mFocusColor	= lerp( Color(b.mColor), Color(0,0,0), .5f );
	
	b.mBlur			= calcBandDiffusion( b.mBases, 1, 1.f, context );
//	if (dye==0) cout << b.mBlur << endl;
//	b.mBlur = (dye<3) ? 0 : 2;
	
	b = calcBandGeometry( context, b, wellRect, kWellToDyeHeightScale );

	// users mRect, so must come after calcBandGeometry
	b.mRandSeed				= calcRandSeed( b, context );
	b.mWellDamageRandSeed	= calcWellDamageRandSeed( b, context ); 
	b.mWellDamage			= context.mWellDamage;
	
	return b;
}

Band fragAggregateToBand(
	int		lane,
	int		fragi,
	const Sample::Fragment& frag,
	int		aggregate,
	float	massScale,
	Context context,
	Rectf	wellRect )
{
	assert( aggregate > 0 );
	
	Band b;

	b.mLane			= lane;
	b.mFragment		= fragi;
	
	b.mBases		= frag.mBases;
	b.mAggregate	= aggregate;
	
	calcDegrade( b.mBases, frag.mDegrade, b.mDegradeLo, b.mDegradeHi );
	
	b.mMass			= frag.mMass * massScale;
	b.mAspectRatio	= frag.mAspectRatio;
	
	b.mFocusColor	= frag.mColor;
	b.mColor		= ColorA( 1.f, 1.f, 1.f, calcBandAlpha(b.mMass,frag.mDegrade) );

	b.mBlur			= calcBandDiffusion( b.mBases, b.mAggregate, b.mAspectRatio, context );

	b = calcBandGeometry( context, b, wellRect, 2.f );

	// users mRect, so must come after calcBandGeometry
	b.mRandSeed				= calcRandSeed( b, context );
	b.mWellDamageRandSeed	= calcWellDamageRandSeed( b, context ); 
	b.mWellDamage			= context.mWellDamage;
	
	b.mSmileHeight = b.mRect.getHeight() * .35f; 
	b.mSmileExp = 4.f;
	
	b.mFlameHeight = b.mRect.getHeight() * GelSim::calcFlames(b.mMass);	
	b.mUIRect.y1 -= b.mFlameHeight;
	
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
		result.push_back(
			dyeToBand(
				lane,
				fragi,
				frag.mDye,
				frag.mMass,
				context,
				wellRect ) );
	};
	
	auto addMonomer = [=,&result]()
	{
		result.push_back(
			fragAggregateToBand(
				lane,
				fragi,
				frag,
				1,
				1.f,
				context,
				wellRect ) );
	};

	auto addMultimer = [=,&result]( float asum )
	{
		// add band for each multimer size
		for( int m=0; m<frag.mAggregate.size(); ++m )
		{
			if ( frag.mAggregate[m] > 0.f )
			{
				float massScale = (frag.mAggregate[m] / asum);
				
				result.push_back(
					fragAggregateToBand(
						lane,
						fragi,
						frag,
						m+1,
						massScale,
						context,
						wellRect ) );
			}
		}
	};	

	// do it
	const float asum = frag.mAggregate.calcSum();

	if ( frag.mDye >= 0 )
	{
		if ( frag.mMass > 0.f ) addDye();
	}
	else if ( frag.mAggregate.empty() || asum==0.f ) addMonomer();
	else											 addMultimer(asum);
	
	//
	return result;
}

} // namespace
