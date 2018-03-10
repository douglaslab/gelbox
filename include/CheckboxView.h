//
//  CheckboxView.h
//  Gelbox
//
//  Created by Chaim Gingold on 3/9/18.
//
//

#pragma once

#include "View.h"

class CheckboxView;
typedef std::shared_ptr<CheckboxView> CheckboxViewRef;

class CheckboxView : public View
{
public:
	void setup( std::string );
	
	void draw() override;
	void mouseDown( ci::app::MouseEvent ) override { mMouseDownState=getValue(); }
	void mouseUp( ci::app::MouseEvent ) override;
	
	std::function<bool()>		mGetter;
	std::function<void(bool)>	mSetter;

	bool getValue() const; // false if no mGetter defined
	void setValue( bool ); // does nothing if no mSetter defined
	
private:
	
	bool				mMouseDownState;
	
	ci::Rectf			mBoxRect;	
	ci::Rectf			mLabelRect;	
	ci::gl::TextureRef	mLabel;

};
