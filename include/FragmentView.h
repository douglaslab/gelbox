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

private:
	
	static std::vector<ci::Color> sColorPalette;
	
	void updateLayout();
	
	SampleRef				mEditSample;
	int						mEditFragment = -1; // which fragment index are we editing? 
	bool					isEditFragmentValid() const;
	
	int						mDragSlider = -1;
	float					mDragSliderStartValue;
	
	typedef std::function< void ( Sample::Fragment&, float ) > tSetter;
	typedef std::function< float( Sample::Fragment& ) > tGetter;
	
	// sliders
	class Slider
	{
	public:
		
		std::string mIconName;
		
		ci::Rectf	mIconRect[2];
		ci::gl::TextureRef  mIcon[2];
		glm::vec2			mIconSize[2]; // in points
		
		glm::vec2	mEndpoint[2];
		
		int			mNotches=0;
		
		float		mValue=.5f; // 0..1
		float		mValueMappedLo=0.f, mValueMappedHi=1.f;
		
		tSetter		mSetter;
		tGetter		mGetter;
		
		float		getMappedValue() const { return ci::lerp( mValueMappedLo, mValueMappedHi, mValue ); }
		
		std::function<std::string(float v)> mMappedValueToStr;
	};
		
	std::vector<Slider>		mSliders;
	
	ci::Rectf				calcSliderHandleRect( const Slider& ) const;
	int						pickSliderHandle( glm::vec2 ) const; // local coords
	int						pickSliderBar( glm::vec2, float& valuePicked ) const;
	void					setSliderValue( Slider&, float value ); // constrains, updates
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
	
	// sample
	SampleViewRef mSampleView;
	
	
};