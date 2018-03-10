//
//  CheckboxView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 3/9/18.
//
//

#include "CheckboxView.h"
#include "Layout.h"

using namespace ci;
using namespace std;

void CheckboxView::setup( string name )
{
	const int pixelsPerPt = 1; 

	mBoxRect = Rectf( vec2(0.f), kLayout.mCheckboxSize );

	mLabel = kLayout.renderSubhead(name); // get proper font for this!
	mLabelRect = Rectf( vec2(0.f), mLabel->getSize() * pixelsPerPt );
	mLabelRect += mBoxRect.getLowerRight() + vec2(kLayout.mCheckboxToLabelGutter,0.f) - mLabelRect.getLowerLeft();
	
	Rectf frame = mBoxRect;
	frame.include(mLabelRect);
	
	setFrameAndBoundsWithSize( frame );
}

void CheckboxView::draw()
{
	if (kLayout.mDebugDrawLayoutGuides)
	{
		gl::color(kLayout.mDebugDrawLayoutGuideColor);
		gl::drawStrokedRect(getBounds());
	}
	
	gl::color( kLayout.mCheckboxColor );
	gl::drawStrokedRect(mBoxRect);

	// draw indicator	
	bool v = getValue();
	
	if ( getHasMouseDown() && pick( rootToParent(getMouseLoc()) ) ) {
		v = !v; // preview mouse click
	}
	
	if ( v )
	{
		Rectf r = mBoxRect;
		r.inflate( vec2(-2.f) );
		gl::drawSolidRect(r);
	}
	
	if (mLabel)
	{
		gl::color(1,1,1);
		gl::draw(mLabel,mLabelRect);
	}
}

void CheckboxView::mouseUp( ci::app::MouseEvent e )
{
	if ( pick( rootToParent(e.getPos()) ) )
	{
		setValue( ! getValue() );
	}
}

bool CheckboxView::getValue() const
{
	if (mGetter) return mGetter();
	else return false;
}

void CheckboxView::setValue( bool v )
{
	if (mSetter) mSetter(v);
}
