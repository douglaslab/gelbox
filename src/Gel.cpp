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
		
		b.mAspectRatioYNormBonus = ((frag.mAspectRatio - 1.f) / 16.f) * .25f;
		
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
		
		// calculate alpha
//		float a = constrain( b.mMass / kSampleMassHigh, 0.1f, 1.f );

		float mscale = (float)(multimer + multimerlow) / 2.f;
		float a = constrain( (b.mMass * (float)mscale) / GelSim::kSampleMassHigh, 0.1f, 1.f );
		
		if (b.mDegrade > 1.f) a *= 1.f - min( b.mDegrade - 1.f, 1.f ); // degrade alpha
		
		
		b.mCreateTime	= 0.f; // always start it at the start (not mTime); otherwise is kind of silly...
		b.mExists		= true;
		b.mColor		= ColorA(1.f,1.f,1.f,a);
		
		b.mBounds		= calcBandBounds(b);
		
		mBands.push_back(b);	
		return mBands.back();
	};
	
	const float kMultimerSmearFrac = .2f;
	// smear is X% of total
	// and we scale the rest to 1-X% -- NOT doing this; lets keep things looking sharp.
	//		anyways physical asumptions/math isn't quite right
	
	for( int fragi=0; fragi<src.mFragments.size(); ++fragi )
	{		
		const auto& frag = src.mFragments[fragi]; 

		const float wsum = frag.calcAggregateWeightedSum();
		
		if ( frag.mAggregate.empty() || wsum==0.f ) addBand( fragi, 1, 1, 0.f, 1.f );
		else
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
			
		} // aggregates
	} // fragi
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
	updateBandsWithTime(mTime);
}

void Gel::setTime( float t )
{
	mTime = t;
	updateBandsWithTime(mTime);
}

void Gel::updateBandsWithTime( float t )
{
	for( auto &b : mBands )
	{
		b.mExists = t >= b.mCreateTime;
		
		b.mBounds = calcBandBounds(b);
	}
}

ci::Rectf Gel::calcBandBounds( const Band& b ) const
{
	const float bandTime = max(mTime - b.mCreateTime,0.f);

	// what base pair location to use for y1 and y2
	float y1b = constrain( normalizeBases(b.mBases[0] * b.mMultimer[0]), 0.f, 1.f );
	float y2b = constrain( normalizeBases(b.mBases[1] * b.mMultimer[1]), 0.f, 1.f );
//	float y1b = normalizeBases(b.mBases[0]);
//	float y2b = normalizeBases(b.mBases[1]);
	
	y1b -= b.mAspectRatioYNormBonus * bandTime;
	y2b -= b.mAspectRatioYNormBonus * bandTime;
	
	// degrade base pair location
//	y2b -= min( 1.f, b.mDegrade ); // as degrade goes 0..1, y2 moves to end of chart--shorter base pairs
//	if ( b.mDegrade > 1.f ) y1b -= min( 1.f, b.mDegrade - 1.f ); // as degrade goes 1..2, y1 moves to end of chart--shorter bp  
	
	// get bounds in cm
	Rectf r = b.mStartBounds;
	
	r.y1 += getYForNormalizedBases( y1b, bandTime );
	r.y2 += getYForNormalizedBases( y2b, bandTime );
	
	return r;
}

float Gel::normalizeBases( int bases ) const
{
	return (float)bases / 10000.f;	
}

float Gel::getYForNormalizedBases( float normalizedBases, float t ) const
{
	float y = normalizedBases;
	// y=1 means lots of bases, slow, top of gel
	// y=0 means few bases, fast, bottom of gel
	
	// time (doing time here seems to mess things up, causing bands to disappear)
//	y = 1.f - t * (1.f - y);
	
	// output is non-linear
	if (1)
	{
		const float K = 3.7f;
	//	float K = lerp( 0.f, 2.f, t );
		
		y = .05f + powf( 1.f - y, K );
	}
	
	// flip it, so that y=1 puts us at bottom of gel
//	y = 1.f - y; 

	// time
	y *= t;
	
	// scale
	y *= mSize.y - mYMargin*2.f;
	
	// done
	return y;
}