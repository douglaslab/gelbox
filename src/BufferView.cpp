//
//  BufferView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 2/12/18.
//

#include "BufferView.h"
#include "SliderView.h"
#include "GelSim.h"
#include "Sample.h"
#include "Gel.h"
#include "GelView.h"
#include "Layout.h"

using namespace std;
using namespace ci;
using namespace ci::app;

void BufferView::setup()
{
	makeSliders();
	
	Font presetFont( kLayout.mBufferViewPresetsFont, kLayout.mBufferViewPresetsFontSize );
	mPresetLabel.resize(Gelbox::kBufferNumPresets,0);
	for( int i=0; i<Gelbox::kBufferNumPresets; ++i )
	{
		TextLayout label;
		label.clear( ColorA(1,1,1,0) );
		label.setColor( kLayout.mBufferViewPresetsFontColor );
		label.addRightLine(Gelbox::kBufferPresetNames[i]);
		label.setFont( presetFont );
		mPresetLabel[i] = gl::Texture::create(label.render(true));		
	}

	syncPresetToModel();
}

void BufferView::makeSliders()
{
	BufferViewRef sthis = dynamic_pointer_cast<BufferView>( shared_from_this() );

	const fs::path iconPathBase = getAssetPath("slider-icons");

	// buffer params
	Font labelFont( kLayout.mBufferViewSliderLabelFont, kLayout.mBufferViewSliderLabelFontSize );
	
	for( int param=0; param<Gelbox::Buffer::kNumParams; ++param )
	{
		Slider s;
		
		s.mValueMappedLo = 0.f;
		s.mValueMappedHi = Gelbox::kBufferParamMax[param];
		
		s.mSetter = [sthis,param]( float v )
		{
			Gelbox::Buffer b = sthis->getBuffer();
			b.mValue[param] = v;
			sthis->setBuffer(b);
		};
		
		s.mGetter = [sthis,param]()
		{
			return sthis->getBuffer().mValue[param];
		};
		
		s.mMappedValueToStr = [param]( float v )
		{
			const float quantize = .5f;
			return toString( roundf( v / quantize ) * quantize ) + " mM ";
//			return toString(v) + " mM ";
		};
		
		s.mStyle = Slider::Style::Bar;
//		s.mNotchAction = Slider::Notch::Snap;
		// It seems that when we turn on snapping we get a bug where
		// when we select the preset, it takes 2 clicks sometimes to properly set all the values.
		// so turning off for now.
		
//		s.mValueQuantize = .5f; // not 1, because some of interesting values are not @ 1 (eg .5)
		// this is surfacing some weird subtle bug we are going to ignore for now and move on
		// and just roundf in toString()
		// 
		
		s.pullValueFromGetter();
		
		s.mBarFillColor   = kLayout.mBufferViewSliderFillColor;
		s.mBarEmptyColor  = kLayout.mBufferViewSliderEmptyColor;
		s.mTextLabelColor = kLayout.mBufferViewSliderTextValueColor;
		s.mBarCornerRadius= kLayout.mBufferViewSliderCornerRadius;
		
		// load icon
		s.setIcon( 1, kLayout.uiImage( fs::path("molecules"), Gelbox::kBufferParamIconName[param] + ".png" ) );
		
		TextLayout label;
		label.clear( ColorA(1,1,1,1) );
		label.setColor( kLayout.mBufferViewSliderTextLabelColor );
		label.addRightLine(Gelbox::kBufferParamName[param]);
		label.setFont( labelFont ); // should be medium, but maybe that's default
		s.setIcon( 0, gl::Texture::create(label.render()) );
		
		// insert
		SliderViewRef v = make_shared<SliderView>(s);
		
		v->setParent( shared_from_this() );
		
		mSliders.push_back(v);
	}
}

void BufferView::updateLayout()
{
	SliderView::layoutSlidersFromBar(
		mSliders,
		kLayout.mBufferViewSlidersTopLeft,
		kLayout.mBufferViewSliderVOffset,
		kLayout.mBufferViewSliderBarSize,
		kLayout.mBufferViewSlidersIconGutter
		);
		
	mPresetsRect = Rectf( vec2(0.f), kLayout.mBufferViewPresetsSize );
	mPresetsRect += kLayout.mBufferViewPresetsTopLeft;
	
	const int pixelsPerPt = 1;
	
	mPresetLabelRect.resize(Gelbox::kBufferNumPresets);
	for( int i=0; i<Gelbox::kBufferNumPresets; ++i )
	{
		if ( mPresetLabel[i] )
		{
			float x = ((float)i + .5f) / (float)Gelbox::kBufferNumPresets;
			x = lerp( mPresetsRect.x1, mPresetsRect.x2, x );
			
			vec2 c( x, mPresetsRect.getCenter().y );
			
			mPresetLabelRect[i] = Rectf( vec2(0.f), mPresetLabel[i]->getSize() * pixelsPerPt );
			mPresetLabelRect[i] += c - mPresetLabelRect[i].getCenter();
			mPresetLabelRect[i] = snapToPixel(mPresetLabelRect[i]); 
		}
	}	
}

void BufferView::setBufferDataFuncs( tGetBufferFunc getf, tSetBufferFunc setf )
{
	mGetBufferFunc=getf;
	mSetBufferFunc=setf;
}

Gelbox::Buffer BufferView::getBuffer() const
{
	if (mGetBufferFunc) return mGetBufferFunc();
	else return Gelbox::Buffer();
}

void BufferView::setBuffer( Gelbox::Buffer b )
{
	if (mSetBufferFunc)
	{
		mSetBufferFunc(b);
		modelDidChange();
	}
}

void BufferView::setSample( SampleRef s )
{
	if ( s != mSample )
	{
		mSample=s;
		mGel=0;
		
		if (mSample)
		{
			mGetBufferFunc = [this]()
			{
				assert(mSample);
				return mSample->mBuffer;
			};
			
			mSetBufferFunc = [this]( Gelbox::Buffer b )
			{
				assert(mSample);
				mSample->mBuffer=b;
			};
		}
		
		syncPresetToModel();
	}
}

void BufferView::setGel( GelRef g )
{
	if ( g != mGel )
	{
		mSample=0;
		mGel=g;

		if (mGel)
		{
			mGetBufferFunc = [this]()
			{
				assert(mGel);
				return mGel->getBuffer();
			};
			
			mSetBufferFunc = [this]( Gelbox::Buffer b )
			{
				assert(mGel);
				mGel->setBuffer(b);
			};
		}
		
		syncPresetToModel();
	}
}

void BufferView::modelDidChange()
{
	syncPresetToModel();
	
	// notify other views...
	if (mGelView)
	{
		if (mSample) mGelView->sampleDidChange(mSample);
		if (mGel)    mGelView->gelDidChange();
	}
}

void BufferView::syncPresetToModel()
{
	// parse Buffer value...
	auto b = getBuffer();
	
	mPresetSelection = -1;
	// potential problem here is that this gets called as a preset is applied,
	// one slider at a time, which causes us to match = -1 midstream.
	// the problem is solved in setToPreset()
	
	for( int i=0; i<Gelbox::kBufferNumPresets; ++i )
	{
		if ( b == Gelbox::kBufferPresets[i] )
		{
			mPresetSelection = i;
			// DO NOT call setPreset since that will cause us to recurse forever, as it
			// sets model properties, which triggers us to be called.
		}
	}
}

void BufferView::tick( float dt )
{
}

void BufferView::draw()
{
	if ( kLayout.mDebugDrawLayoutGuides )
	{
		gl::color(kLayout.mDebugDrawLayoutGuideColor);
		gl::drawStrokedRect(getBounds());
	}

	// == presets ==
	
	// labels
	for( int i=0; i<Gelbox::kBufferNumPresets; ++i )
	{
		if (i==mPresetSelection)
		{
			Rectf r = mPresetsRect;
			float w = r.getSize().x / (float)Gelbox::kBufferNumPresets;
			r.x1 = r.x1 + w * (float)i;
			r.x2 = r.x1 + w;
			
			gl::color( kLayout.mBufferViewPresetsSelectColor );
			gl::drawSolidRect(r);
		}
		
		if (mPresetLabel[i])
		{
			gl::color(1,1,1);
			gl::draw( mPresetLabel[i], mPresetLabelRect[i] );
		}
	}
	
	// box, lines
	gl::color( kLayout.mBufferViewPresetsColor );
	gl::drawStrokedRoundedRect( mPresetsRect, kLayout.mBufferViewPresetsCornerRadius );
	for( int i=0; i<Gelbox::kBufferNumPresets-1; ++i )
	{
		float x = (float)(i+1) / (float)Gelbox::kBufferNumPresets;
		x = lerp( mPresetsRect.x1, mPresetsRect.x2, x );
		
		gl::drawLine( vec2(x,mPresetsRect.y1), vec2(x,mPresetsRect.y2) );
	}
}

void BufferView::mouseDown( ci::app::MouseEvent e )
{
	int preset = pickPreset( rootToChild(e.getPos()) );
	
	if (preset!=-1) setToPreset(preset);
}

void BufferView::setToPreset( int p )
{
	if ( p < 0 || p >= Gelbox::kBufferNumPresets )
	{
		mPresetSelection = -1;
	}
	else
	{
		mPresetSelection = p;
		auto b = Gelbox::kBufferPresets[mPresetSelection]; // copy it, because syncPresetToModel could clear us
		
		assert( mSliders.size() == Gelbox::Buffer::kNumParams );
		for( int i=0; i<Gelbox::Buffer::kNumParams; ++i )
		{
			mSliders[i]->slider().setMappedValue( b.mValue[i] );
			// NOTE: this triggers modelDidChange() -> syncPresetToModel() to be called
			// when we do each set. That is why we copy b beforehand in case mPresetSelection gets changed

			mSliders[i]->slider().clearNotches();
			mSliders[i]->slider().addNotchAtMappedValue( b.mValue[i] );
		}
	}
}

int  BufferView::pickPreset( ci::vec2 local )
{
	if ( mPresetsRect.contains(local) )
	{
		float f = (local.x - mPresetsRect.x1) / mPresetsRect.getWidth();
		
		return constrain(
			(int)( f * (float)Gelbox::kBufferNumPresets ),
			0,
			Gelbox::kBufferNumPresets-1 ); 
	}
	else return -1;
}
