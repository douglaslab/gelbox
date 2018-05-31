//
//  GelSettingsView.h
//  Gelbox
//
//  Created by Chaim Gingold on 3/6/18.
//

#pragma once

#include "View.h"
#include "Slider.h"

class GelView;
typedef std::shared_ptr<GelView> GelViewRef;

class GelSettingsView;
typedef std::shared_ptr<GelSettingsView> GelSettingsViewRef;

class SliderView;
typedef std::shared_ptr<SliderView> SliderViewRef;

class BufferView;
typedef std::shared_ptr<BufferView> BufferViewRef;


class GelSettingsView : public View
{
public:
	void setup( GelViewRef );
	void close();
	
	void setBounds( ci::Rectf r ) override;
	
	void draw() override;
	
	static Slider getTimelineSlider( GelViewRef );
	
private:
	GelViewRef				mGelView;
	BufferViewRef			mBufferView;
	
	ci::Rectf				mBraceRect;
	ci::gl::TextureRef		mBraceTex;

	ci::gl::TextureRef		mHeadingTex;
	ci::Rectf				mHeadingRect;

	std::vector<SliderViewRef> mSliders;

	void makeSliders();
	void layout();

};
