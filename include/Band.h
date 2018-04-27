//
//  Band.h
//  Gelbox
//
//  Created by Chaim Gingold on 4/27/18.
//

#pragma once


class Band
{
public:
	
	// meta-data
	int			mLane		= -1; // what lane are we in?
	int			mFragment	= -1;
	int			mDye		= -1;

	// fragment data (inputs)
	float		mMass		 = 0.f; // needed?
	float		mDegrade	 = 0.f; // needed? re-parameterize as 2 variables?
	float		mAspectRatio = 1.f; // needed?
	
	// ui
	ci::Color   mFocusColor;
	
	// basic geometric information
	ci::Rectf	mRect;		// visual. does not include smearing above/below
	ci::Rectf	mUIRect;	// ui. should encompass all visual phenomena.
	ci::Rectf	mWellRect;	// start bounds 
	
	// render params (for GelRender class)
	float		mSmearAbove = 0.f;
	float		mSmearBelow = 0.f;
	float		mSmearBrightness[2] = {1,0}; // near, far (e.g. 1,0)
	
	float		mFlameHeight = 0.f; // in unit space, how high to make the flames?
	
	float		mSmileHeight = 0.f; // how high in unit space will max smile peel back?
	float		mSmileExp	 = 0.f; // what exponent to apply to smile curve?
	
	int			mBlur		= 0;
	ci::ColorA	mColor		= ci::ColorA(1,1,1,1);
	
	int			mRandSeed	= 0;	


	// TO REFACTOR (from Gel::Band)
	// for top (higher bp) and bottom (lower bp) of band, how many bases and aggregates?
	int			mBases[2]; // degrade causes these values to drop
	int			mMultimer[2];
	
	std::vector<float> mAggregate; // population ratios, as represented elsewhere with mAggregate
};
