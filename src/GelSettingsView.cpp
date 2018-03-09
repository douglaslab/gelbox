//
//  GelSettingsView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 3/6/18.
//

#include "GelSettingsView.h"
#include "GelView.h"
#include "Gel.h"
#include "SliderView.h"
#include "GelSim.h"
#include "Layout.h"
#include "BufferView.h"

using namespace std;
using namespace ci;

void GelSettingsView::setup( GelViewRef gelView )
{
	mGelView = gelView;

	mBraceTex = kLayout.uiImage("brace.png");
	
	makeSliders();
	
	mBufferView = make_shared<BufferView>();
	mBufferView->setup();
	mBufferView->setParent( shared_from_this() );
	mBufferView->setGel( gelView->getGel() );
	mBufferView->setGelView( gelView );
	mBufferView->setFrameAndBoundsWithSize(
		Rectf( vec2(0.f), kLayout.mBufferViewSize )
		+ kLayout.mGelViewBufferViewTopLeft
		);

	mHeadingTex = kLayout.renderHead(kLayout.mGelSettingsHeaderStr);

	layout();
}

void GelSettingsView::makeSliders()
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
	Slider damage;
	damage.mValue = 0.f;
	add( damage, "well-damage" );
	
	add( Slider(), "gel-rotate" );
	add( Slider(), "gel-lanes" );
}

void GelSettingsView::close()
{
	if (getCollection()) getCollection()->removeView(shared_from_this());
}

void GelSettingsView::setBounds( ci::Rectf r )
{
	View::setBounds(r);
	layout();
}

void GelSettingsView::layout()
{
	mBraceRect = kLayout.layoutBrace( getBounds() );	

	SliderView::layoutSlidersInWidth(
		mSliders,
		kLayout.mGelSettingsSlidersTopLeft,
		kLayout.mFragViewSlidersVOffset,
		kLayout.mFragViewSlidersWidth,
		kLayout.mFragViewSlidersIconGutter,
		kLayout.mFragViewSliderIconNotionalSize
		);

	if (mHeadingTex) {
		mHeadingRect = kLayout.layoutHeadingText( mHeadingTex, kLayout.mGelSettingsHeaderBaselinePos );
	}
}

void GelSettingsView::draw()
{
	if (mBraceTex)
	{
		gl::color(1,1,1,1);
		gl::draw(mBraceTex,mBraceRect);
	}
	
	gl::color( kLayout.mRuleColor );
	gl::drawLine(
		kLayout.mGelSettingsRuleTopLeft,
		kLayout.mGelSettingsRuleTopLeft + vec2(kLayout.mGelSettingsRuleLength,0.f) );

	if (mHeadingTex)
	{
		gl::color(1,1,1);
		gl::draw(mHeadingTex,mHeadingRect);
	}
}
