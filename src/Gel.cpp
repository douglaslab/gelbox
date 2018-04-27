//
//  Gel.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 12/4/17.
//
//

#include "Gel.h"
#include "Sample.h"
#include "GelSim.h"

using namespace std;
using namespace ci;

const vec2 kLaneVec(1,0);
const vec2 kPosVec (0,1);

Gel::Gel()
{
	mVoltage = GelSim::kSliderVoltageDefaultValue;
}

void Gel::setLayout(
	float		lane_dimension, 
	float		pos_elec_dimension,
	int			numLanes,
	float		ymargin )
{
	mYMargin = ymargin;
	
	mSize = vec2( lane_dimension, pos_elec_dimension );
	
	mNumLanes  = numLanes;
	mLaneWidth = mSize.x / (float)numLanes;
	
	mSamples.resize(numLanes);
}

int Gel::getLaneForSample( SampleRef sample ) const
{
	for( int i=0; i<mNumLanes; ++i )
	{
		if ( mSamples[i] == sample )
		{
			return i;
		}
	}
	
	return -1;
}

void Gel::setSample( SampleRef s, int lane )
{
	assert( lane >= 0 && lane < mNumLanes );

	mSamples[lane]=s;

	clearSamples(lane);

	if (s) insertSample( *s, lane );
}

void Gel::syncBandsToSample( SampleRef sample )
{
	int lane = getLaneForSample(sample);
	
	// check
	assert( lane >= 0 && lane < mNumLanes );
	
	// update
	clearSamples(lane);
	
	if ( mSamples[lane] )
	{
		insertSample( *mSamples[lane], lane );
	}
}

void Gel::setBuffer( const Gelbox::Buffer& b )
{
	mBuffer = b;
	
	updateBands();
}

ci::vec2 Gel::getWellSize() const
{
	return vec2(
		mLaneWidth * .5f,
		mLaneWidth * .1f
		);
}

ci::Rectf Gel::getWellBounds( int lane ) const
{
	vec2 laneLoc = vec2(0.f,mYMargin) + kLaneVec * ((float)lane*mLaneWidth + mLaneWidth/2.f);
	
	Rectf r( vec2(0.f), getWellSize() );
	
	r.offsetCenterTo(laneLoc); // yay aliasing. dumbest function ever
	
	return r;
}

vector<Band>
Gel::fragToBands( const Sample& sample, int fragi, int lane ) const
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
		
		b.mWellRect	= getWellBounds(lane);
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
		
//		b.mBounds		= calcBandBounds(b);
//		b.mAlpha[0]		= calcBandAlpha (b,0);
//		b.mAlpha[1]		= calcBandAlpha (b,1);
		updateBandState(b);
		
		b.mColor.a = calcBandAlpha(b,0);
		
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
			
			b.mWellRect	= getWellBounds(lane);
			b.mAspectRatio  = 1.f;
			
//			b.mBounds		= calcBandBounds(b);
//			b.mAlpha[0]		= frag.mMass; //calcBandAlpha (b,0);
//			b.mAlpha[1]		= frag.mMass; //calcBandAlpha (b,1);
			updateBandState(b);
			
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
};

void Gel::insertSample( const Sample& src, int lane )
{
	// fragments
	for( int fragi=0; fragi<src.mFragments.size(); ++fragi )
	{		
		vector<Band> bands;
		
		bands = fragToBands( src, fragi, lane );
		
		mBands.insert( mBands.end(), bands.begin(), bands.end() );
	}
}

void Gel::clearSamples( int lane )
{
	std::vector<Band> nb;
	
	for( const auto &b : mBands )
	{
		if (b.mLane != lane) nb.push_back(b);
	}
	
	mBands = nb;
}

void Gel::stepTime ( float dt )
{
	mTime += dt;
	mTime = min( mTime, mDuration );
	updateBands();
}

void Gel::setTime( float t )
{
	mTime = t;
	updateBands();
}

void Gel::setVoltage( float v )
{
	mVoltage = v;
	updateBands();
}

void Gel::updateBands()
{
	for( auto &b : mBands )
	{
		updateBandState(b);
	}
}

GelSim::Input Gel::gelSimInput ( const Band& b, int i ) const 
{
	GelSim::Input gsi;
	gsi.mBases			= b.mBases[i];
	gsi.mMass			= b.mMass;
	gsi.mIsDye			= b.mDye != -1;
	
	gsi.mAggregation	= b.mMultimer[i];
	gsi.mAspectRatio	= b.mAspectRatio;
	
	gsi.mVoltage		= mVoltage;
	gsi.mTime			= mTime;
	
	gsi.mGelBuffer		= mBuffer;
	gsi.mSampleBuffer	= mSamples[b.mLane]->mBuffer;
	return gsi;
};

void Gel::updateBandState( Band& b ) const
{
	// band bounds
	const float ySpaceScale = getSampleDeltaYSpaceScale();	
//	const float thicknessNorm = GelSim::calcThickness(<#GelSim::Input#>) ;
	
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
	
	// alpha
	// -- can depend on shape
//	b.mAlpha[0] = calcBandAlpha (b,0);
//	b.mAlpha[1] = calcBandAlpha (b,1);
}

float Gel::calcBandAlpha ( const Band& b, int i ) const
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
			float diffuseScale = area( getWellBounds(b.mLane) ) / area(b.mRect);
			// for diffusion, look at ratio of areas
			
			diffuseScale = powf( diffuseScale, .15f ); // tamp it down so we can still see things
			diffuseScale = max ( diffuseScale, .1f  );
			
			a *= diffuseScale;
		}
		
		return a;
	}
}

const Band*
Gel::getSlowestBandInFragment( int lane, int frag ) const
{
	const Band* b=0;
	
	for( const Band& band : mBands )
	{
		if ( band.mLane==lane && band.mFragment==frag )
		{
			if ( !b || band.mRect.y1 < b->mRect.y1 )
			{
				b=&band;
			}
		}
	}
	
	return b;
}

Band Gel::getSlowestBandInFragment( Band query )
{
	const Band* biggestBand = getSlowestBandInFragment(query.mLane, query.mFragment);
	assert(biggestBand);
	return *biggestBand;	
}
