//
//  SampleView.h
//  Gelbox
//
//  Created by Chaim Gingold on 12/6/17.
//
//

#pragma once

#include "View.h"
#include "Sample.h"
#include "GelView.h"

class SampleView;
typedef std::shared_ptr<SampleView> SampleViewRef;

class SampleView : public View
{
public:

	SampleView( SampleRef source ) { setSource(source); }
	
	void setSource( SampleRef );
	
	void draw() override;

	void mouseDrag( ci::app::MouseEvent ) override;
	void mouseUp( ci::app::MouseEvent ) override;
	
private:
	SampleRef	mSource;

	ci::gl::TextureRef		mIcon;

	GelViewRef				mGelDropTarget;
	int						mGelDropTargetLane;
};