//
//  OperationView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 12/18/17.
//
//

#include "OperationView.h"
#include "GelboxApp.h"
#include "cinder/gl/TextureFont.h"
#include "DropTarget.h"
#include "SampleView.h"

using namespace std;
using namespace ci;

OperationView::OperationView()
{
}

OperationView::OperationView( std::string n, tOpFunc f )
: mName(n)
, mFunc(f)
{
}

void OperationView::draw()
{
	gl::color(1,1,1);
	gl::drawSolidRect( getBounds() );

	gl::color(.5,.5,.5);
	gl::drawStrokedRect( getBounds() );
	
	auto font = GelboxApp::instance()->getUIFont();
	vec2 nameSize = font->measureString(mName);
	font->drawString(mName, getBounds().getCenter() + vec2(-nameSize.x/2,0) );
}

DropTargetRef OperationView::getDropTarget( glm::vec2 locInFrame )
{
	if ( pick(locInFrame ) )
	{
		return make_shared<DropTargetOpView>( shared_from_this() );
	}
	
	return 0;
}

void OperationView::receive( const Sample& in )
{	
	if (mFunc)
	{
		// new sample
		SampleRef out = make_shared<Sample>( mFunc(in) );
		
		// new sample view
		SampleViewRef view = make_shared<SampleView>( out );
		
		Rectf r = getFrame() + vec2(96,0);
		
		view->setFrameAndBoundsWithSize(r);
		
		getCollection()->addView(view);
	}
}
