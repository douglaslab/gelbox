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
//		float		mFlames		= 0.f;
//		float		mWellDamage	= 0.f;
//		ci::vec2	mBandSmile	= ci::vec2(0.f);
		int			mBlur		= 0;
		ci::ColorA	mColor		= ci::ColorA(1,1,1,1);
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

	//
	void blur( ci::gl::FboRef& buf, ci::gl::FboRef& tmp, int distance );
	void shadeRect( ci::gl::TextureRef texture, ci::gl::GlslProgRef glsl, ci::Rectf dstRect ) const;
		// you bind glsl before calling, so you can set your own params
	
};