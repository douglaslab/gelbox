//
//  Config.h
//  Gelbox
//
//  Created by Chaim Gingold on 5/17/18.
//

#pragma once

class Config
{
public:
	
	// help button url
	std::string	mHelpURL						= "http://douglaslab.org/gelbox/help";
	std::string	mAppFileVersion					= "1.0";
	
	// high level app settings
	bool		mEnableHDDisplay				= true;
	bool		mEnableHDGelRender				= false; // works; but is it worth the performance cost?
	bool		mEnableWindowResize				= true;
	
	// app settings defaults
	bool		mEnableGelRenderByDefault		= true; // enable new fancy gel rendering with FBO
	bool		mEnableLoupeOnHoverByDefault	= false; 

	// various misc. ui behavior flags
	bool		mEnableGelViewDrag				= false;
	bool		mBandRolloverOpensSampleView	= false;
	bool		mHoverGelDetailViewOnBandDrag	= false;
	bool		mDragBandMakesNewSamples		= true;
	bool		mEnableBufferSlides				= false;  // disable sliders for now

	// reverse solver tuning/debug
	bool		mShowReverseSolverDebugTest		= false;
	int			mSolverMaxIterations			= 50; // this number is totally fine; maybe could even be smaller
	
	// random new frag
	float		mNewFragChanceNonUniformAspectRatio = 0.f; // was 1/3
	float		mNewFragChanceMultimer				= 0.f; // was 1/5

	// layout options
	bool		mTimelineBelowGel				= true;
		
};
extern       Config  gConfig;
extern const Config &kConfig;

