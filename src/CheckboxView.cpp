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
	mLabelTextScale = ci::app::getWindowContentScale();

	mBoxRect = Rectf( vec2(0.f), kLayout.mCheckboxSize );

	mLabel = kLayout.renderUI(name,mLabelTextScale); // get proper font for this!
	mLabelRect = Rectf( vec2(0.f), mLabel->getSize() / mLabelTextScale );
	mLabelRect += mBoxRect.getLowerRight() + vec2(kLayout.mCheckboxToLabelGutter,0.f) - mLabelRect.getLowerLeft();
	mLabelRect += vec2(0.f,2.f); // tweak! (could be programmatically done as center in y dimension)
	
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
	gl::drawStrokedRect( mBoxRect.inflated(vec2(-.5f)) );

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
