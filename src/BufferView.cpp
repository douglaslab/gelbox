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
			return toString( roundf(v) ) + " mM ";
		};
		
		s.mStyle = Slider::Style::Bar;
		
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
		
		syncWidgetsToModel();
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
		
		syncWidgetsToModel();
	}
}

void BufferView::modelDidChange()
{
	syncWidgetsToModel();
	
	// notify other views...
	if (mGelView)
	{
		if (mSample) mGelView->sampleDidChange(mSample);
		if (mGel)    mGelView->gelDidChange();
	}
}

void BufferView::syncWidgetsToModel()
{
	// kind of unnecessary, but we do it so that immediately can respond to selection
	// change and not for next tick in sliders/colors :P
	for( SliderViewRef v : mSliders )
	{
		if (v) v->slider().pullValueFromGetter();
	}
}

void BufferView::draw()
{
	if ( kLayout.mDebugDrawLayoutGuides )
	{
		gl::color(kLayout.mDebugDrawLayoutGuideColor);
		gl::drawStrokedRect(getBounds());
	}
}
