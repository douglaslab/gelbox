//
//  View.cpp
//  PaperBounce3
//
//  Created by Chaim Gingold on 8/31/16.
//
//

#include "View.h"
#include "cinder/app/App.h"

using namespace ci;
using namespace ci::app;
using namespace std;

mat4 getRectMappingAsMatrix( Rectf from, Rectf to )
{
	mat4 m;

	m *= glm::translate( vec3(  to.getUpperLeft(), 0.f ) );

	m *= glm::scale( vec3(to.getWidth() / from.getWidth(), to.getHeight() / from.getHeight(), 1.f ) );

	m *= glm::translate( vec3( -from.getUpperLeft(), 0.f ) );

	return m;	
}


mat4 View::getRootToChildMatrix() const
{
	if (mParent) return mParent->getRootToChildMatrix() * getParentToChildMatrix();
	else return getParentToChildMatrix();
}

mat4 View::getChildToRootMatrix() const
{
	if (mParent) return getChildToParentMatrix() * mParent->getChildToRootMatrix();
	else return getChildToParentMatrix();
}

ivec2 View::getScissorLowerLeft( Rectf r ) const
{
	return ivec2( toPixels(r.x1), toPixels(getWindowHeight()) - toPixels(r.y2));
}

ivec2 View::getScissorSize( Rectf r ) const
{
	return ivec2( toPixels(r.getWidth()), toPixels(r.getHeight()) );
}

vec2 View::getMouseLoc() const
{
	if (mCollection) return mCollection->getMouseLoc();
	else return vec2(0,0);
}

vec2 View::getMouseDownLoc() const
{
	if (mCollection) return mCollection->getMouseDownLoc();
	else return vec2(0,0);
}

void ViewCollection::tick( float dt )
{
	for( auto &v : mViews )
	{
		v->tick(dt);
	}
}

void ViewCollection::draw()
{
	for( const auto &v : mViews )
	{
		gl::pushViewMatrix();
		gl::multViewMatrix( v->getChildToRootMatrix() );
		
		v->draw();
		
		gl::popViewMatrix();
		
		v->drawFrame();
	}
}

ViewRef	ViewCollection::pickView( vec2 p, std::function<bool(ViewRef,glm::vec2)> customPickFunc ) const
{
	for( int i=(int)mViews.size()-1; i>=0; --i )
	{
		// a little sledgehammer like, but it works
		vec2 pInFrame = mViews[i]->rootToChild(p);
		pInFrame = mViews[i]->childToParent(pInFrame);
		
		if ( customPickFunc )
		{
			if ( customPickFunc(mViews[i],pInFrame) ) return mViews[i];
		}
		else if ( mViews[i]->pick(pInFrame) ) return mViews[i];
	}
	
	return nullptr;
}

ViewRef ViewCollection::getViewByName( string name )
{
	for( const auto &v : mViews )
	{
		if ( v->getName()==name ) return v;
	}
	
	return nullptr;
}

bool ViewCollection::removeView( ViewRef v )
{
	for ( auto i = mViews.begin(); i != mViews.end(); ++i )
	{
		if ( *i==v )
		{
			mViews.erase(i);
			return true ;
		}
	}
	
	return false;
}

void ViewCollection::mouseDown( MouseEvent event )
{
	mMouseDownLoc = event.getPos();
	
	// mouse down event
	mMouseDownView = pickView( event.getPos() );
	
	if (mMouseDownView) {
		mMouseDownView->setHasMouseDown(true);
		mMouseDownView->mouseDown(event);
	}
	
	// nuke rollover
	if (mRolloverView) mRolloverView->setHasRollover(false);
	mRolloverView=0;
}

void ViewCollection::mouseUp( MouseEvent event )
{
	// mouseUp
	if (mMouseDownView) {
		mMouseDownView->mouseUp(event);
		mMouseDownView->setHasMouseDown(false);
		mMouseDownView=0;
	}

	// rollover
	updateRollover(event.getPos());	
}

void ViewCollection::mouseMove( MouseEvent event )
{
	updateMouseLoc( event.getPos() );
	
	if (mMouseDownView)
	{
		mMouseDownView->mouseMove(event);
	}
	else updateRollover(event.getPos());
}

void ViewCollection::updateMouseLoc( vec2 pos )
{
	mMouseMoved = pos - mLastMouseLoc;
	mLastMouseLoc = pos;
}

void ViewCollection::updateRollover( vec2 pos )
{
	if (mRolloverView) mRolloverView->setHasRollover(false);
	
	mRolloverView = pickView(pos);
	
	if (mRolloverView) mRolloverView->setHasRollover(true);
}

void ViewCollection::mouseDrag( MouseEvent event )
{
	updateMouseLoc( event.getPos() );

	if (mMouseDownView) mMouseDownView->mouseDrag(event);
}

void ViewCollection::resize()
{
	for( auto &v : mViews ) {
		v->resize();
	}
}

void ViewCollection::setKeyboardFocusView( ViewRef v )
{
	if (v!=mKeyboardFocusView)
	{
		if (mKeyboardFocusView) mKeyboardFocusView->setHasKeyboardFocus(false);
		
		mKeyboardFocusView=v;
		
		if (mKeyboardFocusView) mKeyboardFocusView->setHasKeyboardFocus(true);
	}
}