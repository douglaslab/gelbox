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

//class SampleView;
//typedef std::shared_ptr<SampleView> SampleViewRef;

class BufferView;
typedef std::shared_ptr<BufferView> BufferViewRef;

class SliderView;
typedef std::shared_ptr<SliderView> SliderViewRef;

const glm::vec2 kBufferViewSize(350,407);

class BufferView : public View
{
public:

	BufferView();
	
	void tick( float dt ) override;
	void draw() override;
	
	void mouseDown( ci::app::MouseEvent ) override;
	void mouseUp  ( ci::app::MouseEvent ) override;
	void mouseDrag( ci::app::MouseEvent ) override;
	
	void setModel( SampleRef /*, BufferRef*/ );
	
	ViewRef getParentView() const { return mParentView; }
	void setParentView( ViewRef s ) { mParentView=s; }
	
	void setBounds( ci::Rectf b ) override { View::setBounds(b); updateLayout(); }
	
private:
	
	void updateLayout();
	
//	void					syncSlidersToModel(); // just reads it in
//	void					bufferDidChange() const;
	
	std::vector<SliderViewRef> mSliders;
	
	SampleRef mSample;
//	BufferRef mBuffer;
	
	// buffer
	ViewRef mParentView;	
	
};