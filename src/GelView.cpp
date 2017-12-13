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
	gl::color(.5,.5,.5);
	gl::drawSolidRect( Rectf( vec2(0,0), mGel->getSize() ) );
	
	// aggregate bands into one batch
	auto bands = mGel->getBands();

	gl::VertBatch vb( GL_TRIANGLES );

	auto fillRect = [&vb]( ColorA c, Rectf r )
	{
		vb.color(c);

		vb.vertex(r.getUpperLeft ());
		vb.vertex(r.getUpperRight());
		vb.vertex(r.getLowerRight());

		vb.vertex(r.getLowerRight());
		vb.vertex(r.getLowerLeft ());
		vb.vertex(r.getUpperLeft ());		
	};
	
	for( auto &b : bands )
	{
		if (b.mExists)
		{
			Rectf r(b.mLoc,b.mLoc);
			r.inflate( b.mSize );		
			fillRect( b.mColor, r );
		}
	}


	// draw batch
	glEnable( GL_POLYGON_SMOOTH );

	vb.draw();
	
	glDisable( GL_POLYGON_SMOOTH );
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
	if (mGel && !mGel->getIsPaused())
	{
		mGel->stepTime(dt);
		
		if (mGel->isFinishedPlaying()) mGel->setIsPaused(true);
	}
}

int GelView::pickLane ( vec2 loc ) const
{
	// move to bounds space
	loc = parentToChild(loc);
	
	int lane = loc.x / (float)mGel->getLaneWidth();
	
	lane = constrain( lane, 0, mGel->getNumLanes()-1 );
	
	return lane;
}

ci::Rectf GelView::getLaneRect( int lane ) const
{
	Rectf r(0,0,mGel->getLaneWidth(),mGel->getSize().y);
	
	r.offset( vec2( (float)lane * mGel->getLaneWidth(), 0 ) );
	
	return r;
}