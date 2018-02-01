//
//  GelView.h
//  Gelbox
//
//  Created by Chaim Gingold on 12/5/17.
//
//

#pragma once

#include "Gel.h"
#include "View.h"
#include "DropTargetSource.h"
#include "SampleView.h"

class Sample;
typedef std::shared_ptr<Sample> SampleRef;

class GelView;
typedef std::shared_ptr<GelView> GelViewRef;

class GelView : public View, public DropTargetSource, public std::enable_shared_from_this<GelView>
{
public:

	GelView( GelRef gel );
	
	void	setGel( GelRef );
	GelRef	getGel() { return mGel; }
	
	void	draw() override;
	void	tick( float dt ) override;
	bool	pick( ci::vec2 ) const override;
	
	void	mouseDown( ci::app::MouseEvent ) override;
	void	mouseUp  ( ci::app::MouseEvent ) override;
	void	mouseDrag( ci::app::MouseEvent ) override;
	void	mouseMove( ci::app::MouseEvent ) override;

	DropTargetRef getDropTarget( glm::vec2 locInFrame ) override;

	int			pickLane ( ci::vec2 ) const; // loc in frame space; -1 if out of bounds
	ci::Rectf	getLaneRect( int ) const; // in bounds space 

	void		selectMicrotube( int lane );
	void		openSampleView(); 
	void		closeSampleView();

	void		sampleDidChange( SampleRef );
	void		timeDidChange();
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
	
	ci::gl::TextureRef	mMicrotubeIcon;
		
	SampleViewRef		mSampleView;
	SampleViewRef		mHoverGelDetailView;
	SampleViewRef		mMouseDownMadeLoupe;
	std::vector< std::weak_ptr<SampleView> > mLoupeViews;
	
	SampleView::SelectionStateRef mSelectedState, mRolloverState, mHighlightState; 
	
	
	ci::Rectf	calcMicrotubeIconRect( int lane ) const;
	int			pickMicrotube( ci::vec2 ) const; // local coords

	std::vector<Gel::Band> pickBands( ci::vec2 ) const; // local coords
	bool		pickBand( ci::vec2, Gel::Band& picked ) const;
		
	void		updateHoverGelDetailView();
	
	SampleViewRef addLoupe( ci::vec2 withSampleAtRootPos ); // persistent; returns it if you want it
	SampleViewRef updateGelDetailView( SampleViewRef view, ci::vec2 withSampleAtRootPos, bool forceUpdate, bool doLayout ); // root coords; makes view if null
	SampleViewRef openGelDetailView();
	void		closeHoverGelDetailView();
	SampleRef	makeSampleFromGelPos( ci::vec2 pos ) const;

	void		updateBandRollover( ci::vec2 rootPos );
	
	void		updateLoupes();

	void		drawMicrotubes() const;
	void		drawBands() const;
	void		drawWells() const;
	void		drawBandFocus() const;

	// reverse gel sim solver
	typedef std::map<int,int> tReverseGelSolverCache; // maps y to base pairs, all this is f( aggregate, aspectRatio, time )
					
	int			solveBasePairForY(
					int		findy,
					int		aggregate,
					float	aspectRatio,
					float	time,
					float	ystart,
					float	yscale,
					tReverseGelSolverCache* cache=0 ) const;
	
	void		drawReverseSolverTest();
	
};