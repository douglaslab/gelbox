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
#include "Band.h"

#pragma once

class GelRender;
typedef std::shared_ptr<GelRender> GelRenderRef;

class GelRender
{
public:
	void setup( glm::ivec2 gelsize, int pixelsPerUnit );
	
	void setBands( const std::vector<Band>& b ) { mBands = b; } 
	void setGlobalWarp( float amount, int randseed ) { mGlobalWarp=amount; mGlobalWarpRandSeed=randseed; }
	void render();
	
	ci::gl::TextureRef getOutput() { return mCompositeFBO ? mCompositeFBO->getColorTexture() : 0; }
	
private:

	// input
	std::vector<Band>	mBands;
	float				mGlobalWarp;
	int					mGlobalWarpRandSeed = 0;
	
	// output size
	glm::ivec2 mGelSize;    // so we can talk in terms of gel world space coordinates 
	int		   mPixelsPerUnit;
	glm::ivec2 mOutputSize; // = mGelSize * mPixelsPerUnit

	// final compositing
	ci::gl::FboRef mBandFBO, mBandFBOTemp; // so we can ping-pong; always render TO mBandFBO
	ci::gl::FboRef mCompositeFBO, mCompositeFBOTemp;

	// shaders
	ci::gl::GlslProgRef	mBlur5Glsl, mBlur9Glsl, mBlur13Glsl; // 1px, 2px, 3px blur
	ci::gl::GlslProgRef	mWarpGlsl;

	//
	void drawSmear ( ci::Rectf r,
					 float direction, // direction >0 means below, <0 means above
					 float thickness,
					 ci::ColorA cclose, ci::ColorA cfar ) const;  
	
	void drawFlames( ci::Rectf r, float height, ci::Rand& ) const;
	
	void smileBand( ci::gl::FboRef& buf, ci::gl::FboRef& tmp, float x1, float x2, float height, float exp ) const;
	void wellDamageBand( ci::gl::FboRef& buf, ci::gl::FboRef& tmp, ci::Rectf, float damage, int randseed ) const;
	
	void warp(	ci::gl::FboRef& buf,
				ci::gl::FboRef& tmp,
				ci::gl::TextureRef warp,
				float			   warpScale ) const;
		
	void blur( ci::gl::FboRef& buf, ci::gl::FboRef& tmp, int distance );
	
	void overcook( ci::gl::FboRef& buf, ci::gl::FboRef& tmp, float amount, int rseed );
	
	void shadeRect( ci::gl::TextureRef texture, ci::gl::GlslProgRef glsl, ci::Rectf dstRect ) const;
		// you bind glsl before calling, so you can set your own params
	
	
	// reusable textures
	ci::gl::TextureRef get1dTex( ci::Surface8uRef ) const;
	ci::gl::TextureRef get2dTex( ci::Surface8uRef ) const;
	
	mutable ci::gl::TextureRef m1dTex, m2dTex;
	
};
