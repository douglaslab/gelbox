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

class GelView;
typedef std::shared_ptr<GelView> GelViewRef;

class SampleView;
typedef std::shared_ptr<SampleView> SampleViewRef;

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

	DropTargetRef getDropTarget( glm::vec2 locInFrame ) override;

	int		pickLane ( ci::vec2 ) const;	// loc in frame space
	ci::Rectf getLaneRect( int ) const; // in bounds space 

private:
	GelRef				mGel;

	int					mSelectedMicrotube=-1, mMouseDownMicrotube=-1;
	
	ci::gl::TextureRef	mMicrotubeIcon;
		
	SampleViewRef		mSampleView;
	
	ci::Rectf	calcMicrotubeIconRect( int lane ) const;
	int			pickMicrotube( ci::vec2 ) const; // local coords

	std::vector<Gel::Band> pickBands( ci::vec2 ) const; // local coords
	bool		pickBand( ci::vec2, Gel::Band& picked ) const;
	
	void		selectMicrotube( int lane );
	void		openSampleView(); 
	void		closeSampleView();
	
};