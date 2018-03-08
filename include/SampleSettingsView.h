//
//  SampleSettingsView.h
//  Gelbox
//
//  Created by Chaim Gingold on 3/8/18.
//

#pragma once

#include "View.h"

class SampleView;
typedef std::shared_ptr<SampleView> SampleViewRef;

class SampleSettingsView;
typedef std::shared_ptr<SampleSettingsView> SampleSettingsViewRef;

class SliderView;
typedef std::shared_ptr<SliderView> SliderViewRef;

class BufferView;
typedef std::shared_ptr<BufferView> BufferViewRef;

class SampleView;
typedef std::shared_ptr<SampleView> SampleViewRef;


class SampleSettingsView : public View
{
public:
	void setup( SampleViewRef );
	void close();
	
	void setBounds( ci::Rectf r ) override;
	
	void draw() override;
		
private:
	SampleViewRef			mSampleView;
	BufferViewRef			mBufferView;
	
	ci::Rectf				mBraceRect;
	ci::gl::TextureRef		mBraceTex;

	std::vector<SliderViewRef> mSliders;

	void modelDidChange(); // updates Gel and GelView
	void makeSliders();
	void layout();

};
