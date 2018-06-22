//
//  MolecularSim.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 6/22/18.
//

#include "MolecularSim.h"
#include "GelSim.h"
#include "Sample.h"
#include "Layout.h"

using namespace std;
using namespace ci;


// sim
const float kBulletTimeScale = .1f;
const bool  kPartSimIsOldAgeDeathEnabled = false;
const int kNumPartsPerMassHigh = 50;

const float kFadeInStep = .05f; 
const float kFadeOutStep = .05f;
const float kMaxAge = 30 * 1000;

// mitigate dithering artifacts by being lenient / less aggressive with aggregate culling
const float kAggregateCullChanceScale = (1.f / 30.f) * .5f;
const int   kAggregateCullPopEps = 0;
const float kMaxAgeMisfitAggregate = 30 * 30;
 
const float kJitter = .75f;

const float kPartMinPickRadius = 8.f;	


// draw sim
const int kNumCirclePartVertices = 32;

const Color& kSelectColor   = kLayout.mSampleViewFragSelectColor;
const Color& kRolloverColor = kLayout.mSampleViewFragHoverColor;
const float& kOutlineWidth  = kLayout.mSampleViewFragOutlineWidth;

const bool kDebugDrawMeshVerts = false;


static void drawMeshVerts( ci::TriMeshRef mesh )
{
	gl::color( 1,0,0 );
	vec2* v = mesh->getPositions<2>();
	for( int i=0; i<mesh->getNumVertices(); ++i )
	{
		gl::drawSolidCircle(v[i],1.f);
	}
}

MolecularSim::MolecularSim()
{
	mRand.seed( randInt() ); // random random seed :-)	
}

void MolecularSim::setBounds( ci::Rectf r )
{
	mBounds = r;
	
	// normalize pop den scale to old default size/density
	mSizeDensityScale = (getBounds().getWidth() * getBounds().getHeight()) / (400.f*400.f);
}

void MolecularSim::setSample( SampleRef sample )
{
	mSample = sample;
	
	if (!sample) return;
	
	mFragments	  .resize( sample->mFragments.size() );

	for( int i=0; i<mFragments.size(); ++i )
	{
		Frag &f = mFragments[i];
		auto  s = sample->mFragments[i];
		
		f.mColor		= s.mColor;
		f.mTargetPop	= max( 1.f, (s.mMass/GelSim::kTuning.mSampleMassHigh) * kNumPartsPerMassHigh );
		f.mAggregate	= s.mAggregate;
		f.mAggregateWeightSum = s.mAggregate.calcSum();
		
		// radius
		float r = lmap( (float)s.mBases, 0.f, 14000.f, 2.f, 32.f );
		
		f.mRadiusHi.y = sqrt( (r*r) / s.mAspectRatio );
		f.mRadiusHi.x = s.mAspectRatio * f.mRadiusHi.y;
		// this calculation maintains the area for a circle in an ellipse that meets desired aspect ratio
		// math for maintaining circumfrence is wickedly harder
		
		// degraded radius				
		// do degrade (NOTE: this replicates logic in Gel::calcBandBounds)
		// just have multiple degrade params in each frag, to make this  simpler then encoding it all in 0..2?
		f.mRadiusLo = f.mRadiusHi;
		
		f.mRadiusLo *= max( 0.f, 1.f - s.mDegrade ); // as degrade goes 0..1, low end drops out--shorter base pairs, lower radii
	
		if ( s.mDegrade > 1.f ) f.mRadiusHi *= 2.f - min(2.f,s.mDegrade); // as degrade goes 1..2, upper radii moves drops out--shorter
		
		// set a lower limit on degrade...
		const vec2 kMinRadius(1,1);
		f.mRadiusLo = glm::max( f.mRadiusLo, kMinRadius );
//			f.mRadius		  = glm::max( f.mRadius,		 kMinRadius );

		// dye? no problem; population will get culled in tickSim()
		// we just let there be a 1:1 correspondence between
		// fragments here and in sample, and just don't make any particles for dyes
		f.mIsDye = s.mDye >= 0;
	}
}

void MolecularSim::deleteFragment( int i )
{
	setSample( mSample ); // ensure we are sync'd before starting this!
	
	if ( i >= 0 && i < mFragments.size() )
	{
		// fade out particles
		for ( auto &p : mParts )
		{
			if ( p.mFragment==i )
			{
				p.mFragment = -1;
			}
		}

		// remove from our list
		int from, to;
		
		from = (int)mFragments.size()-1;
		to   = i;
		
		mFragments[to] = mFragments[from];
		mFragments.pop_back();
		
		// remove from mSample
		if (mSample)
		{
			assert( mFragments.size()+1 == mSample->mFragments.size() ); // +1 since we just popped it

			mSample->mFragments[to] = mSample->mFragments[from];
			mSample->mFragments.pop_back();
		}
		
		// reindex
		for ( auto &p : mParts )
		{
			if ( p.mFragment==from )
			{
				p.mFragment = to;
			}
		}
	}	
}

void MolecularSim::preroll()
{
	// step it a bunch so we spawn particles
	for( int i=0; i<100; ++i )
	{
		tick(mTimeScale);
	}
	
	// force fade in/out
	for ( auto &p : mParts )
	{
		if (p.mAlive) p.mFade = 1.f;
		else p.mFade = 0.f;
	}
}

void MolecularSim::tick( bool bulletTime )
{
	const float dt = ( bulletTime ? kBulletTimeScale : 1.f ) * mTimeScale; 
	
	const float dt_fadein  = 1.f;
	const float dt_fadeout = 1.f;
	// lock fade dt at 1; no bullet-time here.
	
	const Rectf bounds = getBounds();
	
	// census
	vector<int> pop;
	vector<int> alivepop;
	vector<float> cullChance;
	cullChance.resize(mFragments.size(),0);
	pop.resize(mFragments.size(),0);
	alivepop.resize(mFragments.size(),0);
	
	// setup aggregate counters
	vector< vector<int> > aggregatePop;
	vector< vector<float> > aggregateCullChance;
	aggregatePop.resize( mFragments.size(), vector<int>() );
	aggregateCullChance.resize( mFragments.size(), vector<float>() );
	
	for( int i=0; i<mFragments.size(); ++i )
	{
		aggregatePop[i]       .resize( max( (size_t)1, mFragments[i].mAggregate.size()), 0 );
		aggregateCullChance[i].resize( max( (size_t)1, mFragments[i].mAggregate.size()), 0.f );
	}
	
	// tally
	for ( const auto &p : mParts )
	{
		const int f = p.mFragment;
		
		if ( f>=0 && f<pop.size() )
		{
			pop[f]++;
			if (p.mAlive)
			{
				alivepop[f]++;
			
				if (p.mMulti.size()>0) aggregatePop[f][p.mMulti.size()-1]++;
			}
		}
	}
	
	// update population counts
	const float popDensityScale = mSizeDensityScale * mPopDensityScale; 
	
	for( int f = 0; f<mFragments.size(); ++f )
	{
		int targetPop = (int) max( 1.f, (float)mFragments[f].mTargetPop * popDensityScale ) ;
		
		// dye? pop=0
		if (mFragments[f].mIsDye) targetPop=0;
		
		// make (1 this frame)
		if ( alivepop[f] < targetPop  )
		{
			mParts.push_back( randomPart(f) );
			
			pop[f]++;
		}
		
		// cull		
		if ( alivepop[f] > targetPop )
		{
			cullChance[f] = (float)(alivepop[f] - targetPop) / (float)targetPop;
		}

		// aggregate cull?
		for( int m=0; m<mFragments[f].mAggregate.size(); ++m )
		{
			int targetMultiPop = ( mFragments[f].mAggregate[m] / mFragments[f].mAggregateWeightSum )
				* (float)targetPop;
			
			if ( aggregatePop[f][m] - kAggregateCullPopEps > targetMultiPop )
			{
				aggregateCullChance[f][m] = (float)(aggregatePop[f][m] - targetMultiPop) / (float)(aggregatePop[f][m]) ;
				aggregateCullChance[f][m] *= kAggregateCullChanceScale;
			}			
		}
	}
	
	// update each
	for ( auto &p : mParts )
	{
		// try get fragment
		Frag* frag=0;
		if ( isFragment(p.mFragment) ) frag = &mFragments[p.mFragment];
		
		// age
		p.mAge += dt;
		
		if ( p.mAlive )
		{
			p.mFade = min( 1.f, p.mFade + kFadeInStep * dt_fadein );
			
			// maybe cull?
			if (   !frag
				|| (p.mAge > kMaxAge && kPartSimIsOldAgeDeathEnabled)
				|| mRand.nextFloat() < cullChance[p.mFragment] // ok to index bc of !frag test above
				|| (p.mAge > kMaxAgeMisfitAggregate && mRand.nextFloat() < aggregateCullChance[p.mFragment][p.mMulti.size()-1])
				)
			{
				p.mAlive = false;
			}
		}
		else
		{
			p.mFade = max( 0.f, p.mFade - kFadeOutStep * dt_fadeout );
		}
		
		// move
		p.mLoc += p.mVel * dt;
		p.mLoc += mRand.nextVec2() * mRand.nextFloat() * kJitter * dt;
		
		p.mAngle += p.mAngleVel * dt;
		
		// wrap?
		if ((0))
		{
			if ( p.mLoc.x > bounds.x2 ) p.mLoc.x = bounds.x1 + (p.mLoc.x - bounds.x2); 
			if ( p.mLoc.x < bounds.x1 ) p.mLoc.x = bounds.x2 - (bounds.x1 - p.mLoc.x); 
			if ( p.mLoc.y > bounds.y2 ) p.mLoc.y = bounds.y1 + (p.mLoc.y - bounds.y2); 
			if ( p.mLoc.y < bounds.y1 ) p.mLoc.y = bounds.y2 - (bounds.y1 - p.mLoc.y);
		}
		
		// kill if out of bounds
		if ( p.mAlive && ! bounds.inflated( vec2( max(p.mRadius.x, p.mRadius.y) ) ).contains( p.mLoc ) )
		{
			p.mAlive = false;
		}
		
		// sync to frag
		if (frag)
		{
			vec2 fragRadius = lerp( frag->mRadiusLo, frag->mRadiusHi, p.mRadiusScaleKey );
			
			p.mColor	= lerp( p.mColor,  frag->mColor, .5f );
			p.mRadius	= lerp( p.mRadius, fragRadius,	 .5f );
			
		} // sync
	}
	
	// cull dead ones
	mParts.erase( remove_if( mParts.begin(), mParts.end(),
		[]( const Part& p ) -> bool
	{
		return !p.mAlive && p.mFade == 0.f;
	}), mParts.end() );
}

int
MolecularSim::getRandomWeightedAggregateSize( int fragment )
{
	const auto &frag = mFragments[fragment];
	
	// empty?
	if (frag.mAggregate.empty()) return 1; // empty means monomer
	
	// weights to use
	const vector<float>& a = frag.mAggregate; 
	const float sum = frag.mAggregateWeightSum;
	
	// choose
	float r = mRand.nextFloat() * sum;
	
	for( int i=0; i<a.size(); ++i )
	{
		if ( r <= a[i] )
		{
			return i+1;
		}
		
		r -= a[i];
	}
	
	assert( 0 && "aggregate weight sum is wrong" );
	return 1; // monomer
}

int  MolecularSim::pickPart( vec2 loc ) const
{
	// in reverse, so pick order matches draw order 
	for( int i = (int)mParts.size()-1; i>=0; --i )
	{
		Part p = mParts[i]; // copy so we can inflate
		
		p.mRadius.x = max( p.mRadius.x, kPartMinPickRadius );
		p.mRadius.y = max( p.mRadius.y, kPartMinPickRadius );

		for( int m=0; m<p.mMulti.size(); ++m )
		{	
			mat4 xform = glm::inverse( p.getTransform(m) );
			vec2 ploc = vec2( xform * vec4(loc,0,1) );
			
			if ( length(ploc) <= 1.f )
			{
				return i;
			}
		}
	}
	
	return -1;
}

int  MolecularSim::pickFragment( vec2 loc ) const
{
	int p = pickPart(loc);
	
	if ( p == -1 ) return -1;
	else return mParts[p].mFragment; 
}

void MolecularSim::drawBackground( int highlight )
{
	assert( highlight >=0 && highlight < 3 );
	
	Color hc[3] =
	{
		kLayout.mMolecularSimBkgndColor,  	 // nothing
		kLayout.mMolecularSimBkgndColor * .97, // hover
		kLayout.mMolecularSimBkgndColor * .9f	 // mouse down
	};
	
	Color c = hc[highlight];
	
	// dyes
	if (mSample)
	{	
		float w = 1.f; // base color weight
		
		auto dyes = mSample->getDyes();
		
		for( int i=0; i<Dye::kCount; ++i )
		{
			float norm = dyes[i] / GelSim::kTuning.mSliderDyeMassMax; 
			
			c += Dye::kColors[i] * norm;
			w += norm;
		}
		
		c /= w;
	}
	
	// fill
	gl::color(c);
	gl::drawSolidRect( getBounds() );
}

void MolecularSim::drawRepresentativeOfFrag( int frag, ci::vec2 pos ) const
{
	// 1st, find a part
	int   pick = -1;
	float pickfade = 0.f;
	
	for( int i=0; i<mParts.size(); ++i )
	{
		if ( mParts[i].mFragment == frag && mParts[i].mFade > pickfade )
		{
			pick = i;
			pickfade = mParts[i].mFade; 
		}
	}
	
	// draw it!
	if ( pick != -1 )
	{
		const auto &p = mParts[pick];

		auto mesh = p.makeMesh();
		
		if (mesh)
		{
			gl::ScopedModelMatrix modelMatrix;
			gl::multModelMatrix(
				glm::translate( vec3(pos-p.mLoc,0.f) ) // put it where we want
			  * p.getTransform2() );
			gl::draw(*mesh);
		}
	}
}

//ci::TriMeshRef makeMoleculesMesh( SampleFragRefRef selection, SampleFragRefRef rollover ) const
//{
//	
//}
//
void MolecularSim::draw( SampleFragRefRef fselection, SampleFragRefRef frollover )
{
	// draw parts
	for ( const auto &p : mParts )
	{
		const bool selected = isFragment(p.mFragment) && fselection->isa( mSample, p.mFragment );
		const bool rollover = isFragment(p.mFragment) && frollover ->isa( mSample, p.mFragment );		 

		auto drawPart = [&]( bool outline )
		{
			if ( outline && !selected && !rollover ) return; 

			ColorA color	= ci::ColorA(p.mColor,p.mFade);
			float  inflate	= 0.f;
			
			if (outline)
			{
				inflate += kOutlineWidth;

				if (selected && rollover) color = ColorA( lerp( kSelectColor, kRolloverColor, .5f ), p.mFade );
				else color = selected ? ColorA(kSelectColor,p.mFade) : ColorA(kRolloverColor,p.mFade);				
			}
			
			auto mesh = p.makeMesh(color,inflate);
			
			if (mesh)
			{
				gl::ScopedModelMatrix modelMatrix;
				gl::multModelMatrix( p.getTransform2() );
				gl::draw(*mesh);
				
				if (kDebugDrawMeshVerts) drawMeshVerts(mesh);
			}
		};
		
		// outlines in 1st pass, for proper outline effect
		drawPart(true);
		drawPart(false);

	} // part
}

MolecularSim::Part
MolecularSim::randomPart( int f )
{
	Part p;
		
	p.mLoc  = vec2( mRand.nextFloat(), mRand.nextFloat() )
			* vec2( getBounds().getSize() )
			+ getBounds().getUpperLeft();
			
	p.mVel  = mRand.nextVec2() * .5f;
	
	p.mAge += mRand.nextInt(kMaxAge); // stagger ages to prevent simul-fadeout-rebirth

	p.mAngle    = mRand.nextFloat() * M_PI * 2.f;
	p.mAngleVel = randFloat(-1.f,1.f) * M_PI * .002f;
	
	p.mFragment = f;
	p.mRadius = mFragments[p.mFragment].mRadiusHi ;
	p.mColor  = mFragments[p.mFragment].mColor ; 
	
	p.mRadiusScaleKey = mRand.nextFloat();

	// multimer setup
	Part::Multi m;
	p.mMulti.push_back(m);

	int aggregate = getRandomWeightedAggregateSize(p.mFragment);
	
	while ( p.mMulti.size() < aggregate )
	{
		Part::Multi m;
	
		m.mAngle = mRand.nextFloat() * M_PI * 2.f;

		if (!p.mMulti.empty())
		{
			Part::Multi parent = p.mMulti[ mRand.nextInt() % p.mMulti.size() ];					

			m.mLoc = parent.mLoc + mRand.nextVec2();
		}
		else m.mLoc = vec2(0,0); // in case we ever get empty... (shouldn't happen!) 
		
		p.mMulti.push_back(m);
	}
	
	return p;
}

ci::TriMeshRef
MolecularSim::Part::makeMesh( ColorA color, float inflateDrawRadius ) const
{
	const int N = kNumCirclePartVertices;
	
	const float tDelta = 1 / (float)N * 2.0f * 3.14159f;

	auto mesh = ci::TriMesh::create( ci::TriMesh::Format().positions(2).colors(4) );
	
	for( int mi=0; mi<mMulti.size(); ++mi )
	{
		const auto &m = mMulti[mi];
		
		mat4 x;
		x *= translate( vec3( m.mLoc * min(mRadius.x,mRadius.y) * 2.f, 0) );
		x *= glm::rotate( m.mAngle, vec3(0,0,1) );
		x *= scale( vec3(mRadius.x+inflateDrawRadius,mRadius.y+inflateDrawRadius,1.f) );

		uint32_t ind = (uint32_t)mesh->getNumVertices();
		float	 t = 0;		
		
		vec4 c = vec4(vec3(0.f),1.f);
		mesh->appendPosition( vec2( x * c ) );
		mesh->appendColors( &color, 1 );
		
		for( int i=0; i<N; ++i )
		{
			vec2 unit( math<float>::cos( t ), math<float>::sin( t ) );
			t += tDelta;
			
			// radius, locate now (if we want)
			
			mesh->appendPosition( vec2( x * vec4(unit,0.f,1.f) ) );
			mesh->appendColors( &color, 1 );
			
			mesh->appendTriangle( ind, ind+(i)+1, ind + ((i+1)%N) + 1 );
		}
	}
	
	return mesh;
}

glm::mat4
MolecularSim::Part::getTransform2() const
{
	mat4 xform;
	xform *= translate( vec3(mLoc,0) );
	xform *= glm::rotate( mAngle, vec3(0,0,1) );	
	return xform;
}

glm::mat4
MolecularSim::Part::getTransform( int multiIndex ) const
{
	mat4 xform;
	xform *= translate( vec3(mLoc,0) );
	xform *= glm::rotate( mAngle, vec3(0,0,1) );
	
	if ( multiIndex >= 0 && multiIndex < mMulti.size() )
	{
		const Multi &m = mMulti[multiIndex];
		xform *= translate( vec3( m.mLoc * min(mRadius.x,mRadius.y) * 2.f, 0) );
		xform *= glm::rotate( m.mAngle, vec3(0,0,1) );
	}
	
	xform *= scale( vec3(mRadius.x,mRadius.y,1.f) );	
	return xform;
}
