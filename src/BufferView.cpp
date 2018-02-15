//
//  BufferView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 2/12/18.
//

#include "BufferView.h"
#include "SliderView.h"
#include "GelSim.h"

using namespace std;
using namespace ci;
using namespace ci::app;

const float kSliderIconGutter = 16;
const float kSliderLength	  = 133 + 26.f*2.f + 24.f;
const float kSliderVGutter    = 56;
const float kSliderFirstGutter = 24;

const vec2  kSliderIconNotionalSize(26,26); // for layout purposes; they can be different sizes
	// all of these duplicate what is in FragmentView.cpp
	// if we reuse, then lets move to a Layout.h file and namespace

const float kParentToBufferViewGutter = 16.f;

BufferView::BufferView()
{
}

void BufferView::makeSliders()
{
	BufferViewRef sthis = dynamic_pointer_cast<BufferView>( shared_from_this() );

	const fs::path iconPathBase = getAssetPath("slider-icons");

	for( int param=0; param<Gelbox::Buffer::kNumParams; ++param )
	{
		Slider s;
		
		s.mValueMappedLo = 0.f;
		s.mValueMappedHi = Gelbox::kBufferParamMax[param];
		
		s.mSetter = [sthis,param]( float v )
		{
			if (sthis->getBuffer()) {
				sthis->getBuffer()->mValue[param] = v; // set
				sthis->bufferDidChange(); // notify
			}
		};
		
		s.mGetter = [sthis,param]()
		{
			if (sthis->getBuffer()) return sthis->getBuffer()->mValue[param];
			else return 0.f;
		};
		
		s.mMappedValueToStr = [param]( float v )
		{
			return toString( roundf(v) ) + " mM " + Gelbox::kBufferParamName[param];
		};
		
		s.pullValueFromGetter();
		
		// load icon
//		string iconName = Gelbox::kBufferParamIconName[param];
//		
//		s.loadIcons(
//			iconPathBase / (iconName + "-lo.png"),
//			iconPathBase / (iconName + "-hi.png")
//			);
		
		// insert
		SliderViewRef v = make_shared<SliderView>(s);
		
		v->setParent( shared_from_this() );
		
		mSliders.push_back(v);
	}
}

BufferViewRef BufferView::openToTheRightOfView( ViewRef parent, Gelbox::BufferRef b )
{
	BufferViewRef v = make_shared<BufferView>();
	
	v->setBuffer(b);
	
	assert(parent);
	
	vec2 tl = parent->getFrame().getUpperRight() + vec2(kParentToBufferViewGutter,0.f);
	tl = parent->snapToPixel(tl);
	
	Rectf f( tl, tl + kBufferViewSize );
	
	v->setFrameAndBoundsWithSize(f);
	
	return v;
}

void BufferView::close()
{
	getCollection()->removeView( shared_from_this() );
	// ViewCollection will also remove our children for us
}

void BufferView::updateLayout()
{
	if (mSliders.empty()) makeSliders();
	
	// position sliders	
	const vec2 topleft = snapToPixel( vec2( getBounds().getCenter().x - kSliderLength/2.f, kSliderFirstGutter ) ); 
		// topleft of first slider
		
	for( int i=0; i<mSliders.size(); ++i )
	{
		Slider  s = mSliders[i]->getSlider();
		
		s.doLayoutInWidth( kSliderLength, kSliderIconGutter, kSliderIconNotionalSize ); 

		mSliders[i]->setSlider(s);
		mSliders[i]->setFrame( mSliders[i]->getFrame() + topleft + vec2(0.f,(float)i * kSliderVGutter) );
	}
}

void BufferView::setBuffer( Gelbox::BufferRef b )
{
	if ( b != mBuffer )
	{
		mBuffer=b;
		
		syncWidgetsToModel();
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

void BufferView::bufferDidChange()
{
//	if ( isEditFragmentValid() )
	{
//		if (mSampleView) mSampleView->fragmentDidChange(mEditFragment);
	}
}

void BufferView::draw()
{
	// background + frame
	gl::color(1,1,1);
	gl::drawSolidRect(getBounds());
	gl::color(.5,.5,.5);
	gl::drawStrokedRect(getBounds());
}