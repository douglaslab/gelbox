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


const glm::vec2 kFragmentViewSize(350,407);

class FragmentView : public View
{
public:

	FragmentView();
	
	void draw() override;
	
	void mouseDown( ci::app::MouseEvent ) override;
	void mouseUp  ( ci::app::MouseEvent ) override;
	void mouseDrag( ci::app::MouseEvent ) override;
	
	void setFragment( SampleRef, int );
	
	SampleViewRef getSampleView() const { return mSampleView; }
	void setSampleView( SampleViewRef s ) { mSampleView=s; }
	
	void setBounds( ci::Rectf b ) override { View::setBounds(b); updateLayout(); }
	
	static const std::vector<ci::Color>& getColorPalette();

	Sample::Fragment& getEditFragment();
	const Sample::Fragment& getEditFragment() const;
	
private:
	
	static std::vector<ci::Color> sColorPalette;
	
	void updateLayout();
	
	SampleRef				mEditSample;
	int						mEditFragment = -1; // which fragment index are we editing? 
	bool					isEditFragmentValid() const;
	
	int						mDragSlider = -1;
	float					mDragSliderStartValue;
	
	std::vector<Slider>		mSliders;
	
	int						pickSliderHandle( glm::vec2 ) const; // local coords
	int						pickSliderBar( glm::vec2 ) const;
	
	int						tryInstantSliderSet( glm::vec2 local ); // returns which slider, if any

	void					syncSlidersToModel(); // just reads it in
	void					syncModelToSlider( Slider& ) const; // just this slider

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