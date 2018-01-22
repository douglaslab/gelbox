//
//  ImageView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 12/6/17.
//
//

#include "ImageView.h"

using namespace ci;
using namespace ci::app;
using namespace std;

ImageView::ImageView( ci::gl::TextureRef i )
: mImage(i)
{
	if (mImage)
	{
		vec2  size	( mImage->getWidth(), mImage->getHeight() );
		Rectf bounds( vec2(0,0), size );
		
		setBounds( bounds );
		
		setFrame ( bounds ); // just do same; let user move it
	}
}

void ImageView::draw()
{
	if (mImage)
	{
		gl::color(1,1,1);
		gl::draw( mImage, getBounds() );		
	}
}

void ImageView::drawFrame()
{
	if (1)
	{
		Rectf resize = calcResizeBox();
		gl::color( Color::gray(.75f) );
		gl::drawSolidRect(resize);
		gl::color( Color::gray(.35f) );
		gl::drawStrokedRect(resize);
	}

	if (getHasKeyboardFocus())
	{
		float lw = 4.f;
		Rectf r = getFrame();
		
		r.inflate( vec2(lw/2.f) );
		
		gl::color(1,1,.5f);
		gl::drawStrokedRect(r,lw);
	}
}


void ImageView::mouseDown( ci::app::MouseEvent e ) 
{
	mMouseDownFrame = getFrame();
	
	getCollection()->setKeyboardFocusView( shared_from_this() );
	
	// 
	if ( calcResizeBox().contains( rootToParent(e.getPos()) ) )
	{
		mAction = Resize;
	}
	else mAction = Drag;
}

void ImageView::mouseDrag( ci::app::MouseEvent e )
{
	if ( mAction==Drag )
	{
		setFrame( getFrame() + getCollection()->getMouseMoved() );
	}
	else if ( mAction==Resize )
	{
		const vec2 from = rootToParent( getMouseDownLoc() );
		const vec2 to   = rootToParent( e.getPos() );
		const vec2 d    = to - from;
		
		vec2 newsize = mMouseDownFrame.getSize() + d;
		
		// min size
		if (1) newsize = max( newsize, calcResizeBox().getSize() * 2.f );
		
		// aspect ratio
		if (1)
		{
			Rectf r( mMouseDownFrame.getUpperLeft(), mMouseDownFrame.getUpperLeft() + newsize );
			
			r = mMouseDownFrame.getCenteredFit( r, true );
			
			newsize = r.getSize();
		}

		// snap to native size
		if (1)
		{
			const float kSnapToNativeSizeThresh = 4.f;
			
			if ( mImage && distance(newsize, vec2(mImage->getSize())) < kSnapToNativeSizeThresh )
			{
				newsize = mImage->getSize();
			}
		}
		
		// done
		Rectf f( mMouseDownFrame.getUpperLeft(), mMouseDownFrame.getUpperLeft() + newsize );
		
		setFrame(f);
	}
}

void ImageView::mouseUp( ci::app::MouseEvent )
{
	if ( !ci::Rectf(ci::app::getWindowBounds()).intersects( getFrame() ) )
	{
		getCollection()->removeView( shared_from_this() );
		std::cout << "implicitly removing and deleting ImageView" << std::endl;
	}
}

void ImageView::keyDown( ci::app::KeyEvent e )
{
	if ( e.getCode() == KeyEvent::KEY_BACKSPACE || e.getCode() == KeyEvent::KEY_DELETE )
	{
		getCollection()->removeView(shared_from_this());
	}
}

ci::Rectf ImageView::calcResizeBox() const
{
	Rectf r = getFrame();
	
	float w = 16.f;
	
	r.x1 = r.x2 - w;
	r.y1 = r.y2 - w;
	
	return r;
}