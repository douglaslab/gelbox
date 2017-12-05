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


void GelView::draw()
{
	if (!mGel) return;

	// axis debug helpers
	if (0)
	{
		gl::color(1,0,0);
		gl::drawSolidCircle(vec2(0,0), 10.f);

		gl::color(0,1,0);
		gl::drawSolidCircle(vec2(100,0), 10.f);

		gl::color(0,0,1);
		gl::drawSolidCircle(vec2(0,100), 10.f);
	}
	
	// gel background
//	gl::color(0,0,0,.5f);
//	gl::draw( mGel->getOutlineAsPolyLine() );
	gl::color(0,0,0,.5f);
	gl::drawSolid( mGel->getOutlineAsPolyLine() );
	
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
