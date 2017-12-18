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