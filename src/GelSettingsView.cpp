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
#include "Config.h"
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

Slider GelSettingsView::getTimelineSlider( GelViewRef gelView )
{
	Slider s;

	s.mValueMappedLo = 0;
	s.mValueMappedHi = 1.f; // gel sim tracks time from 0..1
	s.mSetter = [gelView]( float v ) {
		gelView->getGel()->setTime(v);
		gelView->gelDidChange();
	};
	s.mGetter = [gelView]() {
		return gelView->getGel()->getTime();
	};
	s.mMappedValueToStr = []( float v )
	{
		v *= GelSim::kTuning.mSliderTimelineMaxMinutes;
		
		int m = roundf(v); // we get fractional values, so fix that.
		
		int mins = m % 60;
		int hrs  = m / 60;
		
		string minstr = toString(mins);
		if (minstr.size()==1) minstr = string("0") + minstr;
		
		return toString(hrs) + ":" + minstr ;
	};

	s.loadIcons(
		kLayout.sliderIconPath() / ("clock-lo.png"),
		kLayout.sliderIconPath() / ("clock-hi.png")
		); 
	
	s.pullValueFromGetter();
	
	return s;
}

void GelSettingsView::makeSliders()
{
	auto addSlider = [this]( Slider s )
	{
		auto sv = make_shared<SliderView>(s);
		sv->setParent( shared_from_this() );
		
		mSliders.push_back(sv);		
	};
	
	auto add = [this,addSlider]( Slider &s, std::string iconprefix )
	{
		fs::path iconPathBase = kLayout.sliderIconPath();
		s.loadIcons(
			iconPathBase / (iconprefix + "-lo.png"),
			iconPathBase / (iconprefix + "-hi.png")
			); 
		
		s.pullValueFromGetter();
		
		addSlider(s);
	};
	
	// voltage slider
	{
		Slider s;

		s.mValueMappedLo = GelSim::kTuning.mSliderVoltageLow;
		s.mValueMappedHi = GelSim::kTuning.mSliderVoltageHigh;
		s.mValueQuantize = 1.f;
		
		s.mNotchAction = Slider::Notch::Snap;
//		s.addFixedNotches(2);
		s.addNotchAtMappedValue(GelSim::kTuning.mSliderVoltageDefaultValue);
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
	if ( ! kConfig.mTimelineBelowGel )
	{
		addSlider( getTimelineSlider(mGelView) );
	}
	
	Slider damage;
	damage.mValueMappedLo = 0;
	damage.mValueMappedHi = 1.f; // gel sim tracks time from 0..1
	damage.mValue = 0.f;
	damage.mSetter = [this]( float v ) {
		mGelView->getGel()->setWellDamage(v);
		mGelView->gelDidChange();
	};
	damage.mGetter = [this]() {
		return mGelView->getGel()->getWellDamage();
	};
	add( damage, "well-damage" );
	
	// unwired placeholder sliders...
	Slider rotate;
	rotate.mEnabled = false;
	rotate.mValueMappedLo = -GelSim::kTuning.mSliderGelRotateMax;
	rotate.mValueMappedHi =  GelSim::kTuning.mSliderGelRotateMax;
	rotate.mValue = .5f;
	rotate.addFixedNotches(3);
	rotate.mNotchAction = Slider::Notch::Snap;
	add( rotate, "gel-rotate" );
	
	Slider numlanes;
//	numlanes.mEnabled = false;
	numlanes.mValueMappedLo = GelSim::kTuning.mSliderNumLanesMin;
	numlanes.mValueMappedHi = GelSim::kTuning.mSliderNumLanesMax;
	numlanes.mValue = 0.f;
//	numlanes.addFixedNotches(GelSim::kTuning.mSliderNumLanesMax - GelSim::kTuning.mSliderNumLanesMin + 1);
//	numlanes.mNotchAction = Slider::Notch::Nearest;
	numlanes.mValueQuantize = 1.f;
	numlanes.mSetter = [this]( float v ) {
		mGelView->getGel()->setNumLanes(v);
		mGelView->gelDidChange();
	};
	numlanes.mGetter = [this]() {
		return mGelView->getGel()->getNumLanes();
	};
	numlanes.mMappedValueToStr = []( float v )
	{
		return toString(v) /*+ " lanes"*/;
	};

	add( numlanes, "gel-lanes" );
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
