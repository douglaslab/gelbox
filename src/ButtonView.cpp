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

const ColorA kDisableColor( .5f, .5f, .5f,.5f ); 

void ButtonView::setup( std::string string, int pixelsPerPt )
{
	setup( kLayout.renderUI(string), pixelsPerPt );
}

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

ColorA ButtonView::stateColor( ColorA c, ColorA disabledColor ) const
{
	const bool hasHover     = getHasRollover ();
	const bool hasMouseDown = getHasMouseDown() && pick(getMouseLoc()); 
	
	if ( !isEnabled() )		 c = disabledColor;
	else if ( hasMouseDown ) c = kLayout.mBtnDownColor;
	else if ( hasHover )	 c = kLayout.mBtnHoverColor;
	
	return c;
}

void ButtonView::draw()
{	
	drawFill();
	
	if (mImage)
	{
		gl::color( stateColor( ColorA(1,1,1,1), kDisableColor ) );
		gl::draw(mImage,getBounds());
	}
	else
	{
		gl::color( stateColor( ColorA(.5,.5,.5,1.f), kDisableColor ) );
		gl::drawSolidRect(getBounds());
	}	

	if (kLayout.mDebugDrawLayoutGuides)
	{
		gl::color( kLayout.mDebugDrawLayoutGuideColor );
		gl::drawStrokedRect( getBounds() );
	}
	
	drawFrame();
}

void ButtonView::drawFill() const
{
	Rectf r = getBounds();
	
	if ( mFillColor.a > 0.f )
	{
		gl::color( stateColor(mFillColor, ColorA(.8f,.8f,.8f,1.f)) );
		
		if ( mRectCornerRadius > 0.f ) {
			gl::drawSolidRoundedRect( r, mRectCornerRadius );
		} else {
			gl::drawSolidRect( r );
		}
	}
}

void ButtonView::drawFrame() const
{
	Rectf r = getBounds();
	
	if ( mFrameColor.a > 0.f )
	{
		gl::color( stateColor(mFrameColor, kDisableColor ) );
		
		if ( mRectCornerRadius > 0.f ) {
			gl::drawStrokedRoundedRect( r, mRectCornerRadius );
		} else {
			gl::drawStrokedRect( r );
		}
	}
}

void ButtonView::mouseUp( ci::app::MouseEvent e )
{
	if ( pick( rootToParent(e.getPos()) ) && mClickFunction )
	{
		mClickFunction();
	}
}
