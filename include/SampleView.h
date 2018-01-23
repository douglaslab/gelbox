//
//  SampleView.h
//  Gelbox
//
//  Created by Chaim Gingold on 1/5/18.
//
//

#pragma once

#include "View.h"

class Sample;
typedef std::shared_ptr<Sample> SampleRef;

class GelView;
typedef std::shared_ptr<GelView> GelViewRef;

class SampleView;
typedef std::shared_ptr<SampleView> SampleViewRef;

class FragmentView;
typedef std::shared_ptr<FragmentView> FragmentViewRef;


class SampleView : public View, public std::enable_shared_from_this<SampleView>
{
public:

	SampleView();
	
	void setGelView( GelViewRef v ) { mGelView=v; }
	
	void close(); // removes from view, closes frag editor if any
	
	void setCalloutAnchor( glm::vec2 p ) { mAnchor=p; updateCallout(); }
	void setSample( SampleRef s ) { mSample=s; syncToModel(); }
	SampleRef getSample() const { return mSample; }
	
	void tick( float dt ) override;
	void draw() override;
	void drawFrame() override; 

	void setBounds( ci::Rectf b ) override;
	
	void mouseUp( ci::app::MouseEvent ) override;
	void mouseDown( ci::app::MouseEvent ) override;
	void keyDown( ci::app::KeyEvent ) override;
	
	bool pick( glm::vec2 ) const override;
	
	void newFragment();
	void deleteFragment( int i ); // fades out instances
	
	void fragmentDidChange( int frag ); // -1 for we deleted one; in practice ignores frag 
	int  getFocusFragment() const; // rollover or selection (for feedback)

	// public so gelview can twiddle what is highlighted
	void selectFragment( int i );
	void setHighlightFragment( int i );
	
	// options so we can make frozen gel callout views 
	void setIsNewBtnEnabled( bool v ) { mNewBtnEnabled=v; }
	void setPopDensityScale( float s ) { mPopDensityScale=s; }
	void prerollSim();
	void setSimTimeScale( float s) { mSimTimeScale=s; }
	void clearParticles() { mParts.clear(); }
	void setRand( ci::Rand r ) { mRand = r; }
	
	std::vector<float>& getFragPopScale () { return mFragPopScale ; }
	std::vector<float>& getFragSpeedBias() { return mFragSpeedBias; }
	std::vector< std::vector<float> >& getFragAggregateScale() { return mFragAggregateScale; }
	
private:

	bool isFragment( int i ) const { return i >=0 && i < mFragments.size() ; }
	void showFragmentEditor( int i );
	bool pickNewBtn( glm::vec2 ) const;
	void updateCallout();
	void closeFragEditor();
	void openFragEditor();
	void syncToModel(); // updates mFragments to match mSample

	void setRolloverFragment( int i );
	
	glm::vec2		mAnchor; // anchor for callout. in frame (parent) space
	ci::PolyLine2   mCallout;
	
	SampleRef		mSample; // source data
	int				mSelectedFragment=-1;
	int				mRolloverFragment=-1;
	int				mHighlightFragment=-1;
	
	bool			mNewBtnEnabled=true;
	glm::vec2		mNewBtnLoc;
	float			mNewBtnRadius;
	ci::gl::TextureRef mNewBtnImage;
	
	// other views
	GelViewRef		mGelView;
	FragmentViewRef mFragEditor;
	
	// particle sim
	class Part;
	
	void tickSim( float dt ); // dt=1 for normal speed
	void drawSim();
	int  pickPart( ci::vec2 ) const;
	int  pickFragment( ci::vec2 ) const;
	Part randomPart( int fragment );
	int  getRandomWeightedAggregateSize( int fragment );
	
	class Frag
	{
	public:
		Frag( ci::Color c, float r ) : mColor(c), mRadius(r) {}
		Frag() : mColor(0,0,0), mRadius(1.f) {}
		
		int			mTargetPop=20;

		glm::vec2	mRadius;
		glm::vec2	mRadiusDegraded; // lower end of radii; in case its a range
		
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
		
		float		mDegradeSizeKey=0.f; // random, from 0..1; for inter-frame coherency when dialing size + degradation 
		
		struct Multi
		{
			glm::vec2	mLoc	= glm::vec2(0,0); // normalized, so (1,1) means one unit radius away in x and y
			float		mAngle	= 0.f;
		};
		std::vector<Multi> mMulti;
		
		glm::mat4 getTransform( int multiIndex=-1 ) const;

	};
	
	ci::Rand		  mRand;
	
	std::vector<Frag> mFragments;	
	std::vector<Part> mParts;
	
	std::vector<float> mFragPopScale;
	std::vector<float> mFragSpeedBias; // -1 for none, 0 for big + slow, 1 for small + fast 
	std::vector< std::vector<float> > mFragAggregateScale;
	
	float mPopDensityScale=1.f;
	float mSimTimeScale   =1.f;
	
};