//
//  TimelineView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 12/6/17.
//
//

#include "TimelineView.h"

using namespace ci;
using namespace std;

TimelineView::TimelineView( Rectf r )
{
	setFrame(r);
	setBounds( r.getOffset(-r.getLowerLeft()) ); // same size as r, but on origin
}

void TimelineView::draw()
{
	const Rectf bounds = getBounds();
	
	gl::color(1,1,1);
	gl::drawSolidRect( bounds );
	gl::color(0,0,0,.5);
	gl::drawStrokedRect( bounds );
	
	float duration = getDuration();
	
	if (duration>0.f)
	{
		if (getIsPlaying()) gl::color(0,0,1);
		else gl::color(.5,.5,.5);
		
		float tx = lerp( bounds.x1, bounds.x2, getTime() / duration );
		gl::drawLine( vec2(tx,bounds.y1), vec2(tx,bounds.y2) );
	}
}

void TimelineView::setTimeWithMouse( ci::app::MouseEvent e )
{
	vec2 loc = parentToChild(e.getPos());
	
	const Rectf bounds = getBounds();

	float t = loc.x / bounds.getWidth();
	
	t = constrain( t, 0.f, 1.f );
	
	t *= getDuration();
	
	setTime(t);
}
