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

ci::Rectf Gel::getWellBounds( int lane ) const
{
	vec2 laneLoc = vec2(0.f,mYMargin) + kLaneVec * ((float)lane*mLaneWidth + mLaneWidth/2.f);
	
	float w = mLaneWidth * .5f ;
	float h = mLaneWidth * .1f ;
	
	Rectf r(0,0,w,h);
	
	r.offsetCenterTo(laneLoc); // yay aliasing. dumbest function ever
	
	return r;
}

void Gel::insertSample( const Sample& src, int lane )
{
	auto addBand = [=]( int fragi, int multimer, int multimerlow, float multilowfrac, float massFrac ) -> Band&
	{
		const auto& frag = src.mFragments[fragi]; 

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
		
		b.mStartBounds	= getWellBounds(lane);
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
		
		b.mCreateTime	= 0.f; // always start it at the start (not mTime); otherwise is kind of silly...
		b.mExists		= true;
		b.mColor		= Color(1.f,1.f,1.f);
		
		b.mBounds		= calcBandBounds(b);
		b.mAlpha[0]		= calcBandAlpha (b,0);
		b.mAlpha[1]		= calcBandAlpha (b,1);
		
		mBands.push_back(b);	
		return mBands.back();
	};
	
	auto addDye = [=]( int fragi )
	{
		const Sample::Fragment& frag = src.mFragments[fragi];
		
		assert( Dye::isValidDye(frag.mDye) );
		
		if ( frag.mMass > 0.f ) // make sure it's not empty!
		{	
			Band b;

			b.mLane			= lane;
			b.mFragment		= fragi;
			b.mDye			= frag.mDye;

			b.mColor		= Dye::kColors[frag.mDye]; 
			b.mFocusColor	= lerp( b.mColor, Color(0,0,0), .5f );
			
			b.mBases[0]		= ( Dye::kBPLo[frag.mDye] + Dye::kBPHi[frag.mDye] ) / 2;
			b.mBases[1]		= b.mBases[0];
					
			b.mMultimer[0]  = 1;
			b.mMultimer[1]  = 1;
			
			b.mMass			= frag.mMass;
			
			b.mDegrade		= 0.f;
			
			b.mStartBounds	= getWellBounds(lane);
			b.mAspectRatio  = 1.f;
			
			b.mCreateTime	= 0.f;
			b.mExists		= true;
			
			b.mBounds		= calcBandBounds(b);
			b.mAlpha[0]		= frag.mMass; //calcBandAlpha (b,0);
			b.mAlpha[1]		= frag.mMass; //calcBandAlpha (b,1);
			
			mBands.push_back(b);			
		}
	};
	
	auto addMonomer = [=]( int fragi )
	{
		addBand( fragi, 1, 1, 0.f, 1.f );
	};

	
	const float kMultimerSmearFrac = .2f;
	// smear is X% of total
	// and we scale the rest to 1-X% -- NOT doing this; lets keep things looking sharp.
	//		anyways physical asumptions/math isn't quite right
	
		
	auto addMultimer = [=]( int fragi, float wsum )
	{
		const Sample::Fragment& frag = src.mFragments[fragi];


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
				
				addBand( fragi, m+1, m+1, 0.f, (frag.mAggregate[m] / wsum) * scale );
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
					
					addBand( fragi, i+1, last+1, iratio, kMultimerSmearFrac );					
					
					// set up for next band
					last = i;
				}					
			}
		}
	};
	

	// fragments
	for( int fragi=0; fragi<src.mFragments.size(); ++fragi )
	{		
		const auto& frag = src.mFragments[fragi]; 

		const float wsum = frag.calcAggregateWeightedSum();

		if      ( frag.mDye >= 0 )						 addDye(fragi);
		else if ( frag.mAggregate.empty() || wsum==0.f ) addMonomer(fragi);
		else											 addMultimer(fragi,wsum);
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
		b.mExists = mTime >= b.mCreateTime;
		
		b.mBounds   = calcBandBounds(b);
		b.mAlpha[0] = calcBandAlpha (b,0);
		b.mAlpha[1] = calcBandAlpha (b,1);
	}
}

ci::Rectf Gel::calcBandBounds( const Band& b ) const
{
	const float ySpaceScale = getSampleDeltaYSpaceScale();
	
	const float bandTime = getBandLocalTime(b);

	Rectf r = b.mStartBounds;
	
	auto gelSimInput = [=]( const Band& b, int i ) -> GelSim::Input
	{
		GelSim::Input gsi;
		gsi.mBases			= b.mBases[i];
		gsi.mAggregation	= b.mMultimer[i];
		gsi.mAspectRatio	= b.mAspectRatio;
		gsi.mVoltage		= mVoltage;
		gsi.mTime			= bandTime;
		gsi.mGelBuffer		= mBuffer;
		gsi.mSampleBuffer	= mSamples[b.mLane]->mBuffer;
		return gsi;
	};
	
	r.y1 += GelSim::calcDeltaY( gelSimInput(b,0) ) * ySpaceScale;
	r.y2 += GelSim::calcDeltaY( gelSimInput(b,1) ) * ySpaceScale;
	
	float inflate = GelSim::calcDiffusionInflation( gelSimInput(b,1) ) * ySpaceScale;
	r.inflate( vec2(inflate) );
	// use smaller (faster, more inflation) size. we could use a poly, and inflate top vs. bottom differently.
	// with degradation, to see more diffusion we need to use [1], since that's what moves first
	
	return r;
}

float Gel::calcBandAlpha ( const Band& b, int i ) const
{
	float mscale = b.mMultimer[i];
	
	float a = constrain( (b.mMass * (float)mscale) / GelSim::kSampleMassHigh, 0.1f, 1.f );
	
	auto area = []( Rectf r ) {
		return r.getWidth() * r.getHeight();
	};
	
	float diffuseScale = area( getWellBounds(b.mLane) ) / area(b.mBounds);
	// for diffusion, look at ratio of areas
	
	diffuseScale = powf( diffuseScale, .5f ); // tamp it down so we can still see things
	diffuseScale = max ( diffuseScale, .1f );
	
	a *= diffuseScale;
	
	return a;
}

const Gel::Band*
Gel::getSlowestBandInFragment( int lane, int frag ) const
{
	const Gel::Band* b=0;
	
	for( const Band& band : mBands )
	{
		if ( band.mLane==lane && band.mFragment==frag )
		{
			if ( !b || band.mBounds.y1 < b->mBounds.y1 )
			{
				b=&band;
			}
		}
	}
	
	return b;
}

Gel::Band Gel::getSlowestBandInFragment( Band query )
{
	const Gel::Band* biggestBand = getSlowestBandInFragment(query.mLane, query.mFragment);
	assert(biggestBand);
	return *biggestBand;	
}