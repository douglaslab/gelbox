//
//  ImageView.h
//  Gelbox
//
//  Created by Chaim Gingold on 12/6/17.
//
//

#pragma once

#include "View.h"
#include "cinder/gl/Texture.h"

class ImageView : public View
{
public:

	ImageView( ci::gl::TextureRef );
	
	void draw() override;
	void mouseDrag( ci::app::MouseEvent ) override {
		setFrame( getFrame() + getCollection()->getMouseMoved() );
	}
	
private:
	ci::gl::TextureRef mImage;
	
};