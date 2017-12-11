//
//  GelParticleSourceView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 12/6/17.
//
//

#include "GelParticleSourceView.h"
#include "GelboxApp.h" // ui text

using namespace std;
using namespace ci;
using namespace ci::app;

void GelParticleSourceView::setSource( GelParticleSourceRef source )
{
	// layout params
	vec2 center(0,0);
	vec2 size(32,32);

	// keep old center?
	if (mSource) center = getFrame().getCenter();
	
	// set source
	mSource = source;
	
	// load image
	try
	{
		mIcon = gl::Texture::create( loadImage( getAssetPath(mSource->mIconFileName) ) );
		
		size = vec2( mIcon->getSize() );
		
		size *= mSource->mIconScale;
	}
	catch (...)
	{
		mIcon = 0;
	}

	// layout
	Rectf bounds( vec2(0,0), size );
	setBounds(bounds);
	
	Rectf frame = bounds;
	frame.offsetCenterTo( center );
	setFrame(frame);
}

void GelParticleSourceView::draw()
{
	if (mIcon)
	{
		gl::color(1,1,1);
		gl::draw( mIcon, getBounds() );
	}
	else
	{
		gl::color(.5,.5,.5);
		gl::drawSolidRect( getBounds() );
	}
	
	gl::color(0,0,0);
	auto font = GelboxApp::instance()->getUIFont(); 
	vec2 strSize = font->measureString(mSource->mName); 
	font->drawString(
		mSource->mName,
		getBounds().getCenter()
		+ vec2( -strSize.x/2.f, getBounds().getHeight()/2.f + font->getDescent() + font->getAscent() )
		);
}