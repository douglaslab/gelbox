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

class GelView;
typedef std::shared_ptr<GelView> GelViewRef;

class GelView : public View
{
public:

	GelView( GelRef gel ) { setGel(gel); }
	
	void setGel( GelRef );
	
	void draw() override;
	void tick( float dt ) override;

	void mouseUp( ci::app::MouseEvent ) override;

	void mouseDrag( ci::app::MouseEvent ) override {
		setFrame( getFrame() + getCollection()->getMouseMoved() );
	}

	int  pickLane ( ci::vec2 ) const;	// loc in frame space
	ci::Rectf getLaneRect( int ) const; // in bounds space 
	
private:
	GelRef mGel;

};