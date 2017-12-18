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

class GelView : public View, public DropTargetSource, public std::enable_shared_from_this<GelView>
{
public:

	GelView( GelRef gel ) { setGel(gel); }
	
	void	setGel( GelRef );
	GelRef	getGel() { return mGel; }
	
	void	draw() override;
	void	tick( float dt ) override;

	void	mouseUp( ci::app::MouseEvent ) override;

	void	mouseDrag( ci::app::MouseEvent ) override {
		setFrame( getFrame() + getCollection()->getMouseMoved() );
	}

	DropTargetRef getDropTarget( glm::vec2 locInFrame ) override;

	int		pickLane ( ci::vec2 ) const;	// loc in frame space
	ci::Rectf getLaneRect( int ) const; // in bounds space 
	
private:
	GelRef mGel;

};