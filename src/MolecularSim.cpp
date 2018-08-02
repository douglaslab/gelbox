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

	  MolecularSimTuning  MolecularSim::gTuning;
const MolecularSimTuning &MolecularSim::kTuning = MolecularSim::gTuning;

void MolecularSimTuning::load( const JsonTree& json )
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

	auto getb = [json,geti]( string key, bool& v )
	{
		int n;
		geti(key,n);
		v = n;
	};

	getf( "BulletTimeScale", mBulletTimeScale );
	getb( "PartSimIsOldAgeDeathEnabled", mPartSimIsOldAgeDeathEnabled );
	geti( "NumPartsPerMassHigh", mNumPartsPerMassHigh );
	getf( "FadeInStep", mFadeInStep );
	getf( "FadeOutStep", mFadeOutStep );
	getf( "MaxAge", mMaxAge );
	getf( "RadiusMin", mRadiusMin );
	getf( "RadiusMax", mRadiusMax );

	geti( "AggregateCullPopEps", mAggregateCullPopEps );
	getf( "MaxAgeMisfitAggregate", mMaxAgeMisfitAggregate );
	getf( "Jitter", mJitter );
	getf( "PartMinPickRadius", mPartMinPickRadius );

	getf( "MultimerAdhereOverlapFrac", mMultimerAdhereOverlapFrac );	
	
	getb( "DebugSliceAllMolecules", mDebugSliceAllMolecules );
}

static float basesToRadius( int bp )
{
	return lmap( (float)bp,
		0.f, 		(float)GelSim::kTuning.mBaseCountHigh,
		MolecularSim::kTuning.mRadiusMin, MolecularSim::kTuning.mRadiusMax );		
}

const Color& kSelectColor   = kLayout.mSampleViewFragSelectColor;
const Color& kRolloverColor = kLayout.mSampleViewFragHoverColor;
const float& kOutlineWidth  = kLayout.mSampleViewFragOutlineWidth;

//const bool kDebugDrawMeshVerts = false;


ci::TriMeshRef concatMesh( ci::TriMeshRef a, ci::TriMeshRef b, mat4 xb )
{
	assert(a);
	
	if (b)
	{
		vec2* v = b->getPositions<2>();
		uint32_t off = (uint32_t)a->getNumVertices();
		
		for( int i=0; i<b->getNumVertices(); ++i )
		{
			v[i] = vec2( xb * vec4( v[i], 0.f, 1.f ) );
		}
		
		for ( uint32_t& ix : b->getIndices() ) ix += off;

		a->appendColors( b->getColors<4>(), b->getNumVertices() );
		a->appendPositions( v, b->getNumVertices() );
		a->appendIndices( b->getIndices().data(), b->getNumIndices() );
	}
	
	return a;
}

/*
static void drawMeshVerts( ci::TriMeshRef mesh )
{
	gl::color( 1,0,0 );
	vec2* v = mesh->getPositions<2>();
	for( int i=0; i<mesh->getNumVertices(); ++i )
	{
		gl::drawSolidCircle(v[i],1.f);
	}
}
*/

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

void MolecularSim::setSample( SampleRef sample, DegradeFilter *degradeFilter )
{
	mSample = sample;
	
	if (degradeFilter) mDegradeFilter = *degradeFilter;
	else mDegradeFilter.clear();
	
	if (!sample) return;
	
	mFragments	  .resize( sample->mFragments.size() );

	for( int i=0; i<mFragments.size(); ++i )
	{
		Frag &f = mFragments[i];
		auto  s = sample->mFragments[i];
		
		f.mColor		= s.mColor;
		f.mTargetPop	= max( 1.f, (s.mMass/GelSim::kTuning.mSampleMassHigh) * kTuning.mNumPartsPerMassHigh );
		f.mAggregate	= s.mAggregate;
		f.mAggregateWeightSum = s.mAggregate.calcSum();
		
		// radius
		float r = basesToRadius( s.mBases );
		
		f.mRadius.y = sqrt( (r*r) / s.mAspectRatio );
		f.mRadius.x = s.mAspectRatio * f.mRadius.y;
		// this calculation maintains the area for a circle in an ellipse that meets desired aspect ratio
		// math for maintaining circumfrence is wickedly harder
		
		// degrade
		{
			// Calculate baseline wholeness described by mDegrade
			GelSim::calcDegradeAsFrac( s.mDegrade, f.mWholenessLo, f.mWholenessHi );
			f.mWholenessLo = 1.f - f.mWholenessLo;
			f.mWholenessHi = 1.f - f.mWholenessHi;
				// wholeness is inverse of degraded-ness

			// Modulate (further constrain) mWholeness with our filter (maybe)
			auto degradeF = mDegradeFilter.find(i);
			
			if ( degradeF != mDegradeFilter.end() )
			{
				int a = s.mAggregate.top()+1; // we assume (good bet) we are just getting a single multimer size here 
				
				int   bpe = degradeF->second; // get base pair equivalent size
				bpe /= a; // de-modulate aggregate size (would be simpler to just assume 1 always here)
				
				float fr = basesToRadius(bpe);
//				float w  = (M_PI*fr*fr) / (M_PI*r*r);
				float w  = fr / r;
//				f.mWholenessLo = max( f.mWholenessLo, w );
//				f.mWholenessHi = min( f.mWholenessHi, w );
				f.mWholenessLo = f.mWholenessHi = lerp( f.mWholenessLo, f.mWholenessHi, w );
				
//				cout << w << " (" << f.mWholenessLo << ", " << f.mWholenessHi << ")" << endl;
				cout << "w: " << w << endl;
				
//				const float ds  = (float)bpe / (float)(s.mBases*a); // convert to a scale factor
				
//				f.mWholenessLo = f.mWholenessHi = ds;
			}

			// set a lower limit on degrade...
			 f.mWholenessLo = max( f.mWholenessLo, kTuning.mRadiusMin / r );
			 f.mWholenessHi = max( f.mWholenessHi, kTuning.mRadiusMin / r );

	//		cout << f.mWholenessLo << ", " << f.mWholenessHi << endl;
		}

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
	const float dt = ( bulletTime ? kTuning.mBulletTimeScale : 1.f ) * mTimeScale; 
	
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
			
			if ( aggregatePop[f][m] - kTuning.mAggregateCullPopEps > targetMultiPop )
			{
				aggregateCullChance[f][m] = (float)(aggregatePop[f][m] - targetMultiPop) / (float)(aggregatePop[f][m]) ;
				aggregateCullChance[f][m] *= kTuning.mAggregateCullChanceScale;
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
			p.mFade = min( 1.f, p.mFade + kTuning.mFadeInStep * dt_fadein );
			
			// maybe cull?
			if (   !frag
				|| (p.mAge > kTuning.mMaxAge && kTuning.mPartSimIsOldAgeDeathEnabled)
				|| mRand.nextFloat() < cullChance[p.mFragment] // ok to index bc of !frag test above
				|| (p.mAge > kTuning.mMaxAgeMisfitAggregate && mRand.nextFloat() < aggregateCullChance[p.mFragment][p.mMulti.size()-1])
				)
			{
				p.mAlive = false;
			}
		}
		else
		{
			p.mFade = max( 0.f, p.mFade - kTuning.mFadeOutStep * dt_fadeout );
		}
		
		// move
		p.mLoc += p.mVel * dt;
		p.mLoc += mRand.nextVec2() * mRand.nextFloat() * kTuning.mJitter * dt;
		
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
			float toWholeness = lerp( frag->mWholenessLo, frag->mWholenessHi, p.mDegradeKey );
			
			p.mWholeness = lerp( p.mWholeness, toWholeness,   .5f );
			p.mColor	 = lerp( p.mColor,     frag->mColor,  .5f );
			p.mRadius	 = lerp( p.mRadius,    frag->mRadius, .5f );
			
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
		
		p.mRadius.x = max( p.mRadius.x, kTuning.mPartMinPickRadius );
		p.mRadius.y = max( p.mRadius.y, kTuning.mPartMinPickRadius );

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
			  * p.getRootTransform() );
			gl::draw(*mesh);
		}
	}
}

ci::TriMeshRef MolecularSim::makeMoleculesMesh( SampleFragRefRef fselection, SampleFragRefRef frollover ) const
{
	ci::TriMeshRef mesh = ci::TriMesh::create( ci::TriMesh::Format().positions(2).colors(4) ); 
	
	// draw parts
	for ( const auto &p : mParts )
	{
		const bool selected = isFragment(p.mFragment) && fselection->isa( mSample, p.mFragment );
		const bool rollover = isFragment(p.mFragment) && frollover ->isa( mSample, p.mFragment );		 

		auto doPart = [&]( bool outline )
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
			
			auto pmesh = p.makeMesh(color,inflate);

			mesh = concatMesh( mesh, pmesh, p.getRootTransform() );
		};
		
		// outlines in 1st pass, for proper outline effect
		doPart(true);
		doPart(false);

	} // part		
	
	return mesh;
}

void MolecularSim::draw( SampleFragRefRef fselection, SampleFragRefRef frollover )
{
	ci::TriMeshRef mesh = makeMoleculesMesh(fselection,frollover);
	if (mesh) gl::draw(*mesh);
}

MolecularSim::Part
MolecularSim::randomPart( int f )
{
	Part p;
		
	p.mLoc  = vec2( mRand.nextFloat(), mRand.nextFloat() )
			* vec2( getBounds().getSize() )
			+ getBounds().getUpperLeft();
			
	p.mVel  = mRand.nextVec2() * .5f;
	
	p.mAge += mRand.nextInt(kTuning.mMaxAge); // stagger ages to prevent simul-fadeout-rebirth

	p.mAngle    = mRand.nextFloat() * M_PI * 2.f;
	p.mAngleVel = randFloat(-1.f,1.f) * M_PI * .002f;
	
	p.mFragment = f;
	p.mRadius = mFragments[p.mFragment].mRadius ;
	p.mColor  = mFragments[p.mFragment].mColor ; 
	
	p.mDegradeKey = mRand.nextFloat();

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

static void circleToPolyline( vec2 c, float r, ci::PolyLine2& p )
{
	const int	N		= MolecularSim::kTuning.mNumCirclePartVertices;	
	const float tDelta	= 1 / (float)N * 2.0f * 3.14159f;

	float	 	t = 0;
	
	for( int i=0; i<N; ++i )
	{
		vec2 unit( math<float>::cos( t ), math<float>::sin( t ) );
		t += tDelta;
		
		p.push_back( c + unit * r );
	}
}

static void rectToPolyline( Rectf r, ci::PolyLine2& p )
{
	p.push_back( r.getUpperLeft() );
	p.push_back( r.getUpperRight() );
	p.push_back( r.getLowerRight() );
	p.push_back( r.getLowerLeft() );
}

static void polylineToMesh( const ci::PolyLine2& p, ColorA color, ci::TriMeshRef mesh )
{
	// assume convex, so this center trick works
	const vec2 c = p.calcCentroid();
	
	//
	mesh->appendPosition( c );
	mesh->appendColors( &color, 1 );

	for( int i=0; i<p.size(); ++i )
	{
		mesh->appendPosition( p.getPoints()[i] );
		mesh->appendColors( &color, 1 );
		mesh->appendTriangle( 0, (i)+1, ((i+1)%p.size()) + 1 );			
	}	
}

static void makeDegradeIntersectShape( vec2 radius, float wholeness, Rand& r, PolyLine2& p )
{
	// we are trying to cut an ellipse of radius
	

	const float kDegradeSliceMinAspect		= .33f; // 3:1
	const float kDegradeSliceOffsetCenter  	= 1.f;
	const float kDegradeSliceInflateCorners	= .1f;
	
	// how big should the rectangle be?	
	float area = (radius.x * radius.y) * 4.f  * (wholeness*wholeness);

	float squaredim = sqrtf(area);
	
	squaredim = max( squaredim, MolecularSim::kTuning.mRadiusMin * 2.f );
	
	vec2 s;
	s.x = squaredim * max( kDegradeSliceMinAspect, r.nextFloat( wholeness, 1.f ) );
	s.y = area / s.x; // s.x * s.y = area
	
	vec2  c = vec2(.0f);
	
	// offset cutting rect from center (this will yield a smaller shape than exactly specified) 
	if ( kDegradeSliceOffsetCenter > 0.f )
	{
		// two axes
//		c += r.nextVec2() * s * .5f // normalize offset in x and y by using random unit vec2
//			* kDegradeSliceOffsetCenter	// attenuate tuning const
//			* powf( (1.f - wholeness), 1.f ); // don't do it if whole!

		// one axis is enough		
		c.y += r.nextFloat() * s.y * .5f
			* kDegradeSliceOffsetCenter	// attenuate tuning const
			* powf( (1.f - wholeness), 1.f ); // don't do it if whole!
	}
	
	Rectf f( c - s/2.f,
			 c + s/2.f );
	
	rectToPolyline(f,p);
	
	// noise (yields a slightly larger shape than exactly specified)
	// 0--1
	// 3--2
	
	if ( kDegradeSliceInflateCorners > 0.f )
	{
		const float inflatemax = kDegradeSliceInflateCorners * radius.y;
		p.getPoints()[0].y -= r.nextFloat() * inflatemax;
	//	p.getPoints()[1].y -= r.nextFloat() * inflatemax;
	//	p.getPoints()[2].y += r.nextFloat() * inflatemax;
		p.getPoints()[3].y += r.nextFloat() * inflatemax;
	}
}

void MolecularSim::Part::makeMesh_slice( ci::TriMeshRef mesh, vec2 radius, ColorA color, Rand& r ) const
{
	// fall back to small circle if we get too small
	/*
	{
		vec2  rw = radius * mWholeness;
		float mr = min( rw.x, rw.y );
		
		if ( mr < kRadiusMin ) {
			return makeMesh_shrink( mesh, radius, color, r );
		}
	}*/
	
	// unit circle
	// cache it to optimize
	// its actually a vector of length 1, so we can easily use PolyLine2 comp. geom code
	static shared_ptr<vector<PolyLine2>> unitCircle;
	if (!unitCircle) {
		unitCircle = make_shared< vector<PolyLine2> >();
		unitCircle->resize(1);
		circleToPolyline( vec2(0.f), 1.f, (*unitCircle)[0] );
	}
	
	//
	vector<PolyLine2> circle = *unitCircle;
	circle[0].scale(radius);
	
	if ( kTuning.mDebugSliceAllMolecules || mWholeness < 1.f )
	{
		vector<PolyLine2> cutWith(1);
		makeDegradeIntersectShape( radius, mWholeness, r, cutWith[0] );
		vector<PolyLine2> out = PolyLine2::calcIntersection( circle, cutWith );

		if ( out.empty() ) {
			// calcIntersection can fail..., so fallback to circle
//			return makeMesh_shrink( mesh, radius, color, r );
			out = cutWith;
		}
		else polylineToMesh( out[0], color, mesh );
	}
	else
	{
		// TODO we could cache an unsliced mesh, and just copy it over and just rewrite the colors
		// in case degrade is zero
		polylineToMesh( circle[0], color, mesh );
	}
}

void MolecularSim::Part::makeMesh_shrink( ci::TriMeshRef mesh, vec2 radius, ColorA color, Rand& r ) const
{
	const int	N		= MolecularSim::kTuning.mNumCirclePartVertices;	
	const float tDelta	= 1 / (float)N * 2.0f * 3.14159f;

	float	 	t = 0;
	
	mesh->appendPosition( vec2(0.f) );
	mesh->appendColors( &color, 1 );
	
	for( int i=0; i<N; ++i )
	{
		vec2 unit( math<float>::cos( t ), math<float>::sin( t ) );
		t += tDelta;
		
		unit *= radius * mWholeness;
		
		mesh->appendPosition( unit );
		mesh->appendColors( &color, 1 );
		
		mesh->appendTriangle( 0, (i)+1, ((i+1)%N) + 1 );			
	}	
}

void MolecularSim::Part::makeMesh_randomdrop( ci::TriMeshRef mesh, vec2 radius, ColorA color, Rand& r ) const
{
	const int	N		= MolecularSim::kTuning.mNumCirclePartVertices;	
	const float tDelta	= 1 / (float)N * 2.0f * 3.14159f;

	float	 	t = 0;
	
	mesh->appendPosition( vec2(0.f) );
	mesh->appendColors( &color, 1 );
	
	for( int i=0; i<N; ++i )
	{
		vec2 unit = radius * vec2( math<float>::cos( t ), math<float>::sin( t ) );
		t += tDelta;
		
		// randomly repeat the last vertex with degrade param
		if ( i>2 && r.nextFloat() > mWholeness ) {
			unit = mesh->getPositions<2>()[ mesh->getNumVertices()-1 ];
		}
		
		mesh->appendPosition( unit );
		mesh->appendColors( &color, 1 );
		
		mesh->appendTriangle( 0, (i)+1, ((i+1)%N) + 1 );			
	}	
}

ci::TriMeshRef
MolecularSim::Part::makeMesh( ColorA color, float inflateDrawRadius ) const
{
	ci::TriMeshRef mmesh = ci::TriMesh::create( ci::TriMesh::Format().positions(2).colors(4) );
	ci::TriMeshRef  mesh = ci::TriMesh::create( ci::TriMesh::Format().positions(2).colors(4) );

	for( int mi=0; mi<mMulti.size(); ++mi )
	{
		const auto &m = mMulti[mi];
		
		Rand r( 4000000.f * mDegradeKey + mi );
		vec2 radius = mRadius + vec2(inflateDrawRadius);
		
		// make mesh
		mesh->clear();
		makeMesh_slice( mesh, radius, color, r );
//		makeMesh_randomdrop( mesh, radius, color, r );
//		makeMesh_shrink( mesh, radius, color, r );

		// transform, concatenate
		mat4 x;
		x *= translate( vec3( m.mLoc * min(mRadius.x,mRadius.y) * (1.f-MolecularSim::kTuning.mMultimerAdhereOverlapFrac) * 2.f, 0) );
		x *= glm::rotate( m.mAngle, vec3(0,0,1) );
//		x *= scale( vec3(mRadius.x+inflateDrawRadius,mRadius.y+inflateDrawRadius,1.f) );

		mmesh = concatMesh( mmesh, mesh, x );
	}
	
	return mmesh;
}

glm::mat4
MolecularSim::Part::getRootTransform() const
{
	mat4 xform;
	xform *= translate( vec3(mLoc,0) );
	xform *= glm::rotate( mAngle, vec3(0,0,1) );	
	return xform;
}

glm::mat4
MolecularSim::Part::getTransform( int multiIndex ) const
{
	mat4 xform = getRootTransform();
	
	if ( multiIndex >= 0 && multiIndex < mMulti.size() )
	{
		const Multi &m = mMulti[multiIndex];
		xform *= translate( vec3( m.mLoc * min(mRadius.x,mRadius.y) * 2.f, 0) );
		xform *= glm::rotate( m.mAngle, vec3(0,0,1) );
	}
	
	xform *= scale( vec3(mRadius.x,mRadius.y,1.f) );	
	return xform;
}
