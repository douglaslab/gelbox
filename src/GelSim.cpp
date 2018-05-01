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

/*
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

float calcBandAlpha ( const Band& b, int i )
{
//	if ( b.mDye != -1 ) return b.mMass;
//	else
	{
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
		
		return a;
	}
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
	
	auto addBand = [=,&result]( int multimer, int multimerlow, float multilowfrac, float massFrac )
	{
		Band b;

		b.mLane			= lane;
		b.mFragment		= fragi;
		
		b.mFocusColor	= frag.mColor;
		
		b.mBases[0]		= frag.mBases;
		b.mBases[1]		= frag.mBases;
		GelSim::degradeBaseCount( b.mBases[0], b.mBases[1], frag.mDegrade );
				
		b.mMultimer[0]  = multimer;
		b.mMultimer[1]  = multimerlow;
		
//		b.mMass			= frag.mMass  * (float)multimer * massFrac;
		b.mMass			= frag.mMass  * massFrac;
		
		b.mDegrade		= frag.mDegrade;
		
		b.mWellRect		= wellRect;
		b.mAspectRatio  = frag.mAspectRatio;
		
		if (multimer != 1)
		{
			int n  = multimer-1;
			int n2 = multimerlow-1;

			b.mAggregate.resize( max( frag.mAggregate.size(), (size_t)max(n,n2) ), 0.f );
				// ensure we have an appropriate aggregate array
			
			b.mAggregate[n ] = 1.f;
			if (n2 != n) b.mAggregate[n2] = multilowfrac;
		}
		else assert( multimerlow == 1 );
		
		b.mColor		= Color(1.f,1.f,1.f);
		
		b = calcBandState(b);
		
		result.push_back(b);
	};
	
	auto addDye = [=,&result]()
	{
		assert( Dye::isValidDye(frag.mDye) );
		
		if ( frag.mMass > 0.f ) // make sure it's not empty!
		{	
			Band b;

			b.mLane			= lane;
			b.mFragment		= fragi;
			b.mDye			= frag.mDye;

			b.mColor		= Dye::kColors[frag.mDye]; 
			b.mFocusColor	= lerp( Color(b.mColor), Color(0,0,0), .5f );
			
			b.mBases[0]		= ( Dye::kBPLo[frag.mDye] + Dye::kBPHi[frag.mDye] ) / 2;
			b.mBases[1]		= b.mBases[0];
					
			b.mMultimer[0]  = 1;
			b.mMultimer[1]  = 1;
			
			b.mMass			= frag.mMass;
			
			b.mDegrade		= 0.f;
			
			b.mWellRect		= wellRect;
			b.mAspectRatio  = 1.f;
			
			b = calcBandState(b);
			
			result.push_back(b);			
		}
	};
	
	auto addMonomer = [=]( int fragi )
	{
		addBand( 1, 1, 0.f, 1.f );
	};

	
	const float kMultimerSmearFrac = .2f;
	// smear is X% of total
	// and we scale the rest to 1-X% -- NOT doing this; lets keep things looking sharp.
	//		anyways physical asumptions/math isn't quite right
	
		
	auto addMultimer = [=]( float wsum )
	{
		int bandhi, bandlo;
//			int numNonZeroMultimers =
		frag.calcAggregateRange(bandlo,bandhi);
					
		// add band for each multimer size
		for( int m=0; m<frag.mAggregate.size(); ++m )
		{
			if ( frag.mAggregate[m] > 0.f )
			{
				// add
				float scale = 1.f;
				
//					if (numNonZeroMultimers>1) scale = 1.f - kMultimerSmearFrac;
				
				addBand( m+1, m+1, 0.f, (frag.mAggregate[m] / wsum) * scale );
			}
		} // m
		
		// smeary band between each pair of multimers
		if ( bandlo != -1 && bandlo != bandhi )
		{
			int last = bandlo;
			
			for( int i = last+1; i <= bandhi; ++i )
			{
				if ( frag.mAggregate[i] > 0.f )
				{
					// multimer smeary interpolation band between last .. i
					float iratio = frag.mAggregate[last] / frag.mAggregate[i];  
					
					addBand( i+1, last+1, iratio, kMultimerSmearFrac );					
					
					// set up for next band
					last = i;
				}					
			}
		}
	};	

	// do it
	const float wsum = frag.calcAggregateWeightedSum();

	if      ( frag.mDye >= 0 )						 addDye();
	else if ( frag.mAggregate.empty() || wsum==0.f ) addMonomer(wsum);
	else											 addMultimer(wsum);
	
	return result;
}

/*

GelSim::Input Gel::gelSimInput ( const Band& b ) const 
{
	GelSim::Input gsi;
	gsi.mBases			= b.mBases;
	gsi.mMass			= b.mMass;
	gsi.mIsDye			= b.mDye != -1;
	
	gsi.mAggregation	= b.mAggregate;
	gsi.mAspectRatio	= b.mAspectRatio;
	
	gsi.mVoltage		= mVoltage;
	gsi.mTime			= mTime;
	
	gsi.mGelBuffer		= mBuffer;
	gsi.mSampleBuffer	= mSamples[b.mLane]->mBuffer;
	return gsi;
};
*/

} // namespace
