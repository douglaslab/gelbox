//
//  MolecularSim.h
//  Gelbox
//
//  Created by Chaim Gingold on 6/22/18.
//

#include "cinder/Rand.h"
#include "Sample.h"
#include "cinder/GeomIo.h"

#pragma once

class DegradeFilter : public std::map<int,int> {}; // fragment => base pair size equiv

class MolecularSimTuning
{
public:

	void load( const ci::JsonTree& );
		
	// sim
	float mBulletTimeScale = .1f;
	bool  mPartSimIsOldAgeDeathEnabled = false;
	int   mNumPartsPerMassHigh = 50;

	float mFadeInStep = .05f; 
	float mFadeOutStep = .05f;
	float mMaxAge = 30 * 1000;

	float mRadiusMin = 2.f;
	float mRadiusMax = 32.f;

	// mitigate dithering artifacts by being lenient / less aggressive with aggregate culling
	float mAggregateCullChanceScale = (1.f / 30.f) * .5f;
	int   mAggregateCullPopEps = 0;
	float mMaxAgeMisfitAggregate = 30 * 30;
	 
	float mJitter = .75f;

	float mPartMinPickRadius = 8.f;	


	// draw sim
	int mNumCirclePartVertices = 32;

	float mMultimerAdhereOverlapFrac = .1f;	
		
	bool mDebugSliceAllMolecules = false;
	
};

class MolecularSim
{
public:

	MolecularSim();
	
	// sim
	void		setBounds( ci::Rectf r );
	ci::Rectf	getBounds() const { return mBounds; }
	
	void tick( bool bulletTime );

	void setSample( const SampleRef, DegradeFilter* degradeFilter=0 );
		// updates mFragments to match mSample
		
	void deleteFragment( int i ); // also erases it from the sample!!
	
	void syncToSample() { setSample( mSample, &mDegradeFilter ); }

	// advanced sim
	void setPopDensityScale( float s ) { mPopDensityScale=s; }
	void preroll();
	void setTimeScale( float s ) { mTimeScale=s; }
	void clearParticles() { mParts.clear(); }
	void setRand( ci::Rand r ) { mRand = r; }	


	// ui
	int  pickPart( ci::vec2 ) const; // local space; -1 for none
	int  pickFragment( ci::vec2 ) const;
	bool isFragment( int i ) const { return i >=0 && i < mFragments.size() ; }

	// graphics
	void drawBackground( int highlight ); // 0: none, 1: hover, 2: mouse down
	void draw( SampleFragRefRef selection, SampleFragRefRef rollover );
	void drawRepresentativeOfFrag( int frag, ci::vec2 pos ) const;	
	

	static       MolecularSimTuning  gTuning;
	static const MolecularSimTuning &kTuning;

private:

	ci::TriMeshRef makeMoleculesMesh( SampleFragRefRef selection, SampleFragRefRef rollover ) const;
	

	class Part;

	Part randomPart( int fragment );
	int  getRandomWeightedAggregateSize( int fragment );
	
	class Frag
	{
	public:
		Frag( ci::Color c, float r ) : mColor(c), mRadius(r) {}
		Frag() : mColor(0,0,0), mRadius(1.f) {}
		
		int			mTargetPop=20;
		bool		mIsDye=false;
		
		glm::vec2	mRadius;
		float		mWholenessHi=0.f, mWholenessLo=0.f;
		
		ci::Color	mColor;
		
		std::vector<float>	mAggregate; // weights per multimer size (empty means all are monomers)
		float				mAggregateWeightSum=0.f;
	};
	
	class Part
	{
	public:
		int			mFragment=0;
		
		glm::vec2	mLoc;
		glm::vec2	mVel;
		glm::vec2	mRadius;
		float		mAngle=0.f, mAngleVel=0.f; // radians, and radians per unit time step
		ci::Color	mColor;
		
		float		mAge=0.f;
		
		float		mFade=0.f;
		bool		mAlive=true; // fading in or out?
		
		float		mDegradeKey=0.f; // random, from 0..1; for inter-frame coherency when dialing size + degradation 
		float		mWholeness =1.f; // mWholeness = degrade param * degrade key (when 1, means perfect condition, 0 means fully degraded)
		
		float		calcTargetWholeness( const Frag& f ) const {
			return ci::lerp( f.mWholenessLo, f.mWholenessHi, mDegradeKey );
		}
		
		struct Multi
		{
			glm::vec2	mLoc	= glm::vec2(0,0); // normalized, so (1,1) means one unit radius away in x and y
			float		mAngle	= 0.f;
		};
		std::vector<Multi> mMulti;
		
		ci::TriMeshRef makeMesh() const { return makeMesh( ci::ColorA(mColor,mFade), 0.f ); }
		ci::TriMeshRef makeMesh( ci::ColorA color, float inflateDrawRadius ) const;
		
		glm::mat4	getRootTransform() const;
		glm::mat4	getTransform( int multiIndex=-1 ) const;
		
//		ci::TriMeshRef mMesh;
//		void		updateMesh();
		// we could cache a mesh if we get smart about lazily updating only when needed.

	private:
		void		makeMesh_randomdrop(	ci::TriMeshRef mesh,
											ci::vec2 radius, float inflateRadius,
											ci::ColorA color, ci::Rand& r ) const;
						
		void		makeMesh_shrink(		ci::TriMeshRef mesh,
											ci::vec2 radius, float inflateRadius,
											ci::ColorA color, ci::Rand& r ) const;

		void		makeMesh_slice(			ci::TriMeshRef mesh,
											ci::vec2 radius, float inflateRadius,
											ci::ColorA color, ci::Rand& r ) const;
	};
	
	SampleRef		  mSample;
	
	ci::Rectf		  mBounds;
	ci::Rand		  mRand;
	
	std::vector<Frag> mFragments;	
	std::vector<Part> mParts;

	float mSizeDensityScale	=1.f; // implicitly set by bounds
	float mPopDensityScale	=1.f; // set by user
	float mTimeScale   		=1.f;	

	DegradeFilter mDegradeFilter;
};
