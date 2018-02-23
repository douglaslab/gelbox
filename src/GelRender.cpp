//
//  GelRender.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 2/23/18.
//
//

#include "GelRender.h"

using namespace ci;
using namespace std;

void GelRender::setup( glm::ivec2 gelsize, int pixelsPerUnit )
{
	mGelSize		= gelsize;
	mPixelsPerUnit	= pixelsPerUnit;
	mOutputSize		= mGelSize * mPixelsPerUnit;
	
	mCompositeFBO = gl::Fbo::create( mOutputSize.x, mOutputSize.y );
	mBandFBO	  = gl::Fbo::create( mOutputSize.x, mOutputSize.y, gl::Fbo::Format()
		.colorTexture( gl::Texture::Format()
						.internalFormat(GL_RGB32F) // 32-bit floats!
					 )
		);

	/* NOTE: to be able to use R32F properly,
		we need to swizzle:
		GLint swizzleMask[] = {GL_RED,GL_RED,GL_RED,GL_RED};
		glTexParameteriv(GL_TEXTURE_2D, GL_TEXTURE_SWIZZLE_RGBA, swizzleMask);
		
		see https://www.khronos.org/opengl/wiki/Texture#Swizzle_mask
		and https://stackoverflow.com/questions/16950490/process-single-channel-image-by-glsl-texture
		
		in practice, this is probably just a performance issue, so we aren't pushing further on it for now.
	*/
}

void GelRender::render( const std::vector<Band>& bands )
{
	// clear output fbo
	gl::ScopedFramebuffer compositeFboScope( mCompositeFBO );
	gl::clear( Color(0,0,0) );

	// get render coordinate space setup
	// same for both fbos 
	gl::ScopedViewport scpVp( ivec2( 0 ), mCompositeFBO->getSize() );
	CameraOrtho ortho(0.f, mGelSize.x, mGelSize.y, 0.f, -1.f, 1.f);
	gl::ScopedMatrices scpM;
	gl::setMatrices(ortho);
	
	//
	for( auto band : bands )
	{
		// draw band to fbo
		{
			gl::ScopedFramebuffer bandFboScope( mBandFBO );
			gl::clear( Color(0,0,0) );

			gl::color(1,1,1,1); // rendering to 32-bit float, so color doesn't really matter
			gl::drawSolidRect(band.mWellRect);
		}
		
		// composite
		{
			// fbo automatically back to compositeFboScope
			
			gl::ScopedBlend blendScp( GL_SRC_ALPHA, GL_ONE );
			
			gl::color(band.mColor);
			gl::draw( mBandFBO->getColorTexture(), Rectf( vec2(0.f), mGelSize ) );
		}
	}
}