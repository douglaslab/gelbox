//
//  GelView.h
//  Gelbox
//
//  Created by Chaim Gingold on 12/5/17.
//
//

#pragma once

#include "Gel.h"
#include "GelSim.h"
#include "View.h"
#include "Sample.h"

class Sample;
typedef std::shared_ptr<Sample> SampleRef;

class GelView;
typedef std::shared_ptr<GelView> GelViewRef;

class SampleView;
typedef std::shared_ptr<SampleView> SampleViewRef;

class BufferView;
typedef std::shared_ptr<BufferView> BufferViewRef;

class GelRender;
typedef std::shared_ptr<GelRender> GelRenderRef;

class ButtonView;
typedef std::shared_ptr<ButtonView> ButtonViewRef;

class GelViewSettingsView;
typedef std::shared_ptr<GelViewSettingsView> GelViewSettingsViewRef;


class GelView : public View
{
public:

	GelView();
	
	void	setup( GelRef gel );
	
	void	setGel( GelRef );
	GelRef	getGel() { return mGel; }
	
	void	draw() override;
	void	tick( float dt ) override;
	bool	pick( ci::vec2 ) const override;
	void	setBounds( ci::Rectf ) override;
	void	setFrame( ci::Rectf ) override;
	
	void	mouseDown( ci::app::MouseEvent ) override;
	void	mouseUp  ( ci::app::MouseEvent ) override;
	void	mouseDrag( ci::app::MouseEvent ) override;
	void	mouseMove( ci::app::MouseEvent ) override;

//	DropTargetRef getDropTarget( glm::vec2 locInFrame ) override;

	int			pickLane ( ci::vec2 ) const; // loc in frame space; -1 if out of bounds
	ci::Rectf	getLaneRect( int ) const; // in bounds space 

	void		selectMicrotube( int lane );
	void		openSampleView(); 
	void		closeSampleView();

	void		sampleDidChange( SampleRef );
	void		gelDidChange();
	void		updateGelDetailViewContent( SampleViewRef ) const;
	
	void		newFragmentAtPos( ci::vec2 ); // in root (e.g. mouse) space 
	SampleRef	getSample( int lane ) const { if (mGel) return mGel->getSamples()[lane]; else return 0; }
	void		setSample( int lane, SampleRef s ) { assert(mGel); mGel->getSamples()[lane]=s; }

	void		selectFragment( int lane, int frag );
	void		deselectFragment();
	
private:
	GelRef				mGel;

	int					mSelectedMicrotube=-1, mMouseDownMicrotube=-1;
	
	Gel::Band			mMouseDownBand;
	Gel::Band			mMouseDragBand;
	int					mMouseDragBandMadeSampleInLane=-1;
	
	ci::gl::TextureRef	mMicrotubeIcon;
		
	SampleViewRef		mSampleView;
	SampleViewRef		mHoverGelDetailView;
	SampleViewRef		mMouseDownMadeLoupe;
	std::vector< std::weak_ptr<SampleView> > mLoupeViews;
	
	SampleFragRefRef	mSelectedState, mRolloverState; 

	ButtonViewRef	 	mSettingsBtn;
	GelViewSettingsViewRef mSettingsView;
	
	// gel renderer
	bool				mGelRenderIsDirty = false;
	GelRenderRef		mGelRender;
	
	void		updateGelRender();
	
	void		layout(); // called once by setup, then by setBounds 
	
	// microtubes
	ci::Rectf	calcMicrotubeWellRect( int lane ) const; // not icon rect; a notional rectangle that contains the icon
	int			pickMicrotube( ci::vec2 ) const; // local coords

	// bands
	std::vector<Gel::Band> pickBands( ci::vec2 ) const; // local coords
	bool		pickBand( ci::vec2, Gel::Band& picked ) const;
	void		updateBandRollover( ci::vec2 rootPos );			
	void		mouseDragBand( ci::app::MouseEvent );
	
	// loupes
	void		updateHoverGelDetailView();
	void		closeHoverGelDetailView();

	SampleViewRef addLoupe( ci::vec2 withSampleAtRootPos ); // persistent; returns it if you want it
	SampleViewRef updateGelDetailView( SampleViewRef view, ci::vec2 withSampleAtRootPos, bool forceUpdate, bool doLayout ); // root coords; makes view if null
	SampleViewRef openGelDetailView();
	SampleRef	makeSampleFromGelPos( ci::vec2 pos ) const;
	void		updateLoupes();

	// buffer view
	void		openBufferView( bool v=true );
	
	// drawing
	void		drawMicrotubes() const;
	void		drawBands() const;
	void		drawWells() const;
	void		drawBandFocus() const;

	// reverse gel sim solver
	typedef std::map<int,int> tReverseGelSolverCache; // maps y to base pairs, all this is f( aggregate, aspectRatio, time )
					
	int			solveBasePairForY(
					int			  findy,
					GelSim::Input params, // ignores mBases, which we are solving for.
					float		  ystart,
					float		  yscale,
					tReverseGelSolverCache* cache=0 ) const;
	
	void		drawReverseSolverTest();
	
};
