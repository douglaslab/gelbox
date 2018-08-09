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
#include "Serialize.h"

using namespace std;
using namespace ci;

const vec2 kLaneVec(1,0);
const vec2 kPosVec (0,1);

Gel::Gel()
{
	mVoltage = GelSim::kTuning.mSliderVoltageDefaultValue;
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
	
	// add more samples if needed (don't remove, allow that to persist)
	if ( mSamples.size() < mNumLanes ) {
		mSamples.resize(mNumLanes);
	}
	
	syncBandsToSamples();
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

int Gel::getFirstEmptyLane() const
{
	for( int i=0; i<mNumLanes; ++i )
	{
		if ( !mSamples[i] ) return i;
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

	syncBandsToSample(lane);
}

void Gel::syncBandsToSample( int lane )
{
	// check
	assert( lane >= 0 && lane < mNumLanes );

 	// update
	clearSamples(lane);
	
	if ( mSamples[lane] )
	{
		insertSample( *mSamples[lane], lane );
	}
}

void Gel::syncBandsToSamples()
{
	mBands.clear();
	
	for( int i=0; i<mNumLanes; ++i )
	{
		if (mSamples[i]) {
			insertSample( *mSamples[i], i );
		}
	}
}

void Gel::setBuffer( const Gelbox::Buffer& b )
{
	mBuffer = b;
	
	updateBands();
}

void Gel::setNumLanes( int num )
{
	setLayout(
		mSize.x,
		mSize.y,
		num,
		mYMargin
		);
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

void Gel::insertSample( const Sample& src, int lane )
{
	GelSim::Context context = getSimContext(src);
	
	// fragments
	for( int fragi=0; fragi<src.mFragments.size(); ++fragi )
	{		
		vector<Band> bands = GelSim::fragToBands( src, fragi, getWellBounds(lane), lane, context );
		
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
	float t = mTime;
	t += dt;
	t  = min( t, mDuration );
	setTime(t);
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

void Gel::setWellDamage( float v )
{
	mWellDamage = v;
	updateBands();
}

void Gel::updateBands()
{
	mBands.clear();
	
	for( int i=0; i<mSamples.size(); ++i )
	{
		if ( mSamples[i] ) {
			insertSample( *mSamples[i], i );
		}
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

GelSim::Context Gel::getSimContext( const Sample& sample ) const
{
	GelSim::Context context;
	context.mVoltage		= getVoltage();
	context.mTime			= getTime();
	context.mYSpaceScale	= getSampleDeltaYSpaceScale();
	context.mWellDamage		= mWellDamage;
	context.mGelBuffer		= mBuffer;
	context.mSampleBuffer	= sample.mBuffer;
	return context;
}

GelRender::GlobalWarp Gel::getRenderGlobalWarp() const
{
	GelRender::GlobalWarp w;
	
	w.mH2ODistort = getBuffer() == Gelbox::Buffer::h2o();
	w.mRandSeed   = 1;
	
	return w;
}

ci::JsonTree Gel::toJson() const
{
	ci::JsonTree j = JsonTree::makeObject("Gel");

	ci::JsonTree samples = JsonTree::makeArray("Samples");
	
	for ( int i=0; i<mNumLanes; ++i )
	{
		JsonTree lane;
		
		if ( mSamples[i] )
		{
			lane = mSamples[i]->toJson();
		}
		
		samples.pushBack(lane);
	}
	
	j.addChild(samples);
	j.addChild( mBuffer.toJson() );
	j.addChild( JsonTree( "Time", mTime ) );
	j.addChild( JsonTree( "Voltage", mVoltage ) );
	j.addChild( JsonTree( "WellDamage", mWellDamage ) );
	// ignore sim params mDuration, mIsPaused -- not user accessible right now anyway
	// mNumLanes implcitly captured in Samples[]
	// layout params we ignore, let View management take care of that for us.
	
	return j;
}

Gel::Gel( const JsonTree& j )
{
	if ( j.hasChild("Samples") )
	{
		auto jsamples = j.getChild("Samples");
		
		cout << jsamples.getNumChildren() << endl;
		setNumLanes( (int)jsamples.getNumChildren() );
		
		for( int i=0; i<mNumLanes; ++i )
		{
			auto jsample = jsamples[i];
			
			// non-null sample?
			if ( jsample.getKey() == "Sample"
			  && jsample.getNumChildren() > 0 )
			{
				mSamples[i] = make_shared<Sample>(jsample); 
			}
		}
	}

	if ( j.hasChild("Buffer") )
	{
		mBuffer = Gelbox::Buffer( j.getChild("Buffer") );
	}	
	
	jsonValue( j, "Time", mTime );
	jsonValue( j, "Voltage", mVoltage );
	jsonValue( j, "WellDamage", mWellDamage );
	
	syncBandsToSamples();
}
