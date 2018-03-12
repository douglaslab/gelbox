//
//  Slider.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 1/24/18.
//
//

#include "GelboxApp.h" // for getUIFont()
#include "Gelbox.h"

#include "Slider.h"
#include "Layout.h"

using namespace std;
using namespace ci;



std::vector<float> lmap( std::vector<float> v, float inMin, float inMax, float outMin, float outMax )
{
	for( auto &f : v ) f = lmap(f,inMin,inMax,outMin,outMax);
	return v;
}

bool Slider::loadIcons( ci::fs::path lo, ci::fs::path hi )
{
	ci::fs::path paths[2] = { lo, hi };
	
	for( int i=0; i<2; ++i )
	{
		try {
			setIcon( i, gl::Texture::create( loadImage(paths[i]), gl::Texture2d::Format().mipmap() ) );
		}
		catch (...)
		{
			cerr << "ERROR Slider::loadIcons failed to load icon " << paths[i] << endl;
		}
	}
	
	return mIcon[0] && mIcon[1];
}

void Slider::setIcon( int i, ci::gl::TextureRef tex, int pixelsPerPoint )
{
	assert( i==0 || i==1 );
	
	mIcon[i] = tex;
	
	if (tex)
	{
		mIconSize[i] = tex->getSize() * pixelsPerPoint;
	}
	else mIconSize[i] = vec2(0.f);
}

void Slider::doLayoutInWidth ( float fitInWidth, float iconGutter, vec2 notionalIconSize )
{
	// calculate notional icon sizes (it's an optional parameter, could be <=0)
	vec2 nsize[2];
	
	for( int i=0; i<2; ++i )
	for( int j=0; j<2; ++j )
	{
		if (notionalIconSize[j]>0.f) nsize[i][j] = notionalIconSize[j];
		else nsize[i][j] = mIconSize[i][j];
	}

	// figure out cy -- y for center bar we are aligning on
	float cy = max( nsize[0].y, nsize[1].y ) * .5f;	
	
	// make pick icon rect at notional position
	mIconPickRect[0] = Rectf( vec2(0,0), nsize[0] ) + snapToPixel( vec2( 0.f, cy - nsize[0].y / 2.f ) );
	mIconPickRect[1] = Rectf( vec2(0,0), nsize[1] ) + snapToPixel( vec2( fitInWidth - nsize[1].x, cy - nsize[1].y / 2.f ) );
	
	// use that notional/pick rect for endpoint position 
	mEndpoint[0] = snapToPixel( vec2( mIconPickRect[0].x2 + iconGutter, cy ) );
	mEndpoint[1] = snapToPixel( vec2( mIconPickRect[1].x1 - iconGutter, cy ) );
	
	// adjust endpoints for graph layout
	if (mStyle==Style::Graph)
	{
		float d = mGraphHeight * .5f;
		mEndpoint[0].y += d;
		mEndpoint[1].y += d;
	}
	
	// now, make mIconRect[] properly fit the icon we have
	for ( int i=0; i<2; ++i )
	{
		mIconRect[i] = mIconPickRect[i];
		vec2 c = mIconRect[i].getCenter();
		vec2 e = mIconSize[i] / 2.f;
		mIconRect[i] = Rectf( c - e, c + e );
		mIconRect[i] = snapToPixel(mIconRect[i]);
		
		// expand pick rect if needed
		mIconPickRect[i].include(mIconRect[i]);
	}
	
	// make up a bar rect...
	mBar = Rectf( mEndpoint[0], mEndpoint[1] );
}

void Slider::doLayoutFromBar( ci::vec2 barSize, float iconGutter )
{
	mBar = Rectf( vec2(0.f), barSize );
	
	mEndpoint[0] = vec2(0.f,barSize.y/2.f);
	mEndpoint[1] = vec2(barSize.x,barSize.y/2.f);
	
	float cy = mBar.getCenter().y;
	
	mIconRect[0] = Rectf( vec2(0.f), mIconSize[0] );
	mIconRect[1] = Rectf( vec2(0.f), mIconSize[1] );
	
	mIconRect[0] += vec2(mBar.x1,cy) + vec2(-iconGutter,0.f) - vec2(mIconRect[0].x2,mIconRect[0].getCenter().y);
	mIconRect[1] += vec2(mBar.x2,cy) + vec2( iconGutter,0.f) - vec2(mIconRect[1].x1,mIconRect[1].getCenter().y);
	
	for( int i=0; i<2; ++i )
	{
		mIconRect[i] = snapToPixel(mIconRect[i]);
		mIconPickRect[i] = mIconRect[i];
	}
}

void Slider::draw( int highlightIcon ) const
{
	// graph
	switch ( mStyle )
	{
		case Style::Graph:
			drawGraph();
			break;
			
		case Style::Slider:
		{
			gl::color(kLayout.mSliderLineColor);
			vec2 o(0.f,0.5f); // this is to get us pixel-aligned so we don't stroke between pixels
			gl::drawLine(mEndpoint[0]+o, mEndpoint[1]+o);
		}
		break;
			
		case Style::Bar:
		{
			auto fill = [this]( Rectf r )
			{
				float c = mBarCornerRadius;
				
				if (c<=0.f) gl::drawSolidRect(r);
				else
				{
					c = min( c, min(r.getWidth(),r.getHeight())/2.f );
					gl::drawSolidRoundedRect(r,c);
				}
			};			

			gl::color( mBarEmptyColor );
			fill(mBar);
			
			// draw fill
			Rectf f = mBar;
			f.x2 = lerp( f.x1, f.x2, mValue );
			gl::color( mBarFillColor );
			fill(f);
		}
		break;
	}
	
	// notches
	drawNotches();
	
	// handle (in practice, only on Style::Slider)
	if ( hasHandle() )
	{
		const float ck = 4.f;
		Rectf sliderHandleRect = calcHandleRect();
		sliderHandleRect = snapToPixel(sliderHandleRect);
		sliderHandleRect.inflate( vec2(-.5f) ); // pixel align for stroke
		gl::color(0,0,0,.15f);
		gl::drawSolidRoundedRect(sliderHandleRect+vec2(0.f,3.f),ck);
		gl::color(kLayout.mSliderHandleColor);
		gl::drawSolidRoundedRect(sliderHandleRect,ck);
		gl::color(kLayout.mSliderHandleColor*.5f);
		gl::drawStrokedRoundedRect(sliderHandleRect,ck);
	}
	
	// icons
	for( int i=0; i<2; ++i )
	{
		if (i==highlightIcon) gl::color( Color::gray(.5f) );
		else gl::color(1,1,1);
		gl::draw( mIcon[i], mIconRect[i] );
		
		if (kLayout.mDebugDrawLayoutGuides)
		{
			gl::color( kLayout.mDebugDrawLayoutGuideColor );
			gl::drawStrokedRect( mIconPickRect[i] );
		}		
	}
	
	// text label
	drawTextLabel();
}

void Slider::drawGraph() const
{
	if (mGraphDrawAsColumns)
	{
		// max line
		gl::color( .9f, .9f, 1.f );
		gl::drawLine( mEndpoint[0] - vec2(0,mGraphHeight), mEndpoint[1] - vec2(0,mGraphHeight) );
		
		// discrete columns
		const float w = (mEndpoint[1].x - mEndpoint[0].x) / (float)(mGraphValues.size());

		for( int i=0; i<mGraphValues.size(); ++i )
		{
			vec2 ll = mEndpoint[0] + vec2( w * (float)i, 0.f ); 
			
			float h = mGraphValues[i] * mGraphHeight;
			
			Rectf r( ll, ll + vec2(w,-h) );
			gl::color( kLayout.mSliderHandleColor );
			gl::drawSolidRect( r.inflated(vec2(-1.f,0)) );
			
			gl::color( kLayout.mSliderLineColor );
			gl::drawLine( r.getUpperLeft() + vec2(1,0), r.getUpperRight() - vec2(1,0) );
		}

		// score lines
		if ( (0) && mGraphValues.size() > 2 )
		{
			gl::color( 1,1,1 );

			for( int i=0; i<mGraphValues.size(); ++i )
			{
				float xf = (float) i * (1.f / (float)(mGraphValues.size()));
				
				vec2 b = lerp( mEndpoint[0], mEndpoint[1], xf );
				
				gl::drawLine( b, b - vec2(0,mGraphHeight) );
			}
		}
		
		// 
	}
	else
	{
		// single bounding poly
		const float stepx = 1.f / (float)(mGraphValues.size()-1);
		
		// build poly
		PolyLine2 p;
		
		p.push_back(mEndpoint[0]);
		
		for( int i=0; i<mGraphValues.size(); ++i )
		{
			vec2 o = lerp( mEndpoint[0], mEndpoint[1], stepx * (float)i );
			
			o.y -= mGraphValues[i] * mGraphHeight; 
			
			p.push_back(o);
		}
		
		p.push_back(mEndpoint[1]);
		
		
		// draw it
		gl::color( ColorA( Color::gray(.5f), .5f ) );
		gl::drawStrokedRect( calcPickRect() );
		
		gl::color( kLayout.mSliderHandleColor );
		gl::drawSolid(p);
		gl::color( kLayout.mSliderHandleColor * .5f );
		gl::draw(p);
	}
}

void Slider::drawTextLabel() const
{
	if (mMappedValueToStr)
	{
		const auto fontRef = GelboxApp::instance()->getUIFont();
		
		string str = mMappedValueToStr( getMappedValue() );
		
		vec2 size = fontRef->measureString(str);

		vec2 baseline;
		
		switch( mStyle )
		{
			case Style::Slider:
			{
				Rectf sliderHandleRect = calcHandleRect();
				
				baseline.y = sliderHandleRect.y2 + sliderHandleRect.getHeight() * .75;			
				baseline.x = sliderHandleRect.getCenter().x - size.x/2;
			}
			break;
				
			case Style::Bar:
			{
				const vec2 kGutter(8.f,8.f); // hard-coded constant :P
				
				baseline.y = mBar.y2 - kGutter.y;
				baseline.x = lerp(mEndpoint[0],mEndpoint[1],mValue).x;
				
				if ( mValue > .5f )
				{
					baseline.x -= kGutter.x;
					baseline.x -= fontRef->measureString(str).x;
				}
				else baseline.x += kGutter.x;
			}
			break;
			
			case Style::Graph:
			{
				// ??? not logical, but draw it as requested
				baseline = lerp( mEndpoint[0], mEndpoint[1], .5f );
				baseline.y += kLayout.mSliderHandleSize.y * 1.25f;
			}
			break;
		}

		gl::color(mTextLabelColor);		
		fontRef->drawString( str, snapToPixel(baseline) );
	}
}

void Slider::drawNotches() const
{
	if ( !mNotches.empty() && mNotchAction != Slider::Notch::None && mStyle!=Style::Graph )
		// we could draw graph notches on y axis if we wanted...
	{		
		for( float v : mNotches )
		{
			vec2 c = lerp( mEndpoint[0], mEndpoint[1], v );
			c = snapToPixel(c);

			if ( mStyle==Style::Bar )
			{
				// line
				gl::color( mBarFillColor * .8f );
//				const float k = mBar.getHeight()/2.f - mBarCornerRadius;
//				const float k = -mBarCornerRadius;
				const float k = 0.f;
				gl::drawLine( vec2(c.x-.5f,mBar.y1+k), vec2(c.x-.5f,mBar.y2-k) );
//				gl::drawLine( vec2(c.x+.5f,mBar.y1), vec2(c.x+.5f,mBar.y2) );
//				gl::drawSolidCircle( vec2(c.x,mBar.y1), kLayout.mSliderNotchRadius );
//				gl::drawSolidCircle( vec2(c.x,mBar.y2), kLayout.mSliderNotchRadius );
			}
			else
			{
				// ball
				gl::color( kLayout.mSliderLineColor * .5f );
				gl::drawSolidCircle( c, kLayout.mSliderNotchRadius );
			}
		}
	}
}

float Slider::calcNormalizedValue( float mappedValue ) const
{
	return lmap( mappedValue, mValueMappedLo, mValueMappedHi, 0.f, 1.f );
}

float Slider::getMappedValue() const
{
	float v = ci::lerp( mValueMappedLo, mValueMappedHi, mValue );
	
	// quantization hack...
	// because of some numerical imprecision, we quantize AGAIN before
	// pushing value back.
	// might have been better to track mValue in units user cares about, not 0..1,
	// but it's not worth rewriting this whole thing right now
	v = quantize( v, mValueQuantize );
	//
	
	return v;
}

void Slider::flipXAxis()
{
	// typical slider stuff
	swap( mIconRect[0], mIconRect[1] );
	swap( mIcon[0], mIcon[1] );
	swap( mIconSize[0], mIconSize[1] );
	swap( mEndpoint[0], mEndpoint[1] );
	swap( mValueMappedLo, mValueMappedHi );
	mValue = 1.f - mValue;
	
	// BUG if icons are different sizes I think we're hosed and need to redo layout
	// we need to swap icon rects, but recenter them or something?
	
	// graph
	mAreGraphValuesReversed = ! mAreGraphValuesReversed;
	mGraphValues = vector<float>( mGraphValues.rbegin(), mGraphValues.rend() );
}

void Slider::addFixedNotches( int numNotches )
{
	mNotches.clear();
	
	if (numNotches<2) return; // no sense make
	
	for( int i=0; i<numNotches; ++i )
	{
		float v = (float)i / (float)(numNotches-1);
		
		mNotches.push_back(v);
	}
}

void Slider::addNotchAtMappedValue( float v )
{
	mNotches.push_back( calcNormalizedValue(v) );
}

float Slider::getNearestNotch( float toNormV ) const
{
	// assuming mNotches unsorted
	
	float d = MAXFLOAT;
	float v = toNormV;
	
	for( int i=0; i<mNotches.size(); ++i )
	{
		float id = fabsf( mNotches[i] - toNormV );
		
		if ( id < d ) {
			d = id;
			v = mNotches[i];
		}
	}
	
	return v;
}

void
Slider::setValueWithMouse ( ci::vec2 p )
{
	Rectf pickRect = calcPickRect();
	
	if ( mStyle==Style::Graph )
	{
		assert( !mGraphValues.empty() );
		
		float fx = (p.x - mEndpoint[0].x) / (mEndpoint[1].x - mEndpoint[0].x);
		
		int x = roundf( fx * (float)(mGraphValues.size()-1) );
		
		x = constrain( x, 0, (int)mGraphValues.size() );
		
		float fy = (mEndpoint[0].y - p.y) / mGraphHeight;
		
		fy = constrain( fy, 0.f, 1.f );
		
		// quantize, snap to notch
		fy = quantizeNormalizedValue( fy, mGraphValueMappedLo, mGraphValueMappedHi, mValueQuantize );
		fy = notch( fy, mEndpoint[0].y, mEndpoint[0].y - mGraphHeight );
		
		mGraphValues[x] = fy;
		
		pushValueToSetter();
	}
	else
	{
		float v = (p.x - pickRect.getX1()) / pickRect.getWidth();
		
		setNormalizedValue(v);
	}
} 

void
Slider::setNormalizedValue( float normValue )
{
	mValue = constrain( normValue, 0.f, 1.f );
	
	// notched?
	mValue = notch( mValue, mEndpoint[0].x, mEndpoint[1].x );
	
	// snap to grid?
	mValue = quantizeNormalizedValue( mValue, mValueMappedLo, mValueMappedHi, mValueQuantize );
	
	// push
	pushValueToSetter();
}

void Slider::setMappedValue( float value )
{
	setNormalizedValue( calcNormalizedValue(value) );
}

float
Slider::notch( float normValue, float v1, float v2 ) const
{
	if ( ! mNotches.empty() )
	{
		switch( mNotchAction )
		{
			case Slider::Notch::Nearest:
				normValue = getNearestNotch(normValue);
				break;
				
			case Slider::Notch::Snap:
			{
				// convert back to local view space
				const float nearestNorm = getNearestNotch(normValue);
				
				const float nearestViewPos = lerp( v1, v2, nearestNorm ); 
				
				const float viewDist = fabsf( nearestViewPos - lerp( v1, v2, normValue ) );
				
				// snap?
				if ( mNotchSnapToDist >= viewDist )
				{
					normValue = nearestNorm;
				} 
			}
			break;
				
			case Slider::Notch::None:
			case Slider::Notch::DrawOnly:
				break;
		}
	}
	
	return normValue;
}

float
Slider::quantize( float value, float quantize ) const
{
	if ( quantize > 0.f )
	{
		value = roundf( value / quantize ) * quantize;
	}
	
	return value;
} 

float
Slider::quantizeNormalizedValue( float valueNorm, float valueMapLo, float valueMapHi, float quantizeMapStep ) const
{
	if ( quantizeMapStep > 0.f )
	{
		float q = quantizeMapStep / (valueMapHi - valueMapLo);
			// normalize q value
		
		valueNorm = quantize( valueNorm, q );
	}
	
	return valueNorm;
}

void Slider::setLimitValue( int v )
{
	if (mStyle==Style::Graph)
	{
		for( float& i : mGraphValues ) i=0.f;
		
		if (v) mGraphValues.back()  = 1.f;
		else   mGraphValues.front() = 1.f;
		
		// push
		pushValueToSetter();
	}
	else setNormalizedValue(v); // 0 => 0.f, 1 => 1.f
}

ci::Rectf
Slider::calcHandleRect() const
{
	Rectf r( vec2(0,0), kLayout.mSliderHandleSize );
	
	r.offsetCenterTo( lerp(mEndpoint[0],mEndpoint[1],mValue) ); 
	
	return r;
}

ci::Rectf
Slider::calcPickRect() const
{
	Rectf r( mEndpoint[0], mEndpoint[1] );

	if ( mStyle==Style::Graph ) r.y1 -= mGraphHeight;
	else
	{
		r = Rectf( mEndpoint[0], mEndpoint[1] );
		r.inflate( vec2(0,kLayout.mSliderHandleSize.y/2) );
	}
	
	return r;
}

ci::Rectf
Slider::calcBounds() const
{
	Rectf r( mEndpoint[0], mEndpoint[1] );
	r.include( calcPickRect() );
	r.include( mIconRect[0] );
	r.include( mIconRect[1] );
	return r;
}

void Slider::pushValueToSetter() const
{
	if (mSetter)
	{
		mSetter( getMappedValue() );
	}
	
	if (mGraphSetter)
	{
		vector<float> gv = lmap( mGraphValues, 0.f, 1.f, mGraphValueMappedLo, mGraphValueMappedHi );
		
		if (mAreGraphValuesReversed) gv = vector<float>( gv.rbegin(), gv.rend() );
		 
		mGraphSetter( gv );
	}
}

void Slider::pullValueFromGetter()
{
	if (mGraphGetter)
	{
		mGraphValues = mGraphGetter();
		
		if (mAreGraphValuesReversed) mGraphValues = vector<float>( mGraphValues.rbegin(), mGraphValues.rend() );
		
		mGraphValues = lmap( mGraphValues, mGraphValueMappedLo, mGraphValueMappedHi, 0.f, 1.f );
	}
	
	if (mGetter)
	{
		float value = mGetter();

		mValue = lmap( value, mValueMappedLo, mValueMappedHi, 0.f, 1.f );
	}
}

int	Slider::pickIcon( ci::vec2 p ) const
{
	if      ( mIconPickRect[0].contains(p) ) return 0;
	else if ( mIconPickRect[1].contains(p) ) return 1;
	else return -1;
}
