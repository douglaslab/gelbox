//
//  SampleSettingsView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 3/8/18.
//

#include "SampleSettingsView.h"
#include "Gel.h"
#include "GelView.h"
#include "SliderView.h"
#include "GelSim.h"
#include "Layout.h"
#include "BufferView.h"
#include "SampleView.h"

using namespace std;
using namespace ci;

void SampleSettingsView::setup( SampleViewRef sampleView )
{
	mSampleView = sampleView;

	mBraceTex = kLayout.uiImage("brace.png");
	
	makeSliders();
	
	mBufferView = make_shared<BufferView>();
	mBufferView->setup();
	mBufferView->setParent( shared_from_this() );
	mBufferView->setSample( mSampleView->getSample() );
	mBufferView->setGelView( mSampleView->getGelView() ); // so it can update w changes
	mBufferView->setFrameAndBoundsWithSize( Rectf( vec2(0.f), kLayout.mBufferViewSize ) );

	layout();
}

void SampleSettingsView::makeSliders()
{
	auto add = [this]( Slider s, string iconprefix )
	{
		fs::path iconPathBase = app::getAssetPath("slider-icons");
		s.loadIcons(
			iconPathBase / (iconprefix + "-lo.png"),
			iconPathBase / (iconprefix + "-hi.png")
			); 
		
		s.pullValueFromGetter();
		
		auto sv = make_shared<SliderView>(s);
		sv->setParent( shared_from_this() );
		
		mSliders.push_back(sv);		
	};
	
	// dye dyes
	for( int dye=0; dye<Dye::kCount; ++dye )
	{
		Slider s;
		
//		s.mStyle = Slider::Style::Bar;
		
		s.mValueMappedLo = 0.f;
		s.mValueMappedHi = GelSim::kSliderDyeMassMax;

		SampleSettingsViewRef sthis = dynamic_pointer_cast<SampleSettingsView>( shared_from_this() );
		
		s.mSetter = [sthis,dye]( float v )
		{
			if (sthis->mSampleView && sthis->mSampleView->getSample())
			{
				sthis->mSampleView->getSample()->setDye( dye, v );
				sthis->modelDidChange();
			}
		};
		
		s.mGetter = [sthis,dye]()
		{
			if (sthis->mSampleView && sthis->mSampleView->getSample())
			{
				return sthis->mSampleView->getSample()->getDye(dye);
			}
			else return 0.f;
		};
		
		s.mMappedValueToStr = [dye]( float v )
		{
			return toString(v) + " " + Dye::kNames[dye];
		};
		
		s.pullValueFromGetter();
		
		add(s,Dye::kIconName[dye]);
	}
}

void SampleSettingsView::modelDidChange()
{
	// semantics aren't 100% clear, but this updates the gel and the gel view
	if (mSampleView->getGelView()) {
		mSampleView->getGelView()->sampleDidChange(mSampleView->getSample());
	}
}

void SampleSettingsView::close()
{
	if (getCollection()) getCollection()->removeView(shared_from_this());
}

void SampleSettingsView::setBounds( ci::Rectf r )
{
	View::setBounds(r);
	layout();
}

void SampleSettingsView::layout()
{
	mBraceRect = kLayout.layoutBrace( getBounds() );	

	// position sliders
	SliderView::layoutSlidersInWidth(
		mSliders,
		kLayout.mSampleSettingsSlidersTopLeft,
		kLayout.mFragViewSlidersVOffset,
		kLayout.mFragViewSlidersWidth,
		kLayout.mFragViewSlidersIconGutter,
		kLayout.mFragViewSliderIconNotionalSize
		);
}

void SampleSettingsView::draw()
{
	if (mBraceTex)
	{
		gl::color(1,1,1,1);
		gl::draw(mBraceTex,mBraceRect);
	}
	
	gl::color( kLayout.mRuleColor );
	gl::drawLine(
		kLayout.mSampleSettingsRuleTopLeft,
		kLayout.mSampleSettingsRuleTopLeft + vec2(kLayout.mSampleSettingsRuleLength,0.f) );
}
