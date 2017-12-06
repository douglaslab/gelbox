//
//  GelParticleSourceView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 12/6/17.
//
//

#include "GelParticleSourceView.h"

using namespace std;
using namespace ci;

void GelParticleSourceView::setSource( GelParticleSourceRef source )
{
	auto oldSource = mSource;
	
	mSource = source;
	
	if (mSource)
	{
		vec2 size(32,32);

		Rectf bounds( vec2(0,0), size );
		setBounds(bounds);
		
		Rectf frame = bounds;
		if (oldSource) frame.offsetCenterTo( getFrame().getCenter() ); // center on old
		setFrame(frame);
	}	
}

void GelParticleSourceView::draw()
{
	gl::color(0,1,0);
	gl::drawSolidRect( getBounds() );
}

