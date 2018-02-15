//
//  BufferView.h
//  Gelbox
//
//  Created by Chaim Gingold on 2/12/18.
//
//

#pragma once

#include "View.h"
#include "Buffer.h"

class Sample;
typedef std::shared_ptr<Sample> SampleRef;

class Gel;
typedef std::shared_ptr<Gel> GelRef;

class BufferView;
typedef std::shared_ptr<BufferView> BufferViewRef;

class SliderView;
typedef std::shared_ptr<SliderView> SliderViewRef;

const glm::vec2 kBufferViewSize(300,400);

class BufferView : public View
{
public:

	BufferView();
	
	static BufferViewRef openToTheRightOfView( ViewRef );
	void close();
		
	void draw() override;
	
	// what data are we operating upon?
	// 1) a sample?
	void setSample( SampleRef );
	SampleRef getSample() { return mSample; }
	
	// 2) a gel?
	void   setGel( GelRef );
	GelRef getGel() { return mGel; }

	
	void setBounds( ci::Rectf b ) override { View::setBounds(b); updateLayout(); }

protected:

	// buffer
	typedef std::function<const Gelbox::Buffer(void)>	tGetBufferFunc;
	typedef std::function<void(const Gelbox::Buffer)>	tSetBufferFunc;

	void setBufferDataFuncs( tGetBufferFunc getf, tSetBufferFunc setf );

	Gelbox::Buffer getBuffer() const;
	void		   setBuffer( Gelbox::Buffer );	

private:
	
	void makeSliders();
	void updateLayout();
	void syncWidgetsToModel();
	
	std::vector<SliderViewRef>	mSliders;
	std::vector<SliderViewRef>	mDyeViews;
	
	tGetBufferFunc		mGetBufferFunc;
	tSetBufferFunc		mSetBufferFunc;
	
	SampleRef			mSample;
	GelRef				mGel;
	
};