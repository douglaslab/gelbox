//
//  View.hpp
//  PaperBounce3
//
//  Created by Chaim Gingold on 8/31/16.
//
//

#ifndef View_hpp
#define View_hpp

#include <vector>
#include <memory>
#include <string>

#include "cinder/Rect.h"
#include "cinder/gl/gl.h"

class View;
typedef std::shared_ptr<View> ViewRef;

class ViewCollection;

glm::mat4 getRectMappingAsMatrix( ci::Rectf from, ci::Rectf to );

class View
{
public:

	// name
	std::string getName() const { return mName; }
	void   setName( std::string s ) { mName=s; }
	
	// geometry
	ci::Rectf getFrame () const { return mFrame ; }
	ci::Rectf getBounds() const { return mBounds ; }

	virtual void setFrame ( ci::Rectf f ) { mFrame  = f ; }
	virtual void setBounds( ci::Rectf b ) { mBounds = b ; }
	
	void setFrameAndBoundsWithSize( ci::Rectf f )
		{ setFrame(f); setBounds( ci::Rectf(glm::vec2(0,0),f.getSize()) ); }
	
	glm::mat4 getParentToChildMatrix() const { return getRectMappingAsMatrix(mFrame,mBounds); }
	glm::mat4 getChildToParentMatrix() const { return getRectMappingAsMatrix(mBounds,mFrame); }
	
	glm::vec2 parentToChild( glm::vec2 p ) const { return glm::vec2( getParentToChildMatrix() * glm::vec4(p,0,1) ); }
	glm::vec2 childToParent( glm::vec2 p ) const { return glm::vec2( getChildToParentMatrix() * glm::vec4(p,0,1) ); }
	
	// hierarchy
	void setParent( ViewRef v ) { mParent=v; }
	
	glm::mat4 getRootToChildMatrix() const;
	glm::mat4 getChildToRootMatrix() const;

	glm::vec2 rootToChild( glm::vec2 p ) const { return glm::vec2( getRootToChildMatrix() * glm::vec4(p,0,1) ); }
	glm::vec2 childToRoot( glm::vec2 p ) const { return glm::vec2( getChildToRootMatrix() * glm::vec4(p,0,1) ); }

	glm::mat4 getRootToParentMatrix() const;
	glm::mat4 getParentToRootMatrix() const;
	
	glm::vec2 rootToParent( glm::vec2 p ) const { return glm::vec2( getRootToParentMatrix() * glm::vec4(p,0,1) ); }
	glm::vec2 parentToRoot( glm::vec2 p ) const { return glm::vec2( getParentToRootMatrix() * glm::vec4(p,0,1) ); }
	
	// drawing
	virtual void draw()
	{
		// framed white box
		// (frame should be in drawFrame, but this is easier to overload)
		ci::gl::color(1,1,1);
		ci::gl::drawSolidRect(mBounds);
		ci::gl::color(0,0,0,.5);
		ci::gl::drawStrokedRect(mBounds);
	}

	virtual void drawFrame()
	{
	}
	
	// interaction
	virtual void tick( float dt ) {}

	virtual bool pick( glm::vec2 p ) const { return mFrame.contains(p); }

	virtual void mouseDown( ci::app::MouseEvent ){}
	virtual void mouseUp  ( ci::app::MouseEvent ){}
	virtual void mouseMove( ci::app::MouseEvent ){}
	virtual void mouseDrag( ci::app::MouseEvent ){}
	virtual void keyDown  ( ci::app::KeyEvent ){}
	virtual void keyUp    ( ci::app::KeyEvent ){}

	virtual void resize(){}
	
	bool getHasRollover() const { return mHasRollover; }
	bool getHasMouseDown() const { return mHasMouseDown; }
	bool getHasKeyboardFocus() const { return mHasKeyboardFocus; }
	
	glm::vec2 getMouseLoc() const;
	glm::vec2 getMouseDownLoc() const;
	glm::vec2 getMouseMoved() const;
	
	// TODO: make work 100% properly in local space; AND respect retina
	ci::vec2  snapToPixel( ci::vec2  p ) const;
	ci::Rectf snapToPixel( ci::Rectf r ) const;

protected:
//	glm::ivec2 getScissorLowerLeft( ci::Rectf ) const;
//	glm::ivec2 getScissorSize( ci::Rectf ) const;
//	glm::ivec2 getScissorLowerLeft() const { return getScissorLowerLeft(getFrame()); }
//	glm::ivec2 getScissorSize() const { return getScissorSize(getFrame()); }

	glm::ivec2 getScissorLowerLeftForBounds() const;
	glm::ivec2 getScissorSizeForBounds() const;

	ViewCollection* getCollection() const { return mCollection; }
	
private:
	friend class ViewCollection;	

	void setHasRollover( bool v ) { mHasRollover=v; }
	void setHasMouseDown( bool v ) { mHasMouseDown=v; }
	void setHasKeyboardFocus( bool v ) { mHasKeyboardFocus=v; }
	// set rollover, mouse down, focus are meant to be called by view collection.

	bool	mHasRollover=false;
	bool	mHasMouseDown=false;
	bool	mHasKeyboardFocus=false;
	
	std::string	mName;
	ci::Rectf	mFrame = ci::Rectf(0,0,1,1); // where it is in parent coordinate space
	ci::Rectf	mBounds= ci::Rectf(0,0,1,1); // what that coordinate space is mapped to (eg 0,0 .. 640,480)
		// initing to unit rect so that by default it does a valid no transform (no divide by zero)
	
	ViewRef mParent;
	ViewCollection* mCollection=0;
};


class ViewCollection
{
public:
	
	void	tick( float dt );
	void	draw(); // draws all views in order they were added
	ViewRef	pickView( glm::vec2, std::function<bool(ViewRef,glm::vec2)> customPickFunc=0 ) const;
		// pick tests in reverse order added
		// if customPickFunc specified:
		// - will use customPickFunc instead of each view's View::pick() method
		// - pos is in view's frame space 
	ViewRef getViewByName( std::string );
	
	void addView   ( ViewRef v ) { mViews.push_back(v); v->mCollection=this; }
	bool removeView( ViewRef v ); // returns whether found
	
	void moveViewToTop( ViewRef v ) { if (removeView(v)) addView(v); }
	
	void mouseDown( ci::app::MouseEvent );
	void mouseUp  ( ci::app::MouseEvent );
	void mouseMove( ci::app::MouseEvent );
	void mouseDrag( ci::app::MouseEvent );
	void resize();
	
	ViewRef getMouseDownView() const { return mMouseDownView; }
	ViewRef getRolloverView()  const { return mRolloverView; }
	ViewRef getKeyboardFocusView() const { return mKeyboardFocusView; }
	void    setKeyboardFocusView( ViewRef );
	
	ci::vec2 getMouseLoc()     const { return mLastMouseLoc; }
	ci::vec2 getMouseDownLoc() const { return mMouseDownLoc; }
	ci::vec2 getMouseMoved()   const { return mMouseMoved; }
	
private:
	void updateMouseLoc( glm::vec2 );
	void updateRollover( glm::vec2 );
	
	glm::vec2 mMouseDownLoc;
	glm::vec2 mLastMouseLoc, mMouseMoved;
	
	ViewRef mMouseDownView;
	ViewRef mRolloverView;
	ViewRef mKeyboardFocusView;
	std::list< ViewRef > mViews;

};

#endif /* View_hpp */
