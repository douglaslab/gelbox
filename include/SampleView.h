//
//  SampleView.h
//  Gelbox
//
//  Created by Chaim Gingold on 1/5/18.
//
//

#pragma once

#include "View.h"
#include "Sample.h"

class Sample;
typedef std::shared_ptr<Sample> SampleRef;

class GelView;
typedef std::shared_ptr<GelView> GelViewRef;

class SampleView;
typedef std::shared_ptr<SampleView> SampleViewRef;

class FragmentView;
typedef std::shared_ptr<FragmentView> FragmentViewRef;

class BufferView;
typedef std::shared_ptr<BufferView> BufferViewRef;


class SampleView : public View
{
public:

	SampleView();
	
	void setGelView( GelViewRef v ) { mGelView=v; }
		
	void close(); // removes from view, closes frag editor if any
	
	// shared select/rollover state
	void setSelectionStateData( SampleFragRefRef s ) { mSelection=s; }
	void setRolloverStateData ( SampleFragRefRef s ) { mRollover =s; }
	SampleFragRefRef getSelectionStateData() const { return mSelection; }
	SampleFragRefRef getRolloverStateData () const { return mRollover; }
	
	// callout
	void setCalloutAnchor( glm::vec2 p ) { mAnchor=p; updateCallout(); }
	glm::vec2 getCalloutAnchor() const { return mAnchor; }
	void setSample( SampleRef s ) { mSample=s; syncToModel(); }
	SampleRef getSample() const { return mSample; }
	
	void tick( float dt ) override;
	void draw() override;
	void drawFrame() override; 

	void setBounds( ci::Rectf b ) override;
	
	void mouseUp( ci::app::MouseEvent ) override;
	void mouseDown( ci::app::MouseEvent ) override;
	void mouseDrag( ci::app::MouseEvent ) override;
	void keyDown( ci::app::KeyEvent ) override;
	
	bool pick( glm::vec2 ) const override;
	
	void newFragment();
	void deleteFragment( int i ); // fades out instances
	
	void fragmentDidChange( int frag ); // -1 for we deleted one; in practice ignores frag 
	int  getFocusFragment() const; // rollover or selection (for feedback)
	int  getSelectedFragment() const;
	
	// public so gelview can twiddle what is highlighted
	void selectFragment( int i );
	void deselectFragment() { selectFragment(-1); }
	int  getRolloverFragment ();
	
	// options so we can make frozen gel callout views 
	bool getIsNewBtnEnabled() const { return ! mIsLoupeView; }
	void setPopDensityScale( float s ) { mPopDensityScale=s; }
	void prerollSim();
	void setSimTimeScale( float s ) { mSimTimeScale=s; }
	void setIsLoupeView ( bool  l ) { mIsLoupeView=l; } // i.e. gel detail view; a loupe
	void setHasLoupe	( bool  l ) { mHasLoupe=l; } // does it have a circular widget for callout? 
	void clearParticles() { mParts.clear(); }
	void setRand( ci::Rand r ) { mRand = r; }
	
	//
	enum class Drag
	{
		None,
		Loupe,
		View,
		LoupeAndView
	};
	void setDragMode( Drag d ) { mDrag=d; } // if you want to reroute mouseDown/mouseDrag events and customize behafvior
	
private:

	bool isFragment( int i ) const { return i >=0 && i < mFragments.size() ; }
	void showFragmentEditor( int i );
	bool pickNewBtn( glm::vec2 ) const;
	void updateCallout();
	void closeFragEditor();
	void openFragEditor();
	void syncToModel(); // updates mFragments to match mSample

	void setRolloverFragment( int i );
	
	glm::vec2		mAnchor; // anchor for callout. in frame (parent) space. center of loupe widget
	ci::PolyLine2   mCallout; // in frame (parent) space
	bool			mIsLoupeView = false;
	bool			mHasLoupe    = false; // little circle thing on persistent loupes
	
	Drag			mDrag;
	
	SampleRef		mSample; // source data

	SampleFragRefRef mSelection;
	SampleFragRefRef mRollover;
	
	glm::vec2		mNewBtnLoc;
	float			mNewBtnRadius;
	ci::gl::TextureRef mNewBtnImage;
	
	// other views
	GelViewRef		mGelView;
	FragmentViewRef mFragEditor;
	BufferViewRef	mBufferView;
	
	// ui + loupe logic (relevant if mIsLoupeView)
	bool pickLoupe( ci::vec2 rootLoc ) const;
	void drawLoupe() const;

	bool pickCalloutWedge( ci::vec2 rootLoc ) const; // respects mHasLoupe and kCanPickCalloutWedge in .cpp file
	
	void openBufferView( bool v=true );
	
	// particle sim
	class Part;
	
	void tickSim( float dt ); // dt=1 for normal speed
	void drawSimBackground();
	void drawSim();
	int  pickPart( ci::vec2 ) const; // local space; -1 for none
	int  pickFragment( ci::vec2 ) const;
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
		
		float				mSampleSizeBias=-1.f; // mirrors Sample::Fragment
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
		
		glm::mat4 getTransform( int multiIndex=-1 ) const;

	};
	
	ci::Rand		  mRand;
	
	std::vector<Frag> mFragments;	
	std::vector<Part> mParts;

	float mPopDensityScale=1.f;
	float mSimTimeScale   =1.f;
	
};