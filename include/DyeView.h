//
//  DyeView.h
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

class GelView;
typedef std::shared_ptr<GelView> GelViewRef;

class DyeView;
typedef std::shared_ptr<DyeView> DyeViewRef;

class SliderView;
typedef std::shared_ptr<SliderView> SliderViewRef;

const glm::vec2 kDyeViewSize(300,400);

class DyeView : public View
{
public:

	DyeView();
	
	static DyeViewRef openToTheRightOfView( ViewRef );
	void close();
		
	void draw() override;

	void setBounds( ci::Rectf b ) override { View::setBounds(b); updateLayout(); }

	
	// what data are we operating upon?
	// 1) a sample?
	void setSample( SampleRef );
	SampleRef getSample() { return mSample; }
	
	// 2) a gel?
	void   setGel( GelRef );
	GelRef getGel() { return mGel; }

	
	// notify GelView of changes
	// (would be nice to just have a generic event listening system on mSample!)
	void setGelView( GelViewRef g ) { mGelView=g; }
	
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
	void modelDidChange();
	
	std::vector<SliderViewRef>	mSliders;
	std::vector<SliderViewRef>	mDyeViews;	
	GelViewRef					mGelView;
	
	tGetBufferFunc		mGetBufferFunc;
	tSetBufferFunc		mSetBufferFunc;
	
	SampleRef			mSample;
	GelRef				mGel;
	
};
