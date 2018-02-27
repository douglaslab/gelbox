//
//  GelRender.h
//  Gelbox
//
//  Created by Chaim Gingold on 2/23/18.
//
//

/*	This class handles the visual side of gel simulation.
	It executes all of the visual effects that produce a gel.
	
	The input is a series of gel fragments, each parameterized with instructions on how to blur, translate, deform, etc... them. Those parameters are defined in GelSim.h. 
	The output is a texture/image of the finished gel.
	
	The strategy is described in design/Gel sim visual features.sketch
*/

#include "cinder/gl/Fbo.h"
#include "cinder/gl/Shader.h"
#include "cinder/Rand.h"

#pragma once

class GelRender;
typedef std::shared_ptr<GelRender> GelRenderRef;

class GelRender
{
public:
	void setup( glm::ivec2 gelsize, int pixelsPerUnit );
	
	class Band
	{
	public:
		ci::Rectf	mWellRect;
//		float		mYMovement	= 0.f;

		// smearing
		// in world space units
		// corresponds to aggregation/degrading gradient above/below
		float		mSmearAbove = 0.f;
		float		mSmearBelow = 0.f;
		float		mSmearBrightness[2] = {1,0}; // near, far (e.g. 1,0)
		
		float		mFlames		= 0.f; // in unit space, how high to make the flames?
		
		float		mSmileHeight = 0.f; // how high in unit space will max smile peel back?
		float		mSmileExp	 = 0.f; // what exponent to apply to smile curve?
		
		int			mBlur		= 0;
		ci::ColorA	mColor		= ci::ColorA(1,1,1,1);
		
		int			mRandSeed	= 0;
	};
	
	void render( const std::vector<Band>& );
	
	ci::gl::TextureRef getOutput() { return mCompositeFBO->getColorTexture(); }
	
private:

	// output size
	glm::ivec2 mGelSize;    // so we can talk in terms of gel world space coordinates 
	int		   mPixelsPerUnit;
	glm::ivec2 mOutputSize; // = mGelSize * mPixelsPerUnit

	// final compositing
	ci::gl::FboRef mBandFBO, mBandFBOTemp; // so we can ping-pong; always render TO mBandFBO
	ci::gl::FboRef mCompositeFBO;

	// shaders
	ci::gl::GlslProgRef	mBlur5Glsl;
	ci::gl::GlslProgRef	mWarpGlsl;

	//
	void drawSmear ( ci::Rectf r,
					 float direction, // direction >0 means below, <0 means above
					 float thickness,
					 ci::ColorA cclose, ci::ColorA cfar ) const;  
	
	void drawFlames( ci::Rectf r, float height, ci::Rand& ) const;
	
	void smileBand( ci::gl::FboRef& buf, ci::gl::FboRef& tmp, float x1, float x2, float height, float exp ) const;
	
	void warp(	ci::gl::FboRef& buf,
				ci::gl::FboRef& tmp,
				ci::gl::TextureRef warp,
				float			   warpScale ) const;
		
	void blur( ci::gl::FboRef& buf, ci::gl::FboRef& tmp, int distance );
	
	void shadeRect( ci::gl::TextureRef texture, ci::gl::GlslProgRef glsl, ci::Rectf dstRect ) const;
		// you bind glsl before calling, so you can set your own params
	
};