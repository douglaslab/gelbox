//
//  SliderView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 1/24/18.
//
//

#include "SliderView.h"

using namespace std;
using namespace ci;

void SliderView::tick( float dt )
{
//	if ( !getHasMouseDown() )
	{
		mSlider.pullValueFromGetter();
	}
}

void SliderView::draw()
{
	int highlightIcon = mIconHasMouseDown;
	
	if ( highlightIcon != mSlider.pickIcon(rootToChild(getMouseLoc())) ) highlightIcon=-1;
	
	mSlider.draw( highlightIcon );
}

void SliderView::mouseDown( ci::app::MouseEvent e )
{
	vec2 local = rootToChild(e.getPos());
	
	mDragHandleHasMouseDown = mSlider.calcHandleRect().contains(local);
	
	mDragSliderStartValue = mSlider.mValue;

	mIconHasMouseDown = mSlider.pickIcon(local); 
	
	if ( mSlider.calcPickRect().contains(local) )
	{
		mSlider.setValueWithMouse( local );
	}
}

void SliderView::mouseUp  ( ci::app::MouseEvent e )
{
	const float kSingleClickDist = 2.f; 

	vec2 localPos = rootToChild(e.getPos());
	
	if ( distance( getMouseDownLoc(), getMouseLoc() ) < kSingleClickDist
	  && mSlider.calcPickRect().contains(e.getPos()) )
	{
		mSlider.setValueWithMouse( localPos );
	}
	// click end-cap icon
	else if ( mIconHasMouseDown != -1 && mIconHasMouseDown == mSlider.pickIcon(localPos) )
	{
		mSlider.setLimitValue( mIconHasMouseDown );
	}
	
	// clear state
	mIconHasMouseDown = -1;
}

void SliderView::mouseDrag( ci::app::MouseEvent e )
{
	vec2 mouseDownLocal = rootToChild(getMouseDownLoc());
	vec2 local = rootToChild(e.getPos());
	vec2 delta = local - mouseDownLocal; 

	if ( mDragHandleHasMouseDown )
	{		
		float deltaVal = delta.x / fabsf(mSlider.mEndpoint[0].x - mSlider.mEndpoint[1].x) ; 
		
		mSlider.setNormalizedValue(mDragSliderStartValue + deltaVal);
	}
	else if ( mSlider.calcPickRect().contains(mouseDownLocal) )
	{
		mSlider.setValueWithMouse(local);
	}
}

void SliderView::setFrameAndBoundsWithSlider()
{
	Rectf r = mSlider.calcBounds();
	
	setFrame ( r );
	setBounds( r );
}	

void SliderView::layoutSliders(
	std::vector<SliderViewRef>	sliders,
	ci::vec2					topLeft,
	float						yOffset, // total distance from one slider topleft to the next topleft
	float						totalWidth,
	float						iconSliderGutter,
	ci::vec2					notionalIconSize
	)
{
	for( int i=0; i<sliders.size(); ++i )
	{
		Slider  s = sliders[i]->getSlider();
		
		s.doLayoutInWidth(
			totalWidth,
			iconSliderGutter,
			notionalIconSize ); 

		sliders[i]->setSlider(s);
		
		sliders[i]->setFrame(
			  sliders[i]->getFrame()
			+ topLeft
			+ vec2(0.f,(float)i*yOffset) );
	}	
}
