//
//  DropTarget.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 12/18/17.
//
//

#include "DropTarget.h"

using namespace std;
using namespace ci;

static const ColorA kDropColor(1,0,1,.5f);

void DropTargetGelView::draw()
{
	if ( mGelView && mGelView->getGel() )
	{
		gl::color(kDropColor);
		gl::ScopedModelMatrix modelMatrix;
		gl::multModelMatrix( mGelView->getChildToRootMatrix() );
		gl::drawStrokedRect( mGelView->getLaneRect(mGelViewLane) );
	}
}

void DropTargetGelView::receive( const Sample& s )
{
	if ( mGelView && mGelView->getGel() )
	{
		mGelView->getGel()->insertSample( s, mGelViewLane );
	}
}

void DropTargetOpView::draw()
{
	if ( mOperationView )
	{
		gl::color(kDropColor);
		gl::ScopedModelMatrix modelMatrix;
//		gl::multModelMatrix( mOperationView->getChildToRootMatrix() );		
//		gl::drawStrokedRect( mOperationView->getBounds() );
		gl::drawSolidRect( mOperationView->getFrame() );
	}
}

void DropTargetOpView::receive( const Sample& in )
{
	if ( mOperationView ) mOperationView->receive(in);
}