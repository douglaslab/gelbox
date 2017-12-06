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
	void mouseDown( ci::app::MouseEvent ) override { mMouseDownFrame=getFrame(); }
	void mouseDrag( ci::app::MouseEvent ) override;
	
private:
	ci::Rectf mMouseDownFrame;
	ci::gl::TextureRef mImage;
	
};