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

class GelView;
typedef std::shared_ptr<GelView> GelViewRef;

class BufferView;
typedef std::shared_ptr<BufferView> BufferViewRef;

class SliderView;
typedef std::shared_ptr<SliderView> SliderViewRef;


class BufferView : public View
{
public:

	void setup();
	
	void tick( float dt ) override;
	void draw() override;
	void mouseDown( ci::app::MouseEvent ) override;
	
	void setBounds( ci::Rectf b ) override { View::setBounds(b); updateLayout(); }

	void setToPreset( int preset );
	
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
	void syncPresetToModel();
	void modelDidChange();
	int  pickPreset( ci::vec2 ); // in local space
	
	std::vector<SliderViewRef>	mSliders;
	GelViewRef					mGelView;
	
	tGetBufferFunc		mGetBufferFunc;
	tSetBufferFunc		mSetBufferFunc;
	
	SampleRef			mSample;
	GelRef				mGel;

	int					mTextContentScale=1;
	
	ci::gl::TextureRef	mHeadingTex;
	ci::Rectf			mHeadingRect;
	
	int								mPresetSelection=-1;
	ci::Rectf						mPresetsRect;
	std::vector<ci::gl::TextureRef> mPresetLabel;
	std::vector<ci::Rectf>			mPresetLabelRect;
};
