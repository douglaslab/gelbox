//
//  GelViewSettingsView.h
//  Gelbox
//
//  Created by Chaim Gingold on 3/6/18.
//

#pragma once

#include "View.h"

class GelView;
typedef std::shared_ptr<GelView> GelViewRef;

class GelViewSettingsView;
typedef std::shared_ptr<GelViewSettingsView> GelViewSettingsViewRef;

class SliderView;
typedef std::shared_ptr<SliderView> SliderViewRef;

class BufferView;
typedef std::shared_ptr<BufferView> BufferViewRef;


class GelViewSettingsView : public View
{
public:
	void setup( GelViewRef );
	void close();
	
	void setBounds( ci::Rectf r ) override;
	
	void draw() override;
		
private:
	GelViewRef				mGelView;
	BufferViewRef			mBufferView;
	
	ci::Rectf				mBraceRect;
	ci::gl::TextureRef		mBraceTex;

	std::vector<SliderViewRef> mSliders;

	void makeSliders();
	void layout();

};
