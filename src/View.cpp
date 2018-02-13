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

mat4 View::getRootToParentMatrix() const
{
	if (mParent) return mParent->getRootToChildMatrix();
	else return mat4(); // identity
}

mat4 View::getParentToRootMatrix() const
{
	if (mParent) return mParent->getChildToRootMatrix();
	else return mat4(); // identity
}

void View::setParent( ViewRef p )
{
	if ( p != mParent )
	{
		ViewCollection* oc = mParent ? mParent->getCollection() : 0;
		ViewCollection* nc = 0;
		
		if ( mParent )
		{
			auto i = find( mParent->mChildren.begin(), mParent->mChildren.end(), shared_from_this() );
			assert( i != mParent->mChildren.end() );
			mParent->mChildren.erase(i);
		}
		
		mParent = p;
		
		if (p) {
			p->mChildren.push_back(shared_from_this());
			nc = p->getCollection();
		}
		
		// change collection?
		if (oc != nc)
		{
			if (oc) oc->removeView(shared_from_this());
			if (nc) nc->addView(shared_from_this());
		}
	}
}

/*
ivec2 View::getScissorLowerLeft( Rectf r ) const
{
	return ivec2( toPixels(r.x1), toPixels(getWindowHeight()) - toPixels(r.y2));
}

ivec2 View::getScissorSize( Rectf r ) const
{
	return ivec2( toPixels(r.getWidth()), toPixels(r.getHeight()) );
}*/

glm::ivec2 View::getScissorLowerLeftForBounds() const
{
	vec2 lowerLeftInRoot = childToRoot( getBounds().getLowerLeft() );
	vec2 scissorLowerLeft;
	
	scissorLowerLeft.x = lowerLeftInRoot.x;
	scissorLowerLeft.y = getWindowHeight() - lowerLeftInRoot.y; // invert y
	
	return scissorLowerLeft;
}

glm::ivec2 View::getScissorSizeForBounds() const
{
	vec2 lowerLeftInRoot = childToRoot( getBounds().getLowerLeft() );

	ivec2 scissorLowerLeft, scissorSize; // (0,0) is lower left of window!
	
	{
		vec2 upperRightInRoot = childToRoot( getBounds().getUpperRight() );
		
		scissorSize.x = upperRightInRoot.x - lowerLeftInRoot.x;
		scissorSize.y = lowerLeftInRoot.y  - upperRightInRoot.y;
	}

	return scissorSize;
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

vec2 View::getMouseMoved() const
{
	if (mCollection) return mCollection->getMouseMoved();
	else return vec2(0,0);
}

vec2 View::snapToPixel ( vec2 p ) const
{
	return vec2( roundf(p.x), roundf(p.y) );
}

Rectf View::snapToPixel( Rectf r ) const
{
	// from upper left
	
	vec2 s = r.getSize();
	vec2 ul = snapToPixel(r.getUpperLeft());
	
	ul = snapToPixel(ul);
//	s = snapToPixel(s);
	
	return Rectf( ul, ul + s );
};

void ViewCollection::tick( float dt )
{
	list< weak_ptr<View> > old; 
	
	for( auto v : mViews ) old.push_back(v);
	
	for( auto v : old )
	{
		if ( auto spt = v.lock() )
		{
			spt->tick(dt);
		}
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
	// pick order is reverse of draw order
	for( auto i = mViews.rbegin(); i != mViews.rend(); ++i )
	{
		// a little sledgehammer like, but it works
		vec2 pInFrame = i->get()->rootToChild(p);
		pInFrame = i->get()->childToParent(pInFrame);
		
		if ( customPickFunc )
		{
			if ( customPickFunc(*i,pInFrame) ) return *i;
		}
		else if ( i->get()->pick(pInFrame) ) return *i;
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

void ViewCollection::addView( ViewRef v )
{
	mViews.push_back(v);
	
	v->mCollection=this;
	
	// children
	for ( auto c : v->getChildren() ) addView(c);
}

bool ViewCollection::removeView( ViewRef v )
{
	// here?
	auto i = find( mViews.begin(), mViews.end(), v );
	
	if ( i != mViews.end() )
	{
		// state
		if (v==mKeyboardFocusView) setKeyboardFocusView(0);
		if (v==mMouseDownView)     mMouseDownView=0;
		if (v==mRolloverView)      mRolloverView=0;			

		// erase
		mViews.erase(i);

		// remove from hierarchy
		v->setParent(0);	

		// children?
		auto children = v->getChildren(); // not recursive!
		
		for( auto c : children ) removeView(c); // but this should be.
		
		// done
		return true ;
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
	else
	{
		ViewRef oldRolloverView = mRolloverView;
		
		updateRollover(event.getPos());
		
		// send to old?
		if ( oldRolloverView && oldRolloverView != mRolloverView )
		{
			oldRolloverView->mouseMove(event);
		}
		
		// send to new?
		if ( mRolloverView )
		{
			mRolloverView->mouseMove(event);
		}
	}
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