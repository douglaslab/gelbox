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
#include "MolecularSim.h"

class Sample;
typedef std::shared_ptr<Sample> SampleRef;

class GelView;
typedef std::shared_ptr<GelView> GelViewRef;

class SampleView;
typedef std::shared_ptr<SampleView> SampleViewRef;

class FragmentView;
typedef std::shared_ptr<FragmentView> FragmentViewRef;

class SampleSettingsView;
typedef std::shared_ptr<SampleSettingsView> SampleSettingsViewRef;

class ButtonView;
typedef std::shared_ptr<ButtonView> ButtonViewRef;


class SampleView : public View
{
public:

	void setup();
	
	void setGelView( GelViewRef v ) { mGelView=v; }
	GelViewRef getGelView() const { return mGelView; }
	
	void close(); // removes from view, closes frag editor if any
	
	// shared select/rollover state
	void setSelectionStateData( SampleFragRefRef s ) { mSelection=s; }
	void setRolloverStateData ( SampleFragRefRef s ) { mRollover =s; }
	SampleFragRefRef getSelectionStateData() const { return mSelection; }
	SampleFragRefRef getRolloverStateData () const { return mRollover; }
	
	// callout (anchor is in parent space, i.e. frame space)
	void setCalloutAnchor( glm::vec2 p ) { mAnchor=p; updateCallout(); }
	void setShowCalloutAnchor( bool v ) { mShowCalloutAnchor=v; }
	glm::vec2 getCalloutAnchor() const { return mAnchor; }
	void setSample( SampleRef s ) { mSample=s; mMolecularSim.setSample(s); }
	SampleRef getSample() const { return mSample; }
	
	void tick( float dt ) override;
	void draw() override;

	void setBounds( ci::Rectf b ) override;
	
	void mouseUp( ci::app::MouseEvent ) override;
	void mouseDown( ci::app::MouseEvent ) override;
	void mouseDrag( ci::app::MouseEvent ) override;
	void keyDown( ci::app::KeyEvent ) override;
	
	bool pick( glm::vec2 ) const override;
	
	void newFragment(); // is at back of fragments
	void deleteFragment( int i ); // fades out instances
	
	void fragmentDidChange( int frag ); // -1 for we deleted one; in practice ignores frag 
	int  getFocusFragment() const; // rollover or selection (for feedback)
	int  getSelectedFragment() const;
	
	// public so gelview can twiddle what is highlighted
	void selectFragment( int i );
	void deselectFragment() { selectFragment(-1); }
	int  getRolloverFragment ();
	
	// options so we can make frozen gel callout views 
	void setIsLoupeView ( bool  l );  // i.e. gel detail view; a loupe
	void setHasLoupe	( bool  l ) { mHasLoupe=l; } // does it have a circular widget for callout? 

	//
	enum class Drag
	{
		None,
		Loupe,
		View,
		LoupeAndView
	};
	void setDragMode( Drag d ) { mDrag=d; } // if you want to reroute mouseDown/mouseDrag events and customize behafvior

	void setFrame ( ci::Rectf f ) override { View::setFrame(f); mTargetFrame=f; }
	void setTargetFrame( ci::Rectf f ) { mTargetFrame=f; }
	ci::Rectf getTargetFrame() const { return mTargetFrame; }

	void setRand( ci::Rand r ) { mRand = r; mMolecularSim.setRand(r); }
	void simClearParticles() { mMolecularSim.clearParticles(); }
	void simPreroll() { mMolecularSim.preroll(); }
	void simPause( bool p=true ) { mMolecularSim.setTimeScale( p ? 0.f : 1.f ); } 
	void drawRepresentativeOfFrag( int frag, ci::vec2 pos ) const { mMolecularSim.drawRepresentativeOfFrag(frag,pos); }	
	
private:

	bool isFragmentADye( int i ) const { return mMolecularSim.isFragment(i) && mSample->mFragments[i].isDye(); } 
	void showFragmentEditor( int i );
	void updateCallout();
	void closeFragEditor();
	void openFragEditor();
	void layout();
	void drawHeader();
	
	void setRolloverFragment( int i );
	
	glm::vec2		mAnchor; // anchor for callout. in frame (parent) space. center of loupe widget
	ci::PolyLine2   mCallout; // in frame (parent) space
	bool			mIsLoupeView = false;
	bool			mHasLoupe    = false; // little circle thing on persistent loupes
	bool			mShowCalloutAnchor = true;
	bool			mBackgroundHasSelection = false;
	
	Drag			mDrag;
	
	SampleRef		mSample; // source data

	SampleFragRefRef mSelection;
	SampleFragRefRef mRollover;
	
	ButtonViewRef	 mNewBtn;

	ci::gl::TextureRef	mMicrotubeIcon;
	ci::Rectf			mMicrotubeIconRect;

	int					mHeadingScale=1;
	ci::gl::TextureRef	mHeadingTex;
	ci::Rectf			mHeadingRect;
	
	// sim
	MolecularSim		mMolecularSim;
	ci::Rand			mRand;
	
	// ui animation logic
	bool				mIsClosing = false;
	ci::Rectf			mTargetFrame;
	
	// other views
	GelViewRef				mGelView;
	FragmentViewRef			mFragEditor;
	SampleSettingsViewRef	mSettingsView;
	
	// ui + loupe logic (relevant if mIsLoupeView)
	bool pickLoupe( ci::vec2 frameSpace ) const;
	void drawLoupe() const;

	bool pickCalloutWedge( ci::vec2 frameSpace ) const; // respects mHasLoupe and kCanPickCalloutWedge in .cpp file
	
	void openSettingsView( bool v=true );
		
};
