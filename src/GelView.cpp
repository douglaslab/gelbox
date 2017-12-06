//
//  GelView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 12/5/17.
//
//

#include "GelView.h"

using namespace ci;
using namespace std;


void GelView::setGel( GelRef gel )
{
	auto oldGel = mGel;
	
	mGel = gel;
	
	if (mGel)
	{
		vec2 size = mGel->getSize();

		Rectf bounds( vec2(0,0), size );
		setBounds(bounds);
		
		Rectf frame = bounds;
		if (oldGel) frame.offsetCenterTo( getFrame().getCenter() ); // center on old
		setFrame(frame);
	}
}

void GelView::draw()
{
	if (!mGel) return;

	// gel background
//	gl::color(0,0,0,.5f);
//	gl::draw( mGel->getOutlineAsPolyLine() );
	gl::color(0,0,0,.5f);
	gl::drawSolidRect( Rectf( vec2(0,0), mGel->getSize() ) );
	
	// particles
	auto ps = mGel->getParticles();
	
	vec2 rectSize( mGel->getLaneWidth() * .25f, mGel->getLaneWidth()*.05f );
	
	for( auto &p : ps )
	{
		gl::color( p.mColor );
		
		Rectf r(p.mLoc,p.mLoc);
		r.inflate( rectSize );
		
		gl::drawSolidRect(r);
	}
}

void GelView::mouseUp( ci::app::MouseEvent e )
{
	if ( mGel && distance( vec2(e.getPos()), getCollection()->getMouseDownLoc() ) < 1.f )
	{
		mGel->setIsPaused( ! mGel->getIsPaused() );
	}
}

void GelView::tick( float dt )
{
	if (mGel && !mGel->getIsPaused()) mGel->stepTime(dt);
}
