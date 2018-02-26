//
//  GelRender.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 2/23/18.
//
//

#include "GelRender.h"

using namespace ci;
using namespace ci::app; // loadAsset
using namespace std;

// RGB
//const GLint kChannelFormat = GL_RGB;

// R
// (One channel is harder to debug since we draw other colors to signal errors)
const GLint kChannelFormat = GL_R8;

// > R8
// (Not clear any quality improvements happen) 
//const GLint kChannelFormat = GL_R16;
//const GLint kChannelFormat = GL_R16F;
//const GLint kChannelFormat = GL_R32F;

void GelRender::setup( glm::ivec2 gelsize, int pixelsPerUnit )
{
	// sizing params
	mGelSize		= gelsize;
	mPixelsPerUnit	= pixelsPerUnit;
	mOutputSize		= mGelSize * mPixelsPerUnit;
	
	// fbos
	mCompositeFBO = gl::Fbo::create( mOutputSize.x, mOutputSize.y );

	gl::Texture::Format f;
	if ( kChannelFormat != GL_RGB )
	{
		f.setInternalFormat( kChannelFormat );
		f.setSwizzleMask(GL_RED,GL_RED,GL_RED,GL_ONE);
	}

	mBandFBO = gl::Fbo::create(
		mOutputSize.x, mOutputSize.y,
		gl::Fbo::Format().colorTexture(f)
		);

	mBandFBOTemp = gl::Fbo::create(
		mOutputSize.x, mOutputSize.y,
		gl::Fbo::Format().colorTexture(f)
		);
		
	// shaders
	auto loadShader = []( gl::GlslProgRef &prog, string vert, string frag )
	{
		try
		{
			fs::path p = getAssetPath("shaders");
			
			prog = gl::GlslProg::create(
				loadFile( p / vert ),
				loadFile( p / frag )
				);
		}
		catch ( Exception e )
		{
			cerr << "Failed to load GelRender shader '" << vert << "','" << frag << "'" << endl;
			cerr << e.what() << endl;
		}
	};

	loadShader( mBlur5Glsl, "passthrough.vert", "blur5.frag" );	
}

void GelRender::render( const std::vector<Band>& bands )
{
	/* Notes:
		- Would be clearer + faster to not use gl::ScopedFramebuffer and just manually switch them. But whatever.
	*/
	
	// clear output fbo
	gl::ScopedFramebuffer compositeFboScope( mCompositeFBO );
	gl::clear( Color(0,0,0) );

	// get render coordinate space setup
	// same for both fbos 
	gl::ScopedViewport scpVp( ivec2( 0 ), mCompositeFBO->getSize() );
	CameraOrtho ortho(0.f, mGelSize.x, mGelSize.y, 0.f, -1.f, 1.f);
	gl::ScopedMatrices scpM;
	gl::setMatrices(ortho);
	
	// each
	for( auto band : bands )
	{
		// draw band to fbo
		{
			gl::ScopedFramebuffer bandFboScope( mBandFBO );
			gl::clear( Color(0,0,0) );

			gl::color(1,1,1,1); // rendering to 32-bit float, so color doesn't really matter
			gl::drawSolidRect(band.mWellRect);
		}
		
		// blur
		blur( mBandFBO, mBandFBOTemp, band.mBlur );
		
		// composite
		{
			// fbo automatically back to compositeFboScope
			
			gl::ScopedBlend blendScp( GL_SRC_ALPHA, GL_ONE );
			
			gl::color(band.mColor);
			gl::draw( mBandFBO->getColorTexture(), Rectf( vec2(0.f), mGelSize ) );
		}
	}
}

void GelRender::blur( ci::gl::FboRef& fbo, ci::gl::FboRef& fboTemp, int distance )
{
	// We could do fewer passes if we use the blur5 (1px), blur9 (4px), blur15 (7px) shaders, too.
	// But this works and should be fine. 
	
	if ( mBlur5Glsl )
	{
		gl::ScopedGlslProg glslScope( mBlur5Glsl );

		for( int i=0; i<distance*2; ++i ) // 2x, for horizontal + vertical decomposition
		{
			swap( fbo, fboTemp );

			gl::ScopedFramebuffer bandFboScope( fbo );
			gl::clear( Color(0,0,1) );

			mBlur5Glsl->uniform("uBlurResolution", vec2(mGelSize) );
			mBlur5Glsl->uniform("uBlurDirection",  (i%2) ? vec2(0,1) : vec2(1,0) );
			
			shadeRect( fboTemp->getColorTexture(), mBlur5Glsl, Rectf( vec2(0), mGelSize ) );		
		}
	}
	else
	{
		// show we failed to load shader!
		swap( fbo, fboTemp );
		gl::ScopedFramebuffer bandFboScope( fbo );
		gl::clear( Color(1,1,0) );
	}
}

void GelRender::shadeRect( gl::TextureRef texture, gl::GlslProgRef glsl, Rectf dstRect ) const
{
	Rectf texRect( vec2(0.f,1.f), vec2(1.f,0.f) );
	
	gl::ScopedTextureBind texScope( texture, 0 );
//	gl::ScopedGlslProg glslScope( glsl );
	glsl->uniform( "uTex0", 0 );
	glsl->uniform( "uPositionOffset", dstRect.getUpperLeft() );
	glsl->uniform( "uPositionScale", dstRect.getSize() );
	glsl->uniform( "uTexCoordOffset", texRect.getUpperLeft() );
	glsl->uniform( "uTexCoordScale", texRect.getSize() );
	
	auto ctx = gl::context();

	gl::ScopedVao vaoScp( ctx->getDrawTextureVao() );
	gl::ScopedBuffer vboScp( ctx->getDrawTextureVbo() );

	ctx->setDefaultShaderVars();
	ctx->drawArrays( GL_TRIANGLE_STRIP, 0, 4 );		
}