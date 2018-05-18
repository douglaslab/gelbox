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
	
	// app settings defaults
	bool		mEnableGelRenderByDefault		= true; // enable new fancy gel rendering with FBO
	bool		mEnableLoupeOnHoverByDefault	= false; 

	// various misc. ui behavior flags
	bool		mEnableGelViewDrag				= false;
	bool		mBandRolloverOpensSampleView	= false;
	bool		mHoverGelDetailViewOnBandDrag	= false;
	bool		mDragBandMakesNewSamples		= true;

	// reverse solver tuning/debug
	bool		mShowReverseSolverDebugTest		= false;
	int			mSolverMaxIterations			= 50; // this number is totally fine; maybe could even be smaller
	
};
extern       Config  gConfig;
extern const Config &kConfig;

