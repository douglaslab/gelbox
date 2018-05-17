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
	int			mFragment	= -1; // what fragment from sample are we from?
	int			mDye		= -1; // if -1 not a dye; otherwise, what dye is it?

	// fragment data (inputs)
	int			mBases		 = 0;	// base count
	int			mAggregate	 = 1;   // monomer by default (so, mBases * mAggregate is effective molecule size)
	int			mDegradeLo	 = 0;	// by how many base pairs are we degraded at the low  end (bottom of band shifted down)?  
	int			mDegradeHi	 = 0;	// by how many base pairs are we degraded at the high end (top of band shifted down)?
	float		mMass		 = 0.f; // needed?
	float		mAspectRatio = 1.f; // needed?
	
	// ui
	ci::Color   mFocusColor;
	
	// basic geometric information
	ci::Rectf	mRect;		// visual. does not include smearing above/below or blurring.
	ci::Rectf	mUIRect;	// ui. should encompass all visual phenomena.
	ci::Rectf	mWellRect;	// start bounds 
	
	// render params (some just for GelRender class)
	float		mSmearAbove = 0.f; // same units as mRect
	float		mSmearBelow = 0.f; // same units as mRect
	float		mSmearBrightness[2] = {1,0}; // near, far (e.g. 1,0)
	
	float		mFlameHeight = 0.f; // in unit space, how high to make the flames?
	
	float		mSmileHeight = 0.f; // how high in unit space will max smile peel back?
	float		mSmileExp	 = 0.f; // what exponent to apply to smile curve?
	
	int			mBlur		= 0;
	ci::ColorA	mColor		= ci::ColorA(1,1,1,1);
	
	int			mRandSeed	= 0;	

};

inline int findBandByAggregate( const std::vector<Band>& bands, int aggregate )
{
	int bandi = -1;
	
	for( size_t i=0; i<bands.size(); ++i )
	{
		if ( bands[i].mAggregate == aggregate ) {
			bandi = (int)i;
			break;
		}
	}
	
	return bandi;
}
