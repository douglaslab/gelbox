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

void SliderView::draw()
{
	mSlider.draw();
}

void SliderView::mouseDown( ci::app::MouseEvent e )
{
	vec2 local = rootToChild(e.getPos());
	
	mDragHandleHasMouseDown = mSlider.calcHandleRect().contains(local);
	
	mDragSliderStartValue = mSlider.mValue;

	if ( mSlider.calcPickRect().contains(local) )
	{
		mSlider.setValueWithMouse( local );
	}
}

void SliderView::mouseUp  ( ci::app::MouseEvent e )
{
	const float kSingleClickDist = 2.f; 

	if ( distance( getMouseDownLoc(), getMouseLoc() ) < kSingleClickDist
	  && mSlider.calcPickRect().contains(e.getPos()) )
	{
		mSlider.setValueWithMouse( rootToChild(e.getPos()) );
	}
}

void SliderView::mouseDrag( ci::app::MouseEvent e )
{
	vec2 mouseDownLocal = rootToChild(getMouseDownLoc());
	vec2 local = rootToChild(e.getPos());
	vec2 delta = local - mouseDownLocal; 

	if ( mSlider.mIsGraph && mSlider.calcPickRect().contains(mouseDownLocal) )
	{
		mSlider.setValueWithMouse(local);
	}
	else if ( mDragHandleHasMouseDown )
	{		
		float deltaVal = delta.x / fabsf(mSlider.mEndpoint[0].x - mSlider.mEndpoint[1].x) ; 
		
		mSlider.setNormalizedValue(mDragSliderStartValue + deltaVal);
	}	
}

void SliderView::setFrameAndBoundsWithSlider()
{
	Rectf r = mSlider.calcBounds();
	
	setFrame ( r );
	setBounds( r );
//	setBounds( Rectf( vec2(0,0), r.getSize() ) );
}	
