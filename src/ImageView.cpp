//
//  ImageView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 12/6/17.
//
//

#include "ImageView.h"

using namespace ci;
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

void ImageView::mouseDrag( ci::app::MouseEvent e )
{
	setFrame( mMouseDownFrame.getOffset( vec2(e.getPos()) - getMouseDownLoc() ) );
}