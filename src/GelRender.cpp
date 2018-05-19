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
// (One channel is harder to debug since we draw other colors to signal errors)
const GLint kChannelFormat = GL_RGB;

// R
//const GLint kChannelFormat = GL_R8;

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

	loadShader( mBlur5Glsl,"passthrough.vert", "blur5.frag" );	
	loadShader( mBlur9Glsl,"passthrough.vert", "blur9.frag" );	
	loadShader( mBlur13Glsl,"passthrough.vert", "blur13.frag" );	
	loadShader( mWarpGlsl, "passthrough.vert", "warp.frag" );	
}

void GelRender::render()
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
	for( auto band : mBands )
	{
		 ci::Rand randGen(band.mRandSeed);
		 
		// draw band to fbo
		{
			// clear
			gl::ScopedFramebuffer bandFboScope( mBandFBO );
			gl::clear( Color(0,0,0) );

			// body
			gl::color(1,1,1,1); // could be rendering to mono-channel, so color doesn't really matter
			gl::drawSolidRect(band.mRect);
			
			// flames
			if ( band.mFlameHeight > 0.f )
			{
				drawFlames( band.mRect, band.mFlameHeight, randGen );
			}

			// smears
			ColorA smearColorClose(band.mSmearBrightness[0],band.mSmearBrightness[0],band.mSmearBrightness[0],1.f);
			ColorA smearColorFar  (band.mSmearBrightness[1],band.mSmearBrightness[1],band.mSmearBrightness[1],1.f);
			drawSmear( band.mRect, -1, band.mSmearAbove, smearColorClose, smearColorFar );
			drawSmear( band.mRect, +1, band.mSmearBelow, smearColorClose, smearColorFar );
				// would be nice to have flame in its own texture, so we can
				// just stretch it up, too...
		}
		
		// smile
		smileBand( mBandFBO, mBandFBOTemp, band.mRect.x1, band.mRect.x2, band.mSmileHeight, band.mSmileExp );
		
		// damage
		wellDamageBand( mBandFBO, mBandFBOTemp, band.mRect, band.mWellDamage, band.mWellDamageRandSeed );
		
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

void GelRender::drawSmear ( ci::Rectf ir, float direction, float thickness, ColorA cclose, ColorA cfar ) const
{
	// would be nice to have a 1d smear texture we are using
	// that texture should be brighter where we have tall flames (e.g.)
	// just like in our reference material
	
	Rectf r  = ir;
	float hh = ir.getHeight() / 2.f; 
	
	if ( direction > 0.f )
	{
		r.y1 = ir.y2 - hh;
		r.y2 = ir.y2 + thickness;
	}
	else
	{
		r.y2 = ir.y1 + hh;
		r.y1 = ir.y2 - thickness;
	}
	
	vec2 v[4] =
	{
		r.getUpperLeft(),
		r.getUpperRight(),
		r.getLowerRight(),
		r.getLowerLeft()
	};

	TriMesh m( TriMesh::Format().colors(4).positions(2) );
	m.appendPositions(v,4);
	const int i = 0;
	m.appendTriangle( i+2, i+1, i+0 );
	m.appendTriangle( i+0, i+3, i+2 );

	if (direction>0.f)
	{
		m.appendColorRgba(cclose);
		m.appendColorRgba(cclose);
		m.appendColorRgba(cfar);
		m.appendColorRgba(cfar);
	}
	else
	{
		m.appendColorRgba(cfar);
		m.appendColorRgba(cfar);
		m.appendColorRgba(cclose);
		m.appendColorRgba(cclose);
	}
	
	gl::draw(m);
} 

template<class T>
void mapx( T* d, size_t len, function<T(float,float)> f )
{
	const float denom = 1.f / (float)(len-1);

	for( int i=0; i<len; ++i )
	{
		d[i] = f( d[i], (float)i * denom );  
	}
}

template<class T>
void displace( T* d, int a, int b, float ad, float bd )
{
	mapx<float>( d + a, b-a, [=]( float oldx, float x ) -> float
	{
		return oldx + lerp(ad,bd,x);
	});
};

void recursiveFlameMidpointDisplacement (
	vector<float> &d,
	int lo, int hi,
	float dy, float dyk,
	ci::Rand& randGen )
{
	int l = hi-lo;
	int m = lo + l/2;
	
	if (l>2)
	{
		float delta = (randGen.nextFloat()-.5f) * dy;
		
		displace<float>(
			d.data(),
			0, m,
			0.f, delta );

		displace<float>(
			d.data(),
			m, (int)d.size(),
			delta, 0.f );
			
		recursiveFlameMidpointDisplacement( d, 0, m , dy*dyk, dyk, randGen );
		recursiveFlameMidpointDisplacement( d, m, hi, dy*dyk, dyk, randGen );
	}
}

void GelRender::drawFlames( Rectf r, float height, ci::Rand& randGen ) const
{
	// other ideas:
	// just draw random # of vertical strands at random x-positions
	// with random thicknesses, perhaps varying from top and bottom.
	// can skew aspects probabilities with closeness to edge 
	
	if ((0))
	{
		int n = r.getWidth() / 4.f;
		
		for( int i=0; i<n; ++i )
		{
			float y1 = r.y1 - height;
			float y2 = r.y1;
			
			float yr = randGen.nextFloat();
			yr = 1.f - yr * randGen.nextFloat();
			
			vec2 c( randGen.nextFloat(r.x1,r.x2), lerp(y1,y2,yr) );
			float cr = r.getHeight() * .5f;
			
			gl::drawSolidCircle(c,cr);
		}
	}
	else
	{
		////
		int   steps = max( 5, (int)(r.getWidth() / 2.f) );
	//	int   steps = r.getWidth() / 4.f;
		float step  = r.getWidth() / (float)steps;
		
		vector<float> d(steps,.0f);

		/*
		// curve up to edges
		if (1)
		{
			mapx<float>( d.data(), d.size(), []( float oldx, float x ) -> float
			{
				x = min( x, 1.f - x ); 
				x = 1.f - x;
				x = powf(x,2.f);
				return oldx + x * .25f;
			});
		}
		
		recursiveFlameMidpointDisplacement(d, 0,d.size(), 1.f, .5f, randGen);
		*/
		
		if (1)
		{
			mapx<float>( d.data(), d.size(), [&randGen]( float oldx, float x ) -> float
			{
				x = min( x, 1.f - x ); 
				x = 1.f - x;
				x = powf(x,2.f);
				return x * .25f + randGen.nextFloat() * randGen.nextFloat();
			});			
		}
		
		for( int i=0; i<steps; ++i )
		{
			float h = d[i];
			h = max( 0.f, h );
			
			Rectf fr;
			fr.x1 = r.x1  + (float)i * step;
			fr.x2 = fr.x1 + step;
			fr.y1 = r.y1 - height * h;
			fr.y2 = r.y1;
			
			gl::drawSolidRect(fr);
		}

			
		// curved cheeks around left and right side
		// should be more of a stretched ellipse that reaches to tips of d[0] and d[n-1]
		if ((0))
		{
			float cr = r.getHeight()/2.f;
			float y  = r.getCenter().y;
			
			float k = cr * .5f;
			
			gl::drawSolidCircle( vec2(r.x1+k,y), cr );
			gl::drawSolidCircle( vec2(r.x2-k,y), cr );
		}
	}
}

ci::Surface8uRef makeWarpByFracPos( ivec2 warpSize, function<vec2(vec2)> f )
{
	Surface8uRef s = Surface8u::create( warpSize.x, warpSize.y, false );
	
	if (s)
	{
		vec2 denom = vec2(1.f) / vec2(warpSize);
		
		Surface::Iter iter = s->getIter();
		while( iter.line() ) {
			while( iter.pixel() )
			{
				vec2 pos = vec2(iter.getPos()) * denom ;
				
				vec2 d = f(pos);
				
				iter.r() = (uint8_t)lmap( d.x, -1.f, 1.f, 0.f, 255.f );
				iter.g() = (uint8_t)lmap( d.y, -1.f, 1.f, 0.f, 255.f );
				iter.b() = 0; // no z displacement; ignored
			}
		}	
	}
	
	return s;
}

void GelRender::smileBand( ci::gl::FboRef& buf, ci::gl::FboRef& tmp, float x1, float x2, float height, float exp ) const
{
	/*	Note: A higher quality version of this would use a 2d control texture,
		and dampen the smile effect as we move towards the top of the band.
		We could do this most easily with some kind of gradient params in the warp shader.
		(e.g. distance to point, or just a linear gradient)
	*/
	
	if ( height == 0.f ) return;
	
	// normalize x1,x2
	x1 /= mOutputSize.x;
	x2 /= mOutputSize.x;
	
	// make warp texture
	ci::Surface8uRef s = makeWarpByFracPos(
		ivec2( mOutputSize.x, 1 ), // only need 1px tall
		[x1,x2,exp]( vec2 p )
		{
			// test functions
//			return vec2( 0, -p.x );
//			return vec2( 0, sin(p.x*100.f) );
			
			// smile
			vec2 d;
			
			float bx;
			bx = (p.x - x1) / (x2-x1); // band x 0..1 across band  ( 0   ...     1 ) across band
			bx = 2.f * fabs( .5f - bx ); // how far from center x? ( 1 ... 0 ... 1 ) across band
			
			bx = powf( bx, exp ); // curve it
			
			d.x = 0.f;
			d.y = -bx;
			
			return d;
		});
	
	warp( buf, tmp, get1dTex(s), height );
}

void GelRender::wellDamageBand( ci::gl::FboRef& buf, ci::gl::FboRef& tmp, ci::Rectf bandr, float damage, int rseed ) const
{
	// Optimization: per damage level, store a hash of rseed => Textures. discard it when damage changes, or when it gets too big.

	if ( damage <= 0.f ) return;

	// normalize x1,x2
	float x1 = bandr.x1;
	float x2 = bandr.x2;
	x1 /= mOutputSize.x;
	x2 /= mOutputSize.x;
	
	float w = bandr.getWidth () / mOutputSize.x; // normalized 
	
	// generate damage stabs		
	struct stab
	{
		float c;
		float r;
		float h;
		float rinv;
	};
	
	vector<stab> stabs;
	
	int nstabs = max( 1, (int)(damage * 10.f) ); // we know damage >= 0 at this point

	Rand r( rseed );
	
	const float yscale = max( .2f, powf( damage * .5f, .85f ) );
	
	for( int i=0; i<nstabs; ++i )
	{
		stab s;
		s.c = r.nextFloat(x1,x2);
		s.r = lerp( .05f, .5f, r.nextFloat() * r.nextFloat() ) * w;
		s.rinv = 1.f / s.r;
		s.h = r.nextFloat(-1.f,1.f) * yscale;
		stabs.push_back(s);
	}
	
	// test
	if ((0))
	{
		stabs.clear();
		stab s;
		s.c = lerp( x1, x2, .5f );
		s.r = .5f * w;
		s.h = r.nextBool() ? -1.f : 1.f;
		s.rinv = 1.f / s.r;
		stabs.push_back(s);
	}
		
	// make warp texture
	ci::Surface8uRef s = makeWarpByFracPos(
		ivec2( mOutputSize.x, 1 ), // only need 1px tall
		[=]( vec2 p )
		{
			float d = 0.f;
			
			for( const auto &s : stabs )
			{
				float dist = fabsf( s.c - p.x ) * s.rinv;
				
				if ( dist < 1.f )
				{
					d += (1.f - dist) * s.h; 
				}
			}
	
			return vec2( 0.f, d );
		});
	
	// warp
	warp( buf, tmp, get1dTex(s), bandr.getHeight() );
}

void GelRender::warp(
	ci::gl::FboRef& buf,
	ci::gl::FboRef& tmp,
	ci::gl::TextureRef warp,
	float			   warpScale ) const
{
	if (mWarpGlsl)
	{
		gl::ScopedFramebuffer bandFboScope( tmp ); // draw to tmp
		gl::ScopedGlslProg glslScope( mWarpGlsl );
		
		
		vec2 warpScaleUV = vec2(warpScale) / vec2(mGelSize); // with uv 
		
		mWarpGlsl->uniform("uWarpScale",warpScaleUV);
		mWarpGlsl->uniform("uTexWarp", 1 );
		
		gl::ScopedTextureBind texScope( warp, 1 );
		
		shadeRect( buf->getColorTexture(), mWarpGlsl, Rectf( vec2(0), mGelSize ) );

		swap( buf, tmp ); 
	}
	else
	{
		// show we failed to load shader!
		swap( buf, tmp );
		gl::ScopedFramebuffer bandFboScope( buf );
		gl::clear( Color(0,1,1) );		
	}
}

void GelRender::blur( ci::gl::FboRef& fbo, ci::gl::FboRef& fboTemp, int distance )
{
	// Do fewer passes with all the blur shaders
	if ( mBlur5Glsl && mBlur9Glsl && mBlur13Glsl )
	{
		ci::gl::GlslProgRef kernels[3] =
		{
			mBlur5Glsl,
			mBlur9Glsl,
			mBlur13Glsl
		};
		
		const auto oldglsl = gl::context()->getGlslProg();

		int activekernel = 0; // 1, 2, 3

		int steps = distance;
		
		ci::gl::GlslProgRef glsl;
	
		while ( steps > 0 )
		{		
			// pick shader; switch?
			int kernel = min( steps, 3 ); // max kernel size
			
			if ( kernel != activekernel )
			{
				glsl = kernels[kernel-1];
				gl::context()->bindGlslProg( glsl );
				activekernel = kernel;
			}

			// do it
			for( int i=0; i<2; ++i ) // 2x, for horizontal + vertical decomposition
			{
				swap( fbo, fboTemp );

				gl::ScopedFramebuffer bandFboScope( fbo );

				glsl->uniform("uBlurResolution", vec2(mGelSize) );
				glsl->uniform("uBlurDirection",  (i%2) ? vec2(0,1) : vec2(1,0) );
				
				shadeRect( fboTemp->getColorTexture(), glsl, Rectf( vec2(0), mGelSize ) );		
			}
						
			// decrement
			steps -= kernel;
		}
		
		//
		gl::context()->bindGlslProg(oldglsl);
	}
	// This works and should be fine; just use 1px blur shader 
	else if ( mBlur5Glsl )
	{
		gl::ScopedGlslProg glslScope( mBlur5Glsl );

		for( int i=0; i<distance*2; ++i ) // 2x, for horizontal + vertical decomposition
		{
			swap( fbo, fboTemp );

			gl::ScopedFramebuffer bandFboScope( fbo );

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
	// TODO: replace with my own VBO w a unit square and just use model transform, not this other sillyness.
	
	Rectf texRect( vec2(0.f,1.f), vec2(1.f,0.f) );
	
	gl::ScopedTextureBind texScope( texture, 0 );
//	gl::ScopedGlslProg glslScope( glsl );
	glsl->uniform( "uTex0", 0 );
	glsl->uniform( "uPositionOffset", dstRect.getUpperLeft() );
	glsl->uniform( "uPositionScale", dstRect.getSize() );
	glsl->uniform( "uTexCoordOffset", texRect.getUpperLeft() );
	glsl->uniform( "uTexCoordScale", texRect.getSize() );
		// most of these uniforms are redundant, but whatever.
		
	auto ctx = gl::context();

	gl::ScopedVao vaoScp( ctx->getDrawTextureVao() );
	gl::ScopedBuffer vboScp( ctx->getDrawTextureVbo() );

	ctx->setDefaultShaderVars();
	ctx->drawArrays( GL_TRIANGLE_STRIP, 0, 4 );		
}

ci::gl::TextureRef GelRender::get1dTex( ci::Surface8uRef s ) const
{
	assert( s->getHeight() == 1 );
	
	// dump old? (different size)
	if ( m1dTex && m1dTex->getWidth() != s->getWidth() )
	{
		m1dTex = 0;
	}
	
	if ( m1dTex )
	{
		// update old
		m1dTex->update(*s);
	}
	else	
	{
		// make new?
		m1dTex = gl::Texture::create(*s); 
	}
	
	return m1dTex;
}
