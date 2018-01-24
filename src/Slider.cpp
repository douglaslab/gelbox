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

using namespace std;
using namespace ci;

const Color kSliderLineColor   = Color::hex(0x979797); 
const Color kSliderHandleColor = Color::hex(0x4990E2);
const vec2  kSliderHandleSize  = vec2(16,20);
const float kSliderNotchRadius = 2.5f;

void Slider::draw() const
{
	const auto fontRef = GelboxApp::instance()->getUIFont();
	
	const bool hasHandle = ! mIsGraph;

	// graph
	if ( mIsGraph )
	{
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
		
		gl::color( kSliderHandleColor );
		gl::drawSolid(p);
		gl::color( kSliderHandleColor * .5f );
		gl::draw(p);
	}
		
	// line
	gl::color(kSliderLineColor);
	gl::drawLine(mEndpoint[0], mEndpoint[1]);
	
	// notches
	if ( mNotches>0 && mNotchAction != Slider::Notch::None )
	{
		gl::color( kSliderLineColor * .5f );
		
		float step = 1.f / (float)(mNotches-1);
		
		for( int i=0; i<mNotches; ++i )
		{
			vec2 c = lerp( mEndpoint[0], mEndpoint[1], step * (float)i );
			gl::drawSolidCircle( c, kSliderNotchRadius );
		}
	}
	
	// handle
	if ( hasHandle )
	{
		Rectf sliderHandleRect = calcHandleRect();
		gl::color(kSliderHandleColor);
		gl::drawSolidRect(sliderHandleRect);
		gl::color(kSliderHandleColor*.5f);
		gl::drawStrokedRect(sliderHandleRect);
	}
	
	// icons
	gl::color(1,1,1);	
	gl::draw( mIcon[0], mIconRect[0] );
	gl::draw( mIcon[1], mIconRect[1] );
	
	// text label
	if (mMappedValueToStr)
	{
		string str = mMappedValueToStr( getMappedValue() );
		
		vec2 size = fontRef->measureString(str);

		vec2 baseline;
		
		if (hasHandle)
		{
			Rectf sliderHandleRect = calcHandleRect();
			
			baseline.y = sliderHandleRect.y2 + sliderHandleRect.getHeight() * .75;			
			baseline.x = sliderHandleRect.getCenter().x - size.x/2;
		}
		else
		{
			baseline = lerp( mEndpoint[0], mEndpoint[1], .5f );
			baseline.y += kSliderHandleSize.y * 1.25f;
		}

		gl::color(0,0,0);		
		fontRef->drawString( str, snapToPixel(baseline) );
	}
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
	
	// graph
	mAreGraphValuesReversed = ! mAreGraphValuesReversed;
	mGraphValues = vector<float>( mGraphValues.rbegin(), mGraphValues.rend() );
}

void
Slider::setValueWithMouse ( ci::vec2 p )
{
	Rectf pickRect = calcPickRect();
	
	if ( mIsGraph )
	{
		assert( !mGraphValues.empty() );
		
		float fx = (p.x - mEndpoint[0].x) / (mEndpoint[1].x - mEndpoint[0].x);
		
		int x = roundf( fx * (float)(mGraphValues.size()-1) );
		
		x = constrain( x, 0, (int)mGraphValues.size() );
		
		float fy = (mEndpoint[0].y - p.y) / mGraphHeight;
		
		fy = constrain( fy, 0.f, 1.f );
		
		mGraphValues[x] = fy;
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
	const float kViewSnapDist = 4.f; // in view space

	mValue = constrain( normValue, 0.f, 1.f );
	
	// notched?
	if ( mNotches > 0 )
	{
		switch( mNotchAction )
		{
			case Slider::Notch::Nearest:
				mValue = round( mValue * (float)(mNotches-1) );
				mValue /= (float)(mNotches-1);
				break;
				
			case Slider::Notch::Snap:
			{
				const float nearestNotchNum = round( mValue * (float)(mNotches-1) ); // [ 0, 1, ... mNotches-1 ]
				
				// convert back to local view space
				const float nearestNorm = nearestNotchNum / (float)(mNotches-1);
				
				const float nearestViewX = lerp( mEndpoint[0].x, mEndpoint[1].x, nearestNorm ); 
				
				const float viewDist = fabsf( nearestViewX - lerp( mEndpoint[0].x, mEndpoint[1].x, mValue ) );
				
				// snap?
				if ( kViewSnapDist >= viewDist )
				{
					mValue = nearestNorm;
				} 
			}
			break;
				
			case Slider::Notch::None:
			case Slider::Notch::DrawOnly:
				break;
		}
	}	
}

ci::Rectf
Slider::calcHandleRect() const
{
	Rectf r( vec2(0,0), kSliderHandleSize );
	
	r.offsetCenterTo( lerp(mEndpoint[0],mEndpoint[1],mValue) ); 
	
	return r;
}

ci::Rectf
Slider::calcPickRect() const
{
	Rectf r( mEndpoint[0], mEndpoint[1] );

	if ( mIsGraph ) r.y1 -= mGraphHeight;
	else
	{
		r = Rectf( mEndpoint[0], mEndpoint[1] );
		r.inflate( vec2(0,kSliderHandleSize.y/2) );
	}
	
	return r;
}
