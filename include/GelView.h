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
	
private:
	GelRef mGel;

};