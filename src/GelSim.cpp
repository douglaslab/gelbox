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

	  Tuning  gTuning;
const Tuning &kTuning = gTuning;

void Tuning::load( const JsonTree& json )
{
	auto getf = [json]( string key, float& v )
	{
		if ( json.hasChild(key) ) {
			v = json.getChild(key).getValue<float>();
		}
	};

	auto geti = [json]( string key, int& v )
	{
		if ( json.hasChild(key) ) {
			v = json.getChild(key).getValue<int>();
		}
	};

	getf("SampleMassHigh",mSampleMassHigh);
	geti("BaseCountHigh",mBaseCountHigh);
	getf("WellToDyeHeightScale",mWellToDyeHeightScale);	
	getf("WellToHeightScale",mWellToHeightScale);	
	getf("SmearUpWithH2O",mSmearUpWithH2O);
	getf("SmearUpWithWellDamage",mSmearUpWithWellDamage);
	getf("SmearUpWithWellDamageThreshold",mSmearUpWithWellDamageThreshold);
	
	getf("DeltaY.CurveExp",mDeltaY.mCurveExp);
	getf("DeltaY.CurveBase",mDeltaY.mCurveBase);
	getf("DeltaY.CurveBaseTAE",mDeltaY.mCurveBaseTAE);
	getf("DeltaY.AspectRatioScale",mDeltaY.mAspectRatioScale);
  	
	geti("Slider.TimelineMaxMinutes",mSliderTimelineMaxMinutes);
	getf("Slider.MassMin",mSliderMassMin);
	getf("Slider.MassMax",mSliderMassMax);
	getf("Slider.DyeMassMin",mSliderDyeMassMin);
	getf("Slider.DyeMassMax",mSliderDyeMassMax);
	getf("Slider.VoltageLow",mSliderVoltageLow);
	getf("Slider.VoltageHigh",mSliderVoltageHigh);
	getf("Slider.VoltageNotch",mSliderVoltageNotch);
	getf("Slider.VoltageDefaultValue",mSliderVoltageDefaultValue);
	geti("Slider.NumLanesMin",mSliderNumLanesMin);
	geti("Slider.NumLanesMax",mSliderNumLanesMax);
	getf("Slider.GelRotateMax",mSliderGelRotateMax);
	getf("Slider.AspectRatioMax",mSliderAspectRatioMax);
	geti("Slider.AggregateMaxMultimer",mSliderAggregateMaxMultimer);
	geti("Slider.BaseCountMin",mSliderBaseCountMin);
	geti("Slider.BaseCountMax",mSliderBaseCountMax);
	
	constrain();
}

/*
	Degrade [0..2]
	
	- as degrade goes 0..1, y2, baseCountLow,  lower end of band, moves to end of chart--shorter base pairs
	- as degrade goes 1..2, y1, baseCountHigh, upper end of band, moves to end of chart--shorter bp
*/

void calcDegradeAsFrac( float degrade, float& degradeLo, float& degradeHi )
{
	degradeLo = min( 1.f, degrade );

	if ( degrade > 1.f ) degradeHi = min( 1.f, degrade - 1.f );		
	else degradeHi = 0.f;
}

void calcDegradeAsBP( float degrade, int bases, int& degradeLo, int& degradeHi )
{
	// as degrade goes 0..1, band.y2 moves to end of chart--shorter base pairs (degradeLo)
	// as degrade goes 1..2, band.y1 moves to end of chart--shorter bp (degradeHi)
	
	float loScale, hiScale;
	calcDegradeAsFrac(degrade, loScale, hiScale);
	
	degradeLo = loScale * (float)bases;
	degradeHi = hiScale * (float)bases;
	
	// don't go to zero
	degradeLo = max( 1, degradeLo );
	degradeHi = max( 1, degradeHi );
}

float calcDeltaY( int bases, int aggregation, float aspectRatio, Context ctx )
{
	// Constants
	const int   kHighBaseCountNorm = kTuning.mBaseCountHigh;
	
	const float kHighAspectRatio	= kTuning.mSliderAspectRatioMax;
	const float kAspectRatioScale	= kTuning.mDeltaY.mAspectRatioScale;
	
	const float kCurveExp			= kTuning.mDeltaY.mCurveExp;
	const float kCurveBase			=
		ctx.mGelBuffer == Gelbox::Buffer::TAE()
			? kTuning.mDeltaY.mCurveBaseTAE
			: kTuning.mDeltaY.mCurveBase;
	
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
	if ((0))
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
	float vn = (ctx.mVoltage - kTuning.mSliderVoltageDefaultValue) / kTuning.mSliderVoltageDefaultValue; // using UI value since I hacked this param in and want it to behave the same as it did before!
	y *= (1.f + vn * 1.f);
	
	// time
	y *= ctx.mTime;
	
	// return
	return y;
}

float calcFlames( float mass )
{
	// not for dyes
	
	const float kOverloadThresh = kTuning.mSampleMassHigh * .8f;
	
	float fh = 0.f;
	
	if ( mass > kOverloadThresh )
	{
		fh  = (mass - kOverloadThresh) / (kTuning.mSampleMassHigh - kOverloadThresh);
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
	float a = constrain( mass / kTuning.mSampleMassHigh, 0.f, 1.f );
	
	float d = degrade / 2.f;
	d = powf( d, .5f );
	a *= 1.f - d;
	
	a = powf( a, .75f ); // make it brighter
	
	return a;

	// Below--old code that dims with diffusion/spread of rectangle
	
	/*
	float a = calcBrightness( gelSimInput(b,i) );
	
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
	v *= fabsf(ctx.mVoltage) / kTuning.mSliderVoltageDefaultValue; // normalize to default

	// min
	v = max( 1.f, v );	
	
	// done
	return v;
}

Band calcBandGeometry( Context ctx, Band b, Rectf wellRect, float fatness )
{
	float deltaY1, deltaY2;
	
	/*if ( b.mMass > kSampleMassTooHighStuckInWellThreshold )
	{
		deltaY1 = deltaY2 = 0.f;
	}
	else*/ {
		deltaY1 = calcDeltaY( b.mBases - b.mDegradeHi, b.mAggregate, b.mAspectRatio, ctx );
		deltaY2 = calcDeltaY( b.mBases - b.mDegradeLo, b.mAggregate, b.mAspectRatio, ctx );
	}
		
	deltaY1 *= ctx.mYSpaceScale;
	deltaY2 *= ctx.mYSpaceScale;
	
	b.mWellRect = wellRect;
	b.mRect		= wellRect;
	
	// move
	b.mRect.y1 += deltaY1;
	b.mRect.y2 += deltaY1;
	
	// inflate
	float fatscale = ctx.mTime;
	b.mRect.inflate( vec2( 0.f, (fatness-1.f) * fatscale * .5f * b.mRect.getHeight() ) );

	// smear
	b.mSmearBelow = (b.mWellRect.y2 + deltaY2) - b.mRect.y2;
	
	if ( ctx.mGelBuffer == Gelbox::Buffer::h2o() ) {
		b.mSmearAbove = max( b.mSmearAbove, b.mRect.getHeight() * kTuning.mSmearUpWithH2O );
	}

    // Disabled for now by SD
	//if ( ctx.mWellDamage > kTuning.mSmearUpWithWellDamageThreshold ) {
	//	b.mSmearAbove = max( b.mSmearAbove, b.mRect.getHeight() * kTuning.mSmearUpWithWellDamage );
	//}
	
	// clip smear above with well bottom
	b.mSmearAbove = min( b.mSmearAbove, b.mRect.y1 - wellRect.y2 );
	
	// ui rect
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
	b.mBrightness	= calcBandAlpha(mass,0.f);
	b.mFocusColor	= lerp( Color(b.mColor), Color(0,0,0), .5f );
	
	b.mBlur			= calcBandDiffusion( b.mBases, 1, 1.f, context );
//	if (dye==0) cout << b.mBlur << endl;
//	b.mBlur = (dye<3) ? 0 : 2;
	
	b = calcBandGeometry( context, b, wellRect, kTuning.mWellToDyeHeightScale );

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
	
	calcDegradeAsBP( frag.mDegrade, b.mBases, b.mDegradeLo, b.mDegradeHi );
	
	b.mMass			= frag.mMass * massScale;
	b.mAspectRatio	= frag.mAspectRatio;
	
	b.mFocusColor	= frag.mColor;
	b.mColor		= Color( 1.f, 1.f, 1.f );
	
	// brightness
	{
		float a = calcBandAlpha(b.mMass,frag.mDegrade);
		float d = frag.mDegrade / 2.f; // just map total degradation value to 0..1
		
		b.mBrightness				= powf( a * (1.f - d), .5f );
		b.mSmearBrightnessBelow[0]	= powf( a * d,		   .5f );
		b.mSmearBrightnessAbove[0]  *= b.mBrightness;
	}

	b.mBlur			= calcBandDiffusion( b.mBases, b.mAggregate, b.mAspectRatio, context );

	b = calcBandGeometry( context, b, wellRect, kTuning.mWellToHeightScale );

	// users mRect, so must come after calcBandGeometry
	b.mRandSeed				= calcRandSeed( b, context );
	b.mWellDamageRandSeed	= calcWellDamageRandSeed( b, context ); 
	b.mWellDamage			= context.mWellDamage;
	
	b.mSmileHeight = b.mRect.getHeight() * .35f; 
	b.mSmileExp = 4.f;
	
	b.mFlameHeight = b.mRect.getHeight() * calcFlames(b.mMass);	
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
