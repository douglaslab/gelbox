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
	void setup( std::string, int pixelsPerPt=1 );
	void setup( ci::gl::TextureRef, int pixelsPerPt=1 );
	
	void draw() override;
	void mouseUp( ci::app::MouseEvent ) override;
	void resize() override { if (mLayoutFunction) mLayoutFunction(*this); }
	
	bool isEnabled() const { return mIsEnabledFunction ? mIsEnabledFunction() : true ; }
	
	std::function<void()> mClickFunction;
	std::function<bool()> mIsEnabledFunction;
	std::function<void( ButtonView& )> mLayoutFunction;
	
	ci::ColorA	mFrameColor;
	ci::ColorA	mFillColor;
	float		mRectCornerRadius=0.f;
	
private:
	void drawFrame() const;
	void drawFill() const;
	ci::ColorA stateColor( ci::ColorA color, ci::ColorA disabledColor ) const;

	ci::gl::TextureRef mImage;

};
