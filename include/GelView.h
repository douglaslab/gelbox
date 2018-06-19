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
#include "Band.h"

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

class GelSettingsView;
typedef std::shared_ptr<GelSettingsView> GelSettingsViewRef;


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
	
	void	enableGelRender( bool v );
	bool	isGelRenderEnabled() const { return mGelRender != 0; }
	
	void	enableLoupeOnHover( bool v );
	bool	isLoupeOnHoverEnabled() const { return mIsLoupeOnHoverEnabled; }
	
	void	mouseDown( ci::app::MouseEvent ) override;
	void	mouseUp  ( ci::app::MouseEvent ) override;
	void	mouseDrag( ci::app::MouseEvent ) override;
	void	mouseMove( ci::app::MouseEvent ) override;
	void	keyDown  ( ci::app::KeyEvent ) override { updateHoverGelDetailView(); }
	void	keyUp    ( ci::app::KeyEvent ) override { updateHoverGelDetailView(); }

//	DropTargetRef getDropTarget( glm::vec2 locInFrame ) override;

	int			pickLane ( ci::vec2 ) const; // loc in frame space; -1 if out of bounds
	ci::Rectf	getLaneRect( int ) const; // in bounds space 

	void		selectMicrotube( int lane );
	void		openSampleView(); 
	void		closeSampleView();

	void		sampleDidChange( SampleRef );
	void		gelDidChange();
	void		updateGelDetailViewContent( SampleViewRef ) const;
	
	bool		newFragmentAtPos( ci::vec2 ); // in root (e.g. mouse) space (can fail to work, returns false) 
	SampleRef	getSample( int lane ) const; // returns null if invalid lane
	void		setSample( int lane, SampleRef s ); // asserts if invalid lane

	void		selectFragment( int lane, int frag );
	void		deselectFragment();
	
private:
	GelRef				mGel;

	enum class Drag
	{
		None,
		Band,
		Loupe,
		Sample,
		View
	};
	Drag				mDrag = Drag::None;
	
	int					mSelectedMicrotube=-1, mMouseDownMicrotube=-1, mMouseDownSelectedMicrotube=-1;
	SampleRef			mMouseDownSample;
	
	Band				mMouseDownBand;
	Band				mMouseDragBand;
	int					mMouseDragMadeSampleInLane=-1;
	
	ci::gl::TextureRef	mMicrotubeIcon;
		
	SampleViewRef		mSampleView;
	SampleViewRef		mHoverGelDetailView;
	SampleViewRef		mMouseDownMadeLoupe;
	std::vector< std::weak_ptr<SampleView> > mLoupeViews;
	
	SampleFragRefRef	mSelectedState, mRolloverState; 

	ButtonViewRef	 	mSettingsBtn;
	GelSettingsViewRef	mSettingsView;
	
	bool				mIsLoupeOnHoverEnabled = true;
	
	// gel renderer
	bool				mGelRenderIsDirty = false;
	GelRenderRef		mGelRender;
	
	void		updateGelRender();
	
	void		layout(); // called once by setup, then by setBounds 
	
	// microtubes
	ci::Rectf	calcMicrotubeWellRect( int lane, float* cornerRadius=0 ) const; // not icon rect; a notional rectangle that contains the icon
	ci::Rectf	calcMicrotubeIconRect( ci::Rectf wellRect ) const;
	int			pickMicrotube( ci::vec2 ) const; // local coords
	void		mouseDragSample( ci::app::MouseEvent );

	// bands
	std::vector<Band> pickBands( ci::vec2 ) const; // local coords
	bool		pickBand( ci::vec2, Band& picked ) const;
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
	void		drawDragMicrotube() const;
	void		drawBands() const;
	void		drawWells() const;
	void		drawBandFocus() const;

	// reverse gel sim solver
	float		getDragBandYReference( const Band& b ) const { return b.mRect.y1; }
	
	typedef std::map<int,int> tReverseGelSolverCache; // maps y to base pairs, all this is f( aggregate, aspectRatio, time )
			
	int			solveBasePairForY(
					int			  			findy,
					Sample 					sample,
					int						fragi,
					int						lane,
					int			  			aggregate, // select which aggregate you want (1 for monomer)
					GelSim::Context			context,
					tReverseGelSolverCache* cache=0 ) const;
	
	void		drawReverseSolverTest();
	
};
