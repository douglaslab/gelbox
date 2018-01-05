//
//  SampleTubeView.h
//  Gelbox
//
//  Created by Chaim Gingold on 12/6/17.
//
//

#pragma once

#include "View.h"
#include "Sample.h"
#include "GelView.h"
#include "DropTarget.h"

class SampleTubeView;
typedef std::shared_ptr<SampleTubeView> SampleTubeViewRef;

class SampleTubeView : public View, public std::enable_shared_from_this<SampleTubeView>
{
public:

	SampleTubeView( SampleRef source ) { setSource(source); }
	
	void setSource( SampleRef );
	SampleRef getSource() const { return mSource; }
	
	void draw() override;

	void mouseDown( ci::app::MouseEvent ) override;
	
private:
	SampleRef	mSource;

	ci::gl::TextureRef		mIcon;

};