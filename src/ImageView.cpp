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
		
		if (getHasKeyboardFocus())
		{
			float lw = 4.f;
			Rectf r = getBounds();
			
			r.inflate( vec2(lw/2.f) );
			
			gl::color(1,1,.5f);
			gl::drawStrokedRect(r,lw);
		}
	}
}


void ImageView::mouseDown( ci::app::MouseEvent ) 
{
	getCollection()->setKeyboardFocusView( shared_from_this() );
}

void ImageView::mouseDrag( ci::app::MouseEvent )
{
	setFrame( getFrame() + getCollection()->getMouseMoved() );
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