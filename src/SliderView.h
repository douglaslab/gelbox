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

	SliderView( const Slider& s ) { setSlider(s); } 

	void setSlider( const Slider& s ) { mSlider=s; setFrameAndBoundsWithSlider(); } 
	const Slider& getSlider() const { return mSlider; } 
	Slider& slider() { return mSlider; } 
	
	void tick( float dt ) override;
	void draw() override;
	
	void mouseDown( ci::app::MouseEvent ) override;
	void mouseUp  ( ci::app::MouseEvent ) override;
	void mouseDrag( ci::app::MouseEvent ) override;
	
	static void layoutSlidersInWidth(
		std::vector<SliderViewRef>	sliders,
		ci::vec2					topLeft,
		float						yOffset, // total distance from one slider topleft to the next topleft
		float						totalWidth,
		float						iconSliderGutter,
		ci::vec2					notionalIconSize
		);
		// sugar-wrapper for Slider::doLayoutInWidth, but for a list of sliders

	static void layoutSlidersFromBar(
		std::vector<SliderViewRef>	sliders,
		ci::vec2					barTopLeft,
		float						yOffset, // total distance from one slider topleft to the next topleft
		ci::vec2					barSize,
		float						iconSliderGutter
		);
		// sugar-wrapper for Slider::doLayoutFromBar, but for a list of sliders
		
private:
	void setFrameAndBoundsWithSlider();	
	
	int    mIconHasMouseDown = -1; // 0, 1 if it has it
	
	bool   mDragHandleHasMouseDown = false;
	float  mDragSliderStartValue;
	Slider mSlider;
	
};
