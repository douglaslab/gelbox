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

void GelRender::setup( glm::ivec2 gelsize, int pixelsPerUnit )
{
	// sizing params
	mGelSize		= gelsize;
	mPixelsPerUnit	= pixelsPerUnit;
	mOutputSize		= mGelSize * mPixelsPerUnit;
	
	// fbos
	mCompositeFBO = gl::Fbo::create( mOutputSize.x, mOutputSize.y );

	gl::Texture::Format f;
//	f.setInternalFormat(GL_R32F);
//	f.setSwizzleMask(GL_RED,GL_RED,GL_RED,GL_RED);

	for( int i=0; i<2; ++i )
	{
		mBandFBO[i] = gl::Fbo::create(
			mOutputSize.x, mOutputSize.y,
			gl::Fbo::Format().colorTexture(f)
			);
	}
		
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

	loadShader( mBlurGlsl, "blur.vert", "blur.frag" );	
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
	
	// helpers
	auto drawTexture = [this]( gl::TextureRef texture, gl::GlslProgRef glsl )
	{
		Rectf dstRect( vec2(0.f), mGelSize );		
		Rectf texRect( vec2(0.f,1.f), vec2(1.f,0.f) );
		
		gl::ScopedTextureBind texScope( texture, 0 );
		gl::ScopedGlslProg glslScope( glsl );
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
	};

	//
	for( auto band : bands )
	{
		int ppi = 0; // ping-pong index we are rendering TO right now

		// draw band to fbo
		{
			gl::ScopedFramebuffer bandFboScope( mBandFBO[ppi] );
			gl::clear( Color(0,0,0) );

			gl::color(1,1,1,1); // rendering to 32-bit float, so color doesn't really matter
			gl::drawSolidRect(band.mWellRect);
		}
		
		// blur
		if (1)
		{
			if (mBlurGlsl)
			{
				ppi = 1 - ppi; // swap
				
				gl::ScopedFramebuffer bandFboScope( mBandFBO[ppi] );
				gl::clear( Color(0,0,1) );
				
				drawTexture( mBandFBO[1-ppi]->getColorTexture(), mBlurGlsl );
			}
			else
			{
				// show we failed to load it!
				ppi = 1 - ppi; // swap
				gl::ScopedFramebuffer bandFboScope( mBandFBO[ppi] );
				gl::clear( Color(1,1,0) );				
			}
		}
		
		// composite
		{
			// fbo automatically back to compositeFboScope
			
			gl::ScopedBlend blendScp( GL_SRC_ALPHA, GL_ONE );
			
			gl::color(band.mColor);
			gl::draw( mBandFBO[ppi]->getColorTexture(), Rectf( vec2(0.f), mGelSize ) );
		}
	}
}