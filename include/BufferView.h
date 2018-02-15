//
//  BufferView.h
//  Gelbox
//
//  Created by Chaim Gingold on 2/12/18.
//
//

#pragma once

#include "View.h"
#include "Sample.h"
#include "Slider.h"
#include "Buffer.h"

//class SampleView;
//typedef std::shared_ptr<SampleView> SampleViewRef;

class BufferView;
typedef std::shared_ptr<BufferView> BufferViewRef;

class SliderView;
typedef std::shared_ptr<SliderView> SliderViewRef;

const glm::vec2 kBufferViewSize(300,400);

class BufferView : public View
{
public:

	BufferView();
	
	static BufferViewRef openToTheRightOfView( ViewRef, Gelbox::BufferRef );
	void close();
		
	void draw() override;
	
	void setBuffer( Gelbox::BufferRef );
	Gelbox::BufferRef getBuffer() const { return mBuffer; }
	
	void setBounds( ci::Rectf b ) override { View::setBounds(b); updateLayout(); }

	void bufferDidChange() const;
	
private:
	
	void makeSliders();
	void updateLayout();
	void syncWidgetsToModel();
	
	std::vector<SliderViewRef> mSliders;
	
	Gelbox::BufferRef mBuffer;
	
	void bufferDidChange();
	
};