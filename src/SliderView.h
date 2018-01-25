//
//  SliderView.h
//  Gelbox
//
//  Created by Chaim Gingold on 1/24/18.
//
//

#pragma once

#include "Slider.h"
#include "View.h"

class SliderView;
typedef std::shared_ptr<SliderView> SliderViewRef;

class SliderView : public View
{
public:

	SliderView( Slider& s ) { setSlider(s); } 

	void setSlider( const Slider& s ) { mSlider=s; setFrameAndBoundsWithSlider(); } 
	const Slider& getSlider() const { return mSlider; } 

	void draw() override;
	
	void mouseDown( ci::app::MouseEvent ) override;
	void mouseUp  ( ci::app::MouseEvent ) override;
	void mouseDrag( ci::app::MouseEvent ) override;
		
private:
	void setFrameAndBoundsWithSlider();	
	
	bool   mDragHandleHasMouseDown = false;
	float  mDragSliderStartValue;
	Slider mSlider;
	
};