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

	ci::vec2	mLoupeSize			= ci::vec2(171,171);
	ci::vec2	mSampleSize			= ci::vec2(362,520);
	
	float		mGelToSampleGutter	= 30.f;
	float		mGelToBraceGutter	= 30.f;
	float		mSampleToBraceGutter= 31.f;
	
	ci::Color	mRuleColor			= ci::Color::hex(0xC4C4C4);
	
	// gel view settings view
	ci::vec2	mGelViewSettingsSize	= ci::vec2(303,520);
	ci::vec2	mGelViewSettingsSlidersTopLeft = ci::vec2(84,246);
	ci::vec2	mGelViewSettingsRuleTopLeft = ci::vec2(66,216);
	float		mGelViewSettingsRuleLength  = 237;
	
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
	
private:
	mutable std::map<ci::fs::path,ci::gl::TextureRef> mUIImages;

};
extern	     Layout  gLayout;
extern const Layout &kLayout;
