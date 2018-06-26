//
//  Button.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 3/5/18.
//
//

#include "ButtonView.h"
#include "Layout.h"

using namespace ci;
using namespace std;

void ButtonView::setup( ci::gl::TextureRef t, int pixelsPerPt )
{
	vec2 size;
	
	if (t)
	{
		size = t->getSize() / pixelsPerPt;
	}
	else size = kLayout.mBtnSize;

	setFrameAndBoundsWithSize( Rectf( vec2(0), size ) );
	
	mImage = t;
}

void ButtonView::draw()
{
	const bool hasHover     = getHasRollover ();
	const bool hasMouseDown = getHasMouseDown() && pick(getMouseLoc()); 
	
	if (mImage)
	{
		if ( hasMouseDown ) gl::color(kLayout.mBtnDownColor);
		else if ( hasHover ) gl::color(kLayout.mBtnHoverColor);
		else gl::color(1,1,1);
				
		gl::draw(mImage,getBounds());
	}
	else
	{
		if ( hasMouseDown ) gl::color(kLayout.mBtnDownColor);
		else if ( hasHover ) gl::color(kLayout.mBtnHoverColor);
		else gl::color(.5,.5,.5);
		
		gl::drawSolidRect(getBounds());
	}	

	if (kLayout.mDebugDrawLayoutGuides)
	{
		gl::color( kLayout.mDebugDrawLayoutGuideColor );
		gl::drawStrokedRect( getBounds() );
	}
}

void ButtonView::mouseUp( ci::app::MouseEvent e )
{
	if ( pick( rootToParent(e.getPos()) ) && mClickFunction )
	{
		mClickFunction();
	}
}
