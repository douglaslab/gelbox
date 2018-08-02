//
//  GelRender.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 2/23/18.
//
//

#include "GelRender.h"
#include "GelboxApp.h" // for FileWatch

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

void GelRender::setup( glm::ivec2 gelsize, float pixelsPerUnit )
{
	mIsDirty = true;
	
	// sizing params
	mGelSize		= gelsize;
	mPixelsPerUnit	= pixelsPerUnit;
	mOutputSize		= ivec2( vec2(mGelSize) * mPixelsPerUnit );
	
	// fbos
	mCompositeFBO		= gl::Fbo::create( mOutputSize.x, mOutputSize.y );
	mCompositeFBOTemp	= gl::Fbo::create( mOutputSize.x, mOutputSize.y );

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
	auto app = GelboxApp::instance();
	assert(app);
	
	auto loadShader = [app,this]( gl::GlslProgRef &prog, string vert, string frag )
	{
		const fs::path shaderprefix = app->getOverloadedAssetPath() / "shaders";
		
		app->getFileWatch().loadShader(
			shaderprefix / vert,
			shaderprefix / frag, [&prog,this]( gl::GlslProgRef glsl )
			{
				prog = glsl;
				mIsDirty = true;
			});
	};

	loadShader( mBlur5Glsl,"passthrough.vert", "blur5.frag" );	
	loadShader( mBlur9Glsl,"passthrough.vert", "blur9.frag" );	
	loadShader( mBlur13Glsl,"passthrough.vert", "blur13.frag" );	
	loadShader( mWarpGlsl, "passthrough.vert", "warp.frag" );	
	
	// tuning vars
	app->getFileWatch().loadJson( app->getOverloadedAssetPath() / "tuning" / "gel-render.json",
		[this]( const JsonTree& json )
	{
		auto getf = [json]( string key, float& v )
		{
			if ( json.hasChild(key) ) {
				v = json.getChild(key).getValue<float>();
			}
		};

		auto geti = [json]( string key, int& v )
		{
			if ( json.hasChild(key) ) {
				v = json.getChild(key).getValue<int>();
			}
		};
		
//		getf("Overcook.Scale",mTuning.mOvercook.mScale);
		getf("Overcook.NumWaves",mTuning.mOvercook.mNumWaves);
		getf("Overcook.WavelengthMin",mTuning.mOvercook.mWavelengthMin);
		getf("Overcook.WavelengthMax",mTuning.mOvercook.mWavelengthMax);
		getf("Overcook.AmpMin",mTuning.mOvercook.mAmpMin);
		getf("Overcook.AmpMax",mTuning.mOvercook.mAmpMax);
		getf("Overcook.Scale.x",mTuning.mOvercook.mScale.x);
		getf("Overcook.Scale.y",mTuning.mOvercook.mScale.y);

		getf("H2ODistort.Faint",mTuning.mH2ODistort.mFaint);
		getf("H2ODistort.Overcook",mTuning.mH2ODistort.mOvercook);
			
		mIsDirty = true;
	});
}

void GelRender::render()
{
	mIsDirty = false;
	
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
	
	auto brightnessToColor = []( float b ) -> ColorA
	{
		// could be mono-channel
		// we don't care about color until final compositing.
		// use alpha so these things composite together properly
		return ColorA::gray(b,1.f);
//		return ColorA(1.f,1.f,1.f,b);
//		return ColorA(b,b,b,1.f);
	};  
	
	// each
	for( auto band : mBands )
	{
		 ci::Rand randGen(band.mRandSeed);
		 
		// draw band to fbo
		{
			float brightScale = mGlobalWarp.mH2ODistort ? kTuning.mH2ODistort.mFaint : 1.f;
			
			// clear
			gl::ScopedFramebuffer bandFboScope( mBandFBO );
			gl::clear( Color(0,0,0) );

			// smears			
			{
//				gl::ScopedBlend blendScp( GL_SRC_ALPHA, GL_ONE );

				drawSmear( band.mRect, -1, band.mSmearAbove,
					brightnessToColor(band.mSmearBrightnessAbove[0]*brightScale),
					brightnessToColor(band.mSmearBrightnessAbove[1]*brightScale) );
					
				drawSmear( band.mRect, +1, band.mSmearBelow,
					brightnessToColor(band.mSmearBrightnessBelow[0]*brightScale),
					brightnessToColor(band.mSmearBrightnessBelow[1]*brightScale) );			
					// would be nice to have flame in its own texture, so we can
					// just stretch it up, too...
			}
			
			// body
			gl::color( brightnessToColor(band.mBrightness*brightScale) ); 
//			gl::color( Color::gray(band.mBrightness) ); 
			gl::drawSolidRect(band.mRect);

			// flames
			if ( band.mFlameHeight > 0.f )
			{
				drawFlames( band.mRect, band.mFlameHeight, randGen );
			}
		}
		
		// smile
		smileBand( mBandFBO, mBandFBOTemp, band.mRect.x1, band.mRect.x2, band.mSmileHeight, band.mSmileExp );
		
		// damage
		wellDamageBand( mBandFBO, mBandFBOTemp, band.mRect, band.mWellDamage, band.mWellDamageRandSeed );
		
		// blur
		blur( mBandFBO, mBandFBOTemp, (float)band.mBlur * mPixelsPerUnit );		
		
		// composite
		{
			// fbo automatically back to compositeFboScope
			gl::ScopedBlend blendScp( GL_SRC_ALPHA, GL_ONE );
			
			gl::color(band.mColor);
			gl::draw( mBandFBO->getColorTexture(), Rectf( vec2(0.f), mGelSize ) );
		}
	}
	
	// global effects
	overcook( mCompositeFBO, mCompositeFBOTemp,
		mGlobalWarp.mH2ODistort ? kTuning.mH2ODistort.mOvercook : 0.f,
		mGlobalWarp.mRandSeed );
}

void GelRender::drawSmear ( ci::Rectf ir, float direction, float thickness, ColorA cclose, ColorA cfar ) const
{
	if (thickness <= 0.f) return;
	
	// would be nice to have a 1d smear texture we are using
	// that texture should be brighter where we have tall flames (e.g.)
	// just like in our reference material
	
	Rectf r  = ir;
	float hh = 0.f; //ir.getHeight() / 2.f; // overlap into band amount 
	
	if ( direction > 0.f )
	{
		r.y1 = ir.y2 - hh;
		r.y2 = ir.y2 + thickness;
	}
	else
	{
		r.y2 = ir.y1 + hh;
		r.y1 = ir.y1 - thickness;
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
				
				d.x = constrain( d.x, -1.f, 1.f );
				d.y = constrain( d.y, -1.f, 1.f );
				
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
	x1 /= mGelSize.x;
	x2 /= mGelSize.x;
	
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
	
	warp( buf, tmp, get1dTex(s), vec2(height) );
}

void GelRender::wellDamageBand( ci::gl::FboRef& buf, ci::gl::FboRef& tmp, ci::Rectf bandr, float damage, int rseed ) const
{
	// Optimization: per damage level, store a hash of rseed => Textures. discard it when damage changes, or when it gets too big.

	if ( damage <= 0.f ) return;

	// normalize x1,x2
	float x1 = bandr.x1;
	float x2 = bandr.x2;
	x1 /= mGelSize.x;
	x2 /= mGelSize.x;
	
	float w = bandr.getWidth () / mGelSize.x; // normalized 
	
	// generate damage stabs		
	struct stab
	{
		float c;
		float r;
		float h;
		float rinv;
	};
	
	vector<stab> stabs;
	
	int nstabs = max( 1, (int)(damage * 5.f) ); // we know damage >= 0 at this point

	Rand r( rseed );
	
	const float yscale = max( .2f, powf( damage * .25f, .85f ) );
	
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
	warp( buf, tmp, get1dTex(s), vec2(bandr.getHeight()) );
}

void GelRender::warp(
	ci::gl::FboRef& buf,
	ci::gl::FboRef& tmp,
	ci::gl::TextureRef warp,
	vec2			   warpScale ) const
{
	if (mWarpGlsl)
	{
		gl::ScopedFramebuffer bandFboScope( tmp ); // draw to tmp
		gl::ScopedGlslProg glslScope( mWarpGlsl );
		
		
		vec2 warpScaleUV = warpScale / vec2(mGelSize); // with uv 
		
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

				glsl->uniform("uBlurResolution", vec2(mOutputSize) );
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

			mBlur5Glsl->uniform("uBlurResolution", vec2(mOutputSize) );
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

#if 1
// Older not fully tunable overcook effect; looks OK. 
void GelRender::overcook( ci::gl::FboRef& buf, ci::gl::FboRef& tmp, float amount, int rseed )
{
	if ( amount > 0.f )
	{
		ci::Surface8uRef control = makeWarpByFracPos( mOutputSize,
			[=]( vec2 p ) -> vec2
			{
				vec2 c(0.f);

				c.x +=  .45f  * sinf(p.y * .5f * M_PI * 2.f);
				c.y +=  .35f * sinf(p.x * .5f * M_PI * 2.f);
				
				c.x +=  .35f * sinf(p.y * 1.f * M_PI * 2.f);
				c.y +=  .25f * sinf(p.x * 1.f * M_PI * 2.f);

				c.x +=  .2f  * sinf(p.y * 4.f * M_PI * 2.f);
				c.y +=  .2f * sinf(p.x * 4.f * M_PI * 2.f);

	//			c.y += min( 0.f, sinf( p.y * 8.f * M_PI * 2.f) ); // just vertical displacement; wacky
				
				return c;
			});
		
		warp( buf, tmp, get2dTex(control), amount * kTuning.mOvercook.mScale );
	}
}
#else
// Newer, more Photoshop style overcook effect; looks not amazing, doesn't work as desired quite yet.
void GelRender::overcook( ci::gl::FboRef& buf, ci::gl::FboRef& tmp, float amount, int rseed )
{
	if ( amount > 0.f )
	{
		// this is an approximation of the Photoshop wave filter. 
		
//		float scale;
//		vec2  scale2 = kTuning.mOvercook.mScale;
		
//		scale = max( scale2.x, scale2.y );
//		scale2 /= scale;
		
		struct W
		{
			vec2  mPhase;
//			float mLength;
//			float mAmp;
			vec2  mPrescale;
			vec2  mPostscale;
		};
		
		vector<W> waves( kTuning.mOvercook.mNumWaves );
//		const float wnorm = waves.empty() ? 1.f : (1.f / (float)waves.size()); 
		
		Rand rgen(mGlobalWarpRandSeed);
		
		for( auto &w : waves )
		{
			w.mPhase     = vec2( rgen.nextFloat(), rgen.nextFloat() );
			float length = rgen.nextFloat( kTuning.mOvercook.mWavelengthMin, kTuning.mOvercook.mWavelengthMax );
			float amp	 = rgen.nextFloat( kTuning.mOvercook.mAmpMin,		kTuning.mOvercook.mAmpMax );
			w.mPostscale = vec2(amp);
			w.mPrescale  = vec2( (1.f / length) * M_PI * 2.f );
		}
		
		ci::Surface8uRef control = makeWarpByFracPos( mOutputSize,
			[=]( vec2 p ) -> vec2
			{
				vec2 c(0.f);
				
				for( const auto &w : waves )
				{
					vec2 v = (p - w.mPhase) * w.mPrescale;
					
					v.x = sinf( v.y );
					v.y = sinf( v.x );
					
					c += w.mPostscale * v;
				}
				
				return c;
			});
		
		warp( buf, tmp, get2dTex(control), amount * kTuning.mOvercook.mScale );
	}
}
#endif

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

ci::gl::TextureRef GelRender::get2dTex( ci::Surface8uRef s ) const
{
	// dump old? (different size)
	if ( m2dTex && m2dTex->getSize() != s->getSize() )
	{
		m2dTex = 0;
	}
	
	if ( m2dTex )
	{
		// update old
		m2dTex->update(*s);
	}
	else	
	{
		// make new?
		m2dTex = gl::Texture::create(*s); 
	}
	
	return m2dTex;
}
