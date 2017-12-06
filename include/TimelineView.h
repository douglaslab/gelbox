//
//  TimelineView.h
//  Gelbox
//
//  Created by Chaim Gingold on 12/6/17.
//
//

#pragma once

#include "View.h"
#include <functional>

class TimelineView : public View
{
public:

	TimelineView();
	TimelineView( ci::Rectf );
	
	void draw() override;
	void mouseDown( ci::app::MouseEvent e ) override { setTimeWithMouse(e); }
	void mouseUp  ( ci::app::MouseEvent e ) override { setTimeWithMouse(e); }
	void mouseDrag( ci::app::MouseEvent e ) override { setTimeWithMouse(e); }
	
	// accessors for getting/setting time
	float getTime() const { if (mGetTime) return mGetTime(); else return 0.f; }
	void  setTime( float t ) const { if (mSetTime) mSetTime(t); }
	float getDuration() const { if (mGetDuration) return mGetDuration(); else return 0.f; }
	
	bool  getIsPlaying() const   { if (mGetIsPlaying) return mGetIsPlaying(); else return false; }
	void  setIsPlaying( bool v ) { if (mSetIsPlaying) mSetIsPlaying(v); } 
	
	std::function<float(void)>  mGetTime;
	std::function<void (float)> mSetTime;
	std::function<float(void)>  mGetDuration;

	std::function<bool (void)>  mGetIsPlaying;
	std::function<void (bool)>  mSetIsPlaying;

	// later: playback speed
	
private:
	
	void setTimeWithMouse( ci::app::MouseEvent );
	
};