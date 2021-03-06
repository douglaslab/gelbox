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

class ImageView : public View//, public std::enable_shared_from_this<ImageView>
{
public:

	ImageView( ci::gl::TextureRef );
	
	void draw() override;
	void drawFrame() override;
	
	void mouseDown( ci::app::MouseEvent ) override;
	void mouseDrag( ci::app::MouseEvent ) override;
	void mouseUp  ( ci::app::MouseEvent ) override;
	void keyDown  ( ci::app::KeyEvent   ) override;
	
private:
	ci::Rectf mMouseDownFrame;
	
	ci::gl::TextureRef mImage;

	ci::Rectf calcResizeBox() const; // in frame (parent) space
	
	enum Action
	{
		Drag,
		Resize
	};
	
	Action mAction;
};