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
#include "DropTarget.h"

class SampleView;
typedef std::shared_ptr<SampleView> SampleViewRef;

class SampleView : public View, public std::enable_shared_from_this<SampleView>
{
public:

	SampleView( SampleRef source ) { setSource(source); }
	
	void setSource( SampleRef );
	SampleRef getSource() const { return mSource; }
	
	void draw() override;

	void mouseDown( ci::app::MouseEvent ) override;
	
private:
	SampleRef	mSource;

	ci::gl::TextureRef		mIcon;

};