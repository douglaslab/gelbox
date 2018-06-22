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

class MolecularSim
{
public:

	MolecularSim();
	
	// sim
	void		setBounds( ci::Rectf r );
	ci::Rectf	getBounds() const { return mBounds; }
	
	void tick( bool bulletTime );

	void setSample( const SampleRef ); // updates mFragments to match mSample
	void deleteFragment( int i ); // also erases it from the sample!!


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
	

private:

	ci::TriMeshRef makeMoleculesMesh( SampleFragRefRef selection, SampleFragRefRef rollover ) const;
	

	class Part;

	Part randomPart( int fragment );
	int  getRandomWeightedAggregateSize( int fragment );
	
	class Frag
	{
	public:
		Frag( ci::Color c, float r ) : mColor(c), mRadiusHi(r), mRadiusLo(r) {}
		Frag() : mColor(0,0,0), mRadiusHi(1.f), mRadiusLo(1.f) {}
		
		int			mTargetPop=20;
		bool		mIsDye=false;
		
		glm::vec2	mRadiusHi;
		glm::vec2	mRadiusLo;
		
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
		
		float		mRadiusScaleKey=0.f; // random, from 0..1; for inter-frame coherency when dialing size + degradation 
		
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
	};
	
	SampleRef		  mSample;
	
	ci::Rectf		  mBounds;
	ci::Rand		  mRand;
	
	std::vector<Frag> mFragments;	
	std::vector<Part> mParts;

	float mSizeDensityScale	=1.f; // implicitly set by bounds
	float mPopDensityScale	=1.f; // set by user
	float mTimeScale   		=1.f;	
	
};
