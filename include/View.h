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

	void setFrame ( ci::Rectf f ) { mFrame  = f ; }
	void setBounds( ci::Rectf b ) { mBounds = b ; }
	
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
	virtual bool pick( glm::vec2 p ) { return mFrame.contains(p); }

	virtual void mouseDown( ci::app::MouseEvent ){}
	virtual void mouseUp  ( ci::app::MouseEvent ){}
	virtual void mouseMove( ci::app::MouseEvent ){}
	virtual void mouseDrag( ci::app::MouseEvent ){}
	virtual void resize(){}
	
	void setHasRollover( bool v ) { mHasRollover=v; }
	bool getHasRollover() const { return mHasRollover; }
	
	bool getHasMouseDown() const { return mHasMouseDown; }
	void setHasMouseDown( bool v ) { mHasMouseDown=v; }

protected:
	glm::ivec2 getScissorLowerLeft( ci::Rectf ) const;
	glm::ivec2 getScissorSize( ci::Rectf ) const;
	glm::ivec2 getScissorLowerLeft() const { return getScissorLowerLeft(getFrame()); }
	glm::ivec2 getScissorSize() const { return getScissorSize(getFrame()); }

private:
	bool	mHasRollover=false;
	bool	mHasMouseDown=false;
	
	std::string	mName;
	ci::Rectf	mFrame = ci::Rectf(0,0,1,1); // where it is in parent coordinate space
	ci::Rectf	mBounds= ci::Rectf(0,0,1,1); // what that coordinate space is mapped to (eg 0,0 .. 640,480)
		// initing to unit rect so that by default it does a valid no transform (no divide by zero)
	
	ViewRef mParent;
};


class ViewCollection
{
public:
	
	void	draw(); // draws all views in order they were added
	ViewRef	pickView( glm::vec2 ); // tests in reverse order added
	ViewRef getViewByName( std::string );
	
	void addView   ( ViewRef v ) { mViews.push_back(v); }
	bool removeView( ViewRef v ); // returns whether found
	
	void mouseDown( ci::app::MouseEvent );
	void mouseUp  ( ci::app::MouseEvent );
	void mouseMove( ci::app::MouseEvent );
	void mouseDrag( ci::app::MouseEvent );
	void resize();
	
	ViewRef getMouseDownView() const { return mMouseDownView; }
	ViewRef getRolloverView()  const { return mRolloverView; }
	
private:
	void updateRollover( glm::vec2 );
	
	ViewRef mMouseDownView;
	ViewRef mRolloverView;
	std::vector< ViewRef > mViews;
	
};

#endif /* View_hpp */
