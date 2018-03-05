//
//  Button.h
//  Gelbox
//
//  Created by Chaim Gingold on 3/5/18.
//
//

#pragma once

#include "View.h"

class ButtonView;
typedef std::shared_ptr<ButtonView> ButtonViewRef;

class ButtonView : public View
{
public:
	void setup( ci::gl::TextureRef, int pixelsPerPt=1 );
	
	void draw() override;
	void mouseUp( ci::app::MouseEvent ) override;
	
	std::function<void()> mClickFunction;
	
private:
	ci::gl::TextureRef mImage;

};