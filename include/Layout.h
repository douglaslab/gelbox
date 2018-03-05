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
	
	ci::vec2 mWindowSize			= ci::vec2(1365,768);
	
	// main view layout
	ci::vec2	mGelSize			= ci::vec2(390,520);
	ci::vec2	mGelTopLeft			= ci::vec2(208,124);
	int			mGelDefaultLanes	= 7;
	float		mGelWellGutter		= 20.f;

	ci::vec2	mLoupeSize			= ci::vec2(171,171);
	ci::vec2	mSampleSize			= ci::vec2(362,520);
	
	// buttons
	ci::vec2	mSettingsBtnSize	= ci::vec2(32,32);
	
	ci::vec2	mNewBtnSize			= ci::vec2(32,32);

	ci::Color	mBtnHoverColor		= ci::Color::gray(.9f);
	ci::Color	mBtnDownColor		= ci::Color::gray(.7f);
	float		mBtnGutter			= 16.f;

	// misc.
	ci::vec2	mBraceSize			= ci::vec2(44,465);
	ci::vec2	mFragWellSize		= ci::vec2(80,80);
	
};
extern Layout  gLayout;
extern Layout &kLayout;