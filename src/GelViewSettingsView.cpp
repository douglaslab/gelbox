//
//  GelViewSettingsView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 3/6/18.
//

#include "GelViewSettingsView.h"
#include "GelView.h"
#include "Gel.h"
#include "SliderView.h"
#include "GelSim.h"
#include "Layout.h"

using namespace std;
using namespace ci;

void GelViewSettingsView::setup( GelViewRef gelView )
{
	mGelView = gelView;

	mBraceTex = kLayout.uiImage("brace.png");
	
	makeSliders();

	layout();
}

void GelViewSettingsView::makeSliders()
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
	
	// voltage slider
	{
		Slider s;

		s.mValueMappedLo = GelSim::kSliderVoltageLow;
		s.mValueMappedHi = GelSim::kSliderVoltageHigh;
		s.mValueQuantize = 1.f;
		
		s.mNotchAction = Slider::Notch::Snap;
//		s.addFixedNotches(2);
		s.addNotchAtMappedValue(GelSim::kSliderVoltageDefaultValue);
		s.addNotchAtMappedValue(0.f);
		
		s.mSetter = [this]( float v ) {
			mGelView->getGel()->setVoltage(v);
			mGelView->gelDidChange();
		};
		s.mGetter = [this]() {
			return mGelView->getGel()->getVoltage();
		};
		s.mMappedValueToStr = []( float v )
		{
			return toString(v) + " V";
		};
	
		add(s,"voltage");	
	}
	
	// timeline slider
	{
		Slider s;

		s.mValueMappedLo = 0;
		s.mValueMappedHi = 1.f; // gel sim tracks time from 0..1
		s.mSetter = [this]( float v ) {
			mGelView->getGel()->setTime(v);
			mGelView->gelDidChange();
		};
		s.mGetter = [this]() {
			return mGelView->getGel()->getTime();
		};
		s.mMappedValueToStr = []( float v )
		{
			v *= GelSim::kSliderTimelineMaxMinutes;
			
			int m = roundf(v); // we get fractional values, so fix that.
			
			int mins = m % 60;
			int hrs  = m / 60;
			
			string minstr = toString(mins);
			if (minstr.size()==1) minstr = string("0") + minstr;
			
			return toString(hrs) + ":" + minstr ;
		};
		
		add(s,"clock");
	}
	
	// unwired placeholder sliders...
	add( Slider(), "well-damage" );
	add( Slider(), "gel-rotate" );
	add( Slider(), "gel-lanes" );
}

void GelViewSettingsView::close()
{
	if (getCollection()) getCollection()->removeView(shared_from_this());
}

void GelViewSettingsView::setBounds( ci::Rectf r )
{
	View::setBounds(r);
	layout();
}

void GelViewSettingsView::layout()
{
	mBraceRect = kLayout.layoutBrace( getBounds() );	

	// position sliders
	SliderView::layoutSliders(
		mSliders,
		kLayout.mGelViewSettingsSlidersTopLeft,
		kLayout.mFragViewSlidersVOffset,
		kLayout.mFragViewSlidersWidth,
		kLayout.mFragViewSlidersIconGutter,
		kLayout.mFragViewSliderIconNotionalSize
		);
}

void GelViewSettingsView::draw()
{
	if (mBraceTex)
	{
		gl::color(1,1,1,1);
		gl::draw(mBraceTex,mBraceRect);
	}
	
	gl::color( kLayout.mRuleColor );
	gl::drawLine(
		kLayout.mGelViewSettingsRuleTopLeft,
		kLayout.mGelViewSettingsRuleTopLeft + vec2(kLayout.mGelViewSettingsRuleLength,0.f) );
}
