//
//  FragmentView.h
//  Gelbox
//
//  Created by Chaim Gingold on 1/8/18.
//
//

#pragma once

#include "View.h"
#include "Sample.h"

class SampleView;
typedef std::shared_ptr<SampleView> SampleViewRef;

class FragmentView;
typedef std::shared_ptr<FragmentView> FragmentViewRef;

class SliderView;
typedef std::shared_ptr<SliderView> SliderViewRef;

class ColorPaletteView;
typedef std::shared_ptr<ColorPaletteView> ColorPaletteViewRef;

class FragmentView : public View
{
public:

	FragmentView();
	
	void close();	
	void draw() override;
	
	void setFragment( SampleRef, int );
	
	SampleViewRef getSampleView() const { return mSampleView; }
	void setSampleView( SampleViewRef s ) { mSampleView=s; }
	
	void setBounds( ci::Rectf b ) override { View::setBounds(b); updateLayout(); }
	
	static const std::vector<ci::Color>& getColorPalette();
	static ci::Color getRandomColorFromPalette( ci::Rand* r=0 );
	
	Sample::Fragment& getEditFragment();
	const Sample::Fragment& getEditFragment() const;
	
private:
	
	static std::vector<ci::Color> sColorPalette;
	
	void updateLayout();
	
	SampleRef				mEditSample;
	int						mEditFragment = -1; // which fragment index are we editing? 
	bool					isEditFragmentValid() const;
	
	void					makeSliders();
	std::vector<SliderViewRef> mSliders;
	
	void					syncWidgetsToModel(); // just reads it in
	void					fragmentDidChange() const;

	
	ci::Rectf				mBraceRect;
	ci::Rectf				mWellRect;
	
	ColorPaletteViewRef		mColorsView;

	ci::gl::TextureRef		mBraceTex;

	int						mHeadingScale=1;
	ci::gl::TextureRef		mHeadingTex;
	ci::Rectf				mHeadingRect;
	
	// sample
	SampleViewRef mSampleView;
	
};
