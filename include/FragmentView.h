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
	typedef std::function< float( const Sample::Fragment& ) > tGetter;

	typedef std::function< void ( Sample::Fragment&, std::vector<float> ) > tGraphSetter;
	typedef std::function< std::vector<float>( const Sample::Fragment& ) > tGraphGetter;
	
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
		
		enum class Notch
		{
			None,
			DrawOnly, // just draw them
			Nearest, // will always snap to a notch
			Snap    // will snap if close to a notch
		};
		Notch		mNotchAction = Notch::None;
		
		float		mValue=.5f; // 0..1
		float		mValueMappedLo=0.f, mValueMappedHi=1.f;

		bool		mIsGraph		=	false;
		float		mGraphHeight	=	32.f;
		float		mGraphValueMappedLo=0.f, mGraphValueMappedHi=1.f; // per notch graph		
		std::vector<float> mGraphValues;
		
		tSetter		mSetter;
		tGetter		mGetter;
		
		tGraphSetter	mGraphSetter;
		tGraphGetter	mGraphGetter;
		bool			mAreGraphValuesReversed = false;
		
		float		getMappedValue() const { return ci::lerp( mValueMappedLo, mValueMappedHi, mValue ); }
		void		flipXAxis();
		
		std::function<std::string(float v)> mMappedValueToStr;
	};
		
	std::vector<Slider>		mSliders;
	
	ci::Rectf				calcSliderHandleRect( const Slider& ) const;
	ci::Rectf				calcSliderPickRect( const Slider& ) const;
	int						pickSliderHandle( glm::vec2 ) const; // local coords
	int						pickSliderBar( glm::vec2, float* valuePicked=0 ) const;
	void					setSliderValue( Slider&, float value ); // constrains, updates
	int						tryInstantSliderSet( glm::vec2 local ); // returns which slider, if any

	int						tryInstantSliderGraphValueSet( int, glm::vec2 local ); // constrains, updates; pass -1 slider to try to pick one

	void					syncSlidersToModel(); // just reads it in
	void					syncModelToSlider( Slider& ) const; // just this slider

	void					syncModelToColor() const;
	void					syncColorToModel();
	
	void					drawSlider( const Slider& ) const;
	
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