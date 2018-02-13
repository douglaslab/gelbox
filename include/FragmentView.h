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
#include "Slider.h"

class SampleView;
typedef std::shared_ptr<SampleView> SampleViewRef;

class FragmentView;
typedef std::shared_ptr<FragmentView> FragmentViewRef;

class SliderView;
typedef std::shared_ptr<SliderView> SliderViewRef;

const glm::vec2 kFragmentViewSize(350,407);

class FragmentView : public View
{
public:

	FragmentView();
	void close();
	
	void tick( float dt ) override;
	void draw() override;
	
	void mouseDown( ci::app::MouseEvent ) override;
	void mouseUp  ( ci::app::MouseEvent ) override;
	void mouseDrag( ci::app::MouseEvent ) override;
	
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
	
	void					syncSlidersToModel(); // just reads it in
	void					fragmentDidChange() const;

	void					syncModelToColor() const;
	void					syncColorToModel();
	
	// color picker
	std::vector<ci::Color>	mColors;
	int						mColorCols=6;
	int						mSelectedColor=-1;
	
	glm::vec2				mColorsTopLeft, mColorSize;
	ci::Rectf				mColorsRect;
	
	ci::Rectf				calcColorRect( int i ) const;
	int						pickColor( glm::vec2 ) const; // local coords
	void					drawColors() const;
	
	// sample
	SampleViewRef mSampleView;
	
	
};