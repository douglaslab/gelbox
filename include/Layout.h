//
//  Layout.h
//  Gelbox
//
//  Created by Chaim Gingold on 3/5/18.
//
//	Consolidating all layout tuning data into one file.

#pragma once

#include <map>

class Layout
{
public:
	
	// main view layout
	ci::vec2	mWindowSize			= ci::vec2(1365,768);

	ci::vec2	mGelSize			= ci::vec2(390,520);
	ci::vec2	mGelTopLeft			= ci::vec2(208,124);
	int			mGelDefaultLanes	= 7;
	float		mGelWellGutter		= 20.f;
	float		mGelMicrotubeBkgndCornerRadius	= 20.f;
	float		mGelMicrotubeBkgndTopInsetFromIcon = 16.f;		
	ci::Color	mGelMicrotubeBkgndColor			= ci::Color::hex(0xE8F2F3);
	ci::Color	mGelMicrotubeBkgndColorSelected = ci::Color::hex(0xA1D6FF);
	float		mGelMicrotubeIconToGelGutter	= 6.f;
	float		mGelMicrotubeWellPadding		= 4.f;
	float		mGelMicrotubeIconPadding		= 10.f;
	
	ci::vec2	mLoupeSize			= ci::vec2(171,171);
	ci::vec2	mSampleSize			= ci::vec2(362,520);
	
	float		mGelToSampleGutter	= 30.f;
	float		mGelToBraceGutter	= 30.f;
	float		mSampleToBraceGutter= 31.f;
	
	ci::Color	mRuleColor			= ci::Color::hex(0xC4C4C4);
	
	float		mHeadingGutter					= 25.f;
	
	// gel settings view
	ci::vec2	mGelSettingsSize				= ci::vec2(303,520);
	ci::vec2	mGelSettingsSlidersTopLeft		= ci::vec2(84,246);
	ci::vec2	mGelSettingsRuleTopLeft			= ci::vec2(66,216.5);
	float		mGelSettingsRuleLength			= 237;
	ci::vec2	mGelSettingsHeaderBaselinePos	= ci::vec2( 76.f, -mHeadingGutter );	
	std::string	mGelSettingsHeaderStr			= "Gel";	
	ci::vec2	mGelViewBufferViewTopLeft		= ci::vec2(61,15);
	
	// sample settings view
	ci::vec2	mSampleSettingsContentOffset	= ci::vec2(8,0);
		/* as designed should be 0, BUT we haven't gotten the text
		   line spacing as tight as we wanted, so we are spacing out here to compensate
		   so there is room for the loooong dye name lines */
	
	ci::vec2	mSampleSettingsSize				= ci::vec2(303,520);
	ci::vec2	mSampleSettingsSlidersTopLeft	= ci::vec2(131,336)  + mSampleSettingsContentOffset;
	ci::vec2	mSampleSettingsRuleTopLeft		= ci::vec2(59,269.5) + mSampleSettingsContentOffset;
	float		mSampleSettingsRuleLength		= 237;
	ci::vec2	mSampleBufferViewTopLeft		= ci::vec2(65,65)	 + mSampleSettingsContentOffset;
	float		mSampleSettingsSlidersToDyeLabel= 16.f;
	float		mSampleSettingsSliderVOffset	= 31.f;
	ci::vec2	mSampleSettingsHeaderBaselinePos= ci::vec2( 84.f, -mHeadingGutter ) + mSampleSettingsContentOffset;
	std::string mSampleSettingsHeaderStr		= "Buffer + Dyes";
	
	// sample view
	ci::Color	mSampleViewBkgndColor			= ci::Color::hex( 0xF1F1F2 );
	float		mSampleViewMicrotubeBkgndGutter	= 11.f;
	float		mSampleViewMicrotubeBkgndRadius	= 20.f;
	float		mSampleViewMicrotubeWidth		= 19.f;
	float		mSampleViewMicrotubeGutter		= mHeadingGutter;
	ci::vec2	mSampleViewHeaderBaselinePos	= ci::vec2( 51.f, -mHeadingGutter );
	std::string mSampleViewHeaderStr			= "Sample";
	ci::Color	mSampleViewFragSelectColor		= ci::Color(0,0,0);
	ci::Color	mSampleViewFragHoverColor		= ci::Color(1,1,0);
	float		mSampleViewFragOutlineWidth		= 4.f;

	// buffer view
	ci::vec2	mBufferViewSize			 		= ci::vec2(303,180);
	
	ci::vec2	mBufferViewSlidersTopLeft		= ci::vec2(66,41); // of bar itself
	float		mBufferViewSliderVOffset		= 31.f;
	ci::vec2	mBufferViewSliderBarSize		= ci::vec2(132,23);
	float		mBufferViewSlidersIconGutter	= 13.f;
	ci::Color	mBufferViewSliderEmptyColor		= ci::Color::hex(0xE8EBF1);
	ci::Color	mBufferViewSliderFillColor		= ci::Color::hex(0xAEB6C3);
	ci::Color	mBufferViewSliderTextLabelColor	= ci::Color::hex(0x777777);
	ci::Color	mBufferViewSliderTextValueColor	= ci::Color::gray(.2f);
	float		mBufferViewSliderCornerRadius   = 4.f;
	std::string	mBufferViewSliderLabelFont		= "Avenir-Medium";
	int			mBufferViewSliderLabelFontSize	= 12;
	
	ci::vec2	mBufferViewPresetsTopLeft		= ci::vec2(68,0);
	ci::vec2	mBufferViewPresetsSize			= ci::vec2(125,23);
	float		mBufferViewPresetsCornerRadius	= 5.f;
	ci::Color	mBufferViewPresetsColor			= ci::Color::hex(0x979797);
	std::string	mBufferViewPresetsFont			= "Avenir-Medium";
	int			mBufferViewPresetsFontSize		= 12;
	ci::Color	mBufferViewPresetsFontColor		= ci::Color::hex(0x2B2B2B);
	ci::Color	mBufferViewPresetsSelectColor	= ci::Color::hex(0xFFDC73);
	
	// view shared
	std::string	mSubheadFont			= "Avenir-Heavy";
	int			mSubheadFontSize		= 12;
	ci::Color	mSubheadFontColor		= ci::Color::hex(0x000000);

	std::string	mHeadFont				= "Avenir-Heavy";
	int			mHeadFontSize			= 24;
	ci::Color	mHeadFontColor			= ci::Color::hex(0x7F94AC);
	
	
	// frag view
	ci::vec2	mFragViewSize			= ci::vec2(303,520);	
	ci::vec2	mFragViewSlidersTopLeft	= ci::vec2(63,190);
	float		mFragViewSlidersWidth		= 217.f;
	float		mFragViewSlidersIconGutter  = 16.f;
	float		mFragViewSlidersGraphHeight = 32.f;
	float		mFragViewSlidersVOffset		= 56.f;
	ci::vec2	mFragViewSliderIconNotionalSize = ci::vec2(26.f);
	ci::vec2	mFragViewColorsTopLeft		= ci::vec2(173,74);
	ci::vec2	mFragViewColorSize			= ci::vec2(25.f);
	int			mFragViewColorsNumCols		= 4;
	ci::vec2	mFragViewHeaderBaselinePos	= ci::vec2( 77.f, -mHeadingGutter );
	std::string mFragViewHeaderStr			= "Species";
	
	ci::vec2	mFragViewWellTopLeft	= ci::vec2(77,71); 
	ci::vec2	mFragViewWellSize		= ci::vec2(80,80);
	float		mFragViewWellCornerRadius = 4.f;
	ci::Color	mFragViewWellStroke		= ci::Color::hex(0xBDBDBD);
	ci::Color	mFragViewWellFill		= ci::Color::hex(0xF1F1F1);
	ci::Color	mFragViewWellShadow		= ci::Color::hex(0xF0F0F0);
	ci::vec2	mFragViewWellShadowOffset = ci::vec2(0.f,4.f);
	
	// buttons
	ci::vec2	mBtnSize			= ci::vec2(32,32);
	ci::Color	mBtnHoverColor		= ci::Color::gray(.9f);
	ci::Color	mBtnDownColor		= ci::Color::gray(.7f);
	float		mBtnGutter			= 16.f;
	
	// sliders
	ci::Color	mSliderLineColor   = ci::Color::hex(0x979797); 
	ci::Color	mSliderHandleColor = ci::Color::hex(0x4990E2);
	ci::vec2	mSliderHandleSize  = ci::vec2(16,20);
	float		mSliderNotchRadius = 2.5f;


	// misc.
	ci::vec2	mBraceSize			= ci::vec2(44,465);
	
	// debug
	bool		mDebugDrawLayoutGuides		= false;
	ci::Color	mDebugDrawLayoutGuideColor	= ci::Color::hex(0x18BFFF);
		
	
	// assets
	ci::gl::TextureRef uiImage( std::string name ) const;
	ci::gl::TextureRef uiImage( ci::fs::path stem, std::string name ) const;
	ci::gl::TextureRef uiImageWithPath( ci::fs::path assetPath ) const;

	// helpers
	ci::vec2  snapToPixel( ci::vec2  p ) const;
	ci::Rectf snapToPixel( ci::Rectf r ) const;

	ci::Rectf layoutBrace( ci::Rectf inRect ) const;
	
	ci::gl::TextureRef renderSubhead( std::string ) const;
	ci::gl::TextureRef renderHead   ( std::string ) const;
	ci::Rectf		   layoutHeadingText( ci::gl::TextureRef tex, ci::vec2 offsetFromViewTopLeft ) const;
	
private:
	ci::gl::TextureRef renderText   ( std::string, const ci::Font&, ci::ColorA ) const;
	
	mutable std::map<ci::fs::path,ci::gl::TextureRef> mUIImages;

};
extern	     Layout  gLayout;
extern const Layout &kLayout;
