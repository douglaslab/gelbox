#pragma once
#include "cinder/app/MouseEvent.h"
struct View:std::enable_shared_from_this<View>{
 ci::Rectf frame,bounds;std::vector<std::shared_ptr<View>> children;bool hover=false,down=false,inside=true;
 virtual ~View()=default;virtual void draw(){}virtual void mouseDown(ci::app::MouseEvent){}virtual void mouseUp(ci::app::MouseEvent){}virtual void resize(){}
 ci::Rectf getFrame()const{return frame;}ci::Rectf getBounds()const{return bounds;}
 void setFrame(ci::Rectf r){frame=r;}void setBounds(ci::Rectf r){bounds=r;}
 void setFrameAndBoundsWithSize(ci::Rectf r){setFrame(r);setBounds(ci::Rectf(ci::vec2(0),r.getSize()));}
 void setParent(std::shared_ptr<View> p){p->children.push_back(shared_from_this());}
 bool getHasRollover()const{return hover;}bool getHasMouseDown()const{return down;}
 ci::vec2 getMouseLoc()const{return ci::vec2(0);}ci::vec2 rootToParent(ci::vec2 p)const{return p;}
 bool pick(ci::vec2)const{return inside;}
};
using ViewRef=std::shared_ptr<View>;
