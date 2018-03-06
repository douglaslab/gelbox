//
//  Layout.h
//  Gelbox
//
//  Created by Chaim Gingold on 3/5/18.
//
//	Consolidating all layout tuning data into one file.

#pragma once

class Layout
{
public:
	
	ci::vec2	mWindowSize			= ci::vec2(1365,768);
	
	
	// main view layout
	ci::vec2	mGelSize			= ci::vec2(390,520);
	ci::vec2	mGelTopLeft			= ci::vec2(208,124);
	int			mGelDefaultLanes	= 7;
	float		mGelWellGutter		= 20.f;

	ci::vec2	mLoupeSize			= ci::vec2(171,171);
	ci::vec2	mSampleSize			= ci::vec2(362,520);
	
	float		mGelToSampleGutter	= 30.f;
	float		mSampleToBraceGutter= 31.f;
	
	ci::vec2	mFragViewSize			= ci::vec2(303,520);	
	ci::vec2	mFragViewSlidersTopLeft	= ci::vec2(63,190);
	float		mFragViewSlidersWidth	= 217.f;
	
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


	// misc.
	ci::vec2	mBraceSize			= ci::vec2(44,465);
	
	// assets
	ci::gl::TextureRef brace() const;
	ci::gl::TextureRef settings() const;

	static ci::gl::TextureRef loadImage( std::string name, ci::gl::TextureRef* r=0 );
	static ci::gl::TextureRef loadImage( ci::fs::path path, std::string name, ci::gl::TextureRef* r=0 );
		// returns r if exists, returns tries to load it, updates r, and returns it
	
private:
	mutable ci::gl::TextureRef mBrace;
	mutable ci::gl::TextureRef mSettings;

};
extern	     Layout  gLayout;
extern const Layout &kLayout;