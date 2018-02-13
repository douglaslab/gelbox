//
//  ColorPaletteView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 2/13/18.
//
//

#include "ColorPaletteView.h"

using namespace ci;
using namespace std;

const float kSelectedColorStrokeWidth = 4.f;
const Color kSelectedColorStrokeColor(0,0,0);

ci::Color ColorPaletteView::Palette::getRandomColor( ci::Rand* r ) const
{
	int i;
	
	if (r) i = r->nextInt();
	else i = randInt();
	
	return (*this)[ i % size() ];
}

ColorPaletteView::Palette::Palette( const std::vector<ci::Color>& c )
{
	clear();
	
	for( auto i : c ) push_back(i);
}

void ColorPaletteView::layout( ci::Rectf r )
{
	mColorsRect = r;
	
	mColorSize =
		r.getSize()
		* (1.f / vec2( mColorCols, mColors.size()/mColorCols ));
		// a little janky; might be better to parameterize differently. 
		
	setFrame ( r );
	setBounds( r );
}

void ColorPaletteView::tick( float dt )
{
	pullValueFromGetter();
}

void ColorPaletteView::draw()
{
	// test
	if (1)
	{
		gl::color( ColorA( Color::gray(.5f), .2f ) );
		gl::drawSolidRect( getBounds() );
	}
	
	// colors
	for( int i=0; i<mColors.size(); ++i )
	{
		gl::color( mColors[i] );
		gl::drawSolidRect( calcColorRect(i) );
	}
	
	if ( mSelectedColor >= 0 )
	{
		gl::color(kSelectedColorStrokeColor);
		gl::drawStrokedRect(
			calcColorRect(mSelectedColor).inflated( vec2(.5f)*kSelectedColorStrokeWidth ),
			kSelectedColorStrokeWidth );
	}
}

void ColorPaletteView::mouseDown( ci::app::MouseEvent e )
{
	vec2 local = rootToChild(e.getPos());
	
	int color   = pickColor(local);
	
	if ( color != -1 )
	{
		mSelectedColor = color;
		pushValueToSetter();
	}
}

void ColorPaletteView::mouseUp  ( ci::app::MouseEvent )
{
}

void ColorPaletteView::mouseDrag( ci::app::MouseEvent e )
{
	vec2 mouseDownLocal = rootToChild(getMouseDownLoc());
	vec2 local = rootToChild(e.getPos());
//	vec2 delta = local - mouseDownLocal; 
	
	// color
	if ( pickColor(mouseDownLocal) != -1 )
	{
		int oldColor = mSelectedColor;
		int color = pickColor(local);
		mSelectedColor = color;
		
		// revert?
//		if (mSelectedColor==-1) mSelectedColor = pickColor(mouseDownLocal);
		if (mSelectedColor==-1) mSelectedColor = oldColor;

		pushValueToSetter();
	}
}

void ColorPaletteView::pushValueToSetter() const
{
	if (mSetter
	 && mSelectedColor >= 0
	 && mSelectedColor < mColors.size() )
	{
		mSetter( mColors[mSelectedColor] );
	}
	
	if (mDidPushValue) mDidPushValue();
}

void ColorPaletteView::pullValueFromGetter()
{
	Color c(0,0,0);
	
	if (mGetter) c = mGetter();
	
	int closest = 0;
	float bestdist = MAXFLOAT;
	
	for( int i=0; i<mColors.size(); ++i )
	{
		float d = distance( mColors[i], c );
		
		if ( d < bestdist )
		{
			closest  = i;
			bestdist = d;
		}
	}
	
	mSelectedColor = closest;
}

int	
ColorPaletteView::pickColor( glm::vec2 loc ) const
{
	if ( mColorsRect.contains(loc) )
	{
		loc -= mColorsRect.getUpperLeft();
		
		int x = loc.x / mColorSize.x;
		int y = loc.y / mColorSize.y;
		
		int i = x + y * mColorCols;
		
		if ( i >= mColors.size() ) i = -1;
		
		return i;
	}
	else return -1;
}

Rectf
ColorPaletteView::calcColorRect( int i ) const
{
	int x = i % mColorCols;
	int y = i / mColorCols;
	
	Rectf r( vec2(0,0), mColorSize );
	r += mColorSize * vec2(x,y);
	r += mColorsRect.getUpperLeft();
	
	return r;
}