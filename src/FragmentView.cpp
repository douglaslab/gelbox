//
//  FragmentView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 1/8/18.
//
//

#include "FragmentView.h"
#include "Sample.h"
#include "SampleView.h"
#include "SliderView.h"
#include "ColorPaletteView.h"
#include "GelSim.h"

using namespace std;
using namespace ci;
using namespace ci::app;

const vec2  kColorSize(35,35);

const float kSliderIconGutter = 16;
const float kSliderLength	  = 133 + 26.f*2.f + 24.f;
const float kSliderVGutter    = 56;
const float kSliderFirstGutter = 24;
const float kSliderGraphHeight = 32.f;
const float kSliderColorsGutter = 24; 

const vec2  kSliderIconNotionalSize(26,26); // for layout purposes; they can be different sizes


vector<ci::Color> FragmentView::sColorPalette;

const vector<Color>& FragmentView::getColorPalette()
{
	if ( sColorPalette.empty() )
	{
		sColorPalette = vector<Color>{
			Color::hex(0x0066cc),
			Color::hex(0xcc0000),
			Color::hex(0xf74308),
			Color::hex(0xf7931e),
			Color::hex(0xaaaa00),
			Color::hex(0x57bb00),

			Color::hex(0x007200),
			Color::hex(0x03b6a2),
			Color::hex(0x1700de),
			Color::hex(0x7300de),
			Color::hex(0xb8056c),
			Color::hex(0x333333)
		};
	}
	
	return sColorPalette;
}

ci::Color FragmentView::getRandomColorFromPalette( ci::Rand* r )
{
	return ColorPaletteView::Palette( getColorPalette() ).getRandomColor(r);
}

static string addCommasToNumericStr( string num )
{
	string numc;
	
	// commas
	for( int i=0; i < num.size(); ++i )
	{
		int j = num.size()-i-1;
		
		if ( i && (i%3==0) ) numc = "," + numc;
		
		numc = num[j] + numc;
	}
	
	return numc;
} 

FragmentView::FragmentView()
{
}

void FragmentView::makeSliders()
{
	// colors
	mColorsView = make_shared<ColorPaletteView>();
	mColorsView->setPalette( getColorPalette() );
	mColorsView->setParent( shared_from_this() );
	mColorsView->mSetter = [this]( Color c ){
		getEditFragment().mColor = c;
		fragmentDidChange();
	};
	mColorsView->mGetter = [this](){
		return getEditFragment().mColor;
	};
	
	// sliders
	{
		// this is a little dangerous because we are passing this into all these lambdas.
		// that was when this was one object, and we have since refactored into a bunch of sub-views. so hopefully we all stay alive together!
		// one hack if it becomes a bug is to not capture this, but capture a shared_ptr,
		// which wouldn't solve any underlying problems, but would ensure everyone behaved gracefully under suboptimal conditions. 
		
		// config sliders
		Slider size;
		Slider concentration;
		Slider aspect;
		Slider aggregate;
		Slider degrade;
		
		size.mValueMappedLo = 1;
		size.mValueMappedHi = GelSim::kSliderBaseCountMax;
		size.mValueQuantize = 100;
		size.mSetter = [this]( float v ) {
			getEditFragment().mBases = roundf(v);
			fragmentDidChange();
		};
		size.mGetter = [this]() {
			return getEditFragment().mBases; 
		};
		size.mMappedValueToStr = []( float v )
		{
			return addCommasToNumericStr( toString(v) ) + " bp";
		};
		
		concentration.mValueMappedLo = 0.f;
		concentration.mValueMappedHi = GelSim::kSliderMassMax;
		concentration.mSetter = [this]( float v ) {
			getEditFragment().mMass = v;
			fragmentDidChange();
		};
		concentration.mGetter = [this]() {
			return getEditFragment().mMass; 
		};
		concentration.mMappedValueToStr = []( float v )
		{
			v = roundf(v); // show as whole numbers
			
			return addCommasToNumericStr( toString(v) ) + " ng";
		};

		aspect.mValueMappedLo = 1.f;
		aspect.mValueMappedHi = GelSim::kSliderAspectRatioMax;
		aspect.mSetter = [this](float v ) {
			getEditFragment().mAspectRatio = v; 
			fragmentDidChange();
		};
		aspect.mGetter = [this]() {
			return getEditFragment().mAspectRatio;
		};
		aspect.mMappedValueToStr = []( float v )
		{
			v = roundf(v); // show as whole numbers
			
			return addCommasToNumericStr( toString(v) ) + " : 1";
		};
		

		const bool kDrawGraphAsColumns = true;	
		aggregate.mGraphDrawAsColumns = kDrawGraphAsColumns;
		if ( ! kDrawGraphAsColumns )
		{
			aggregate.addFixedNotches( GelSim::kSliderAggregateMaxMultimer );
			aggregate.mNotchAction = Slider::Notch::DrawOnly;
		}
				
		aggregate.addNotchAtMappedValue(0.f);
		aggregate.addNotchAtMappedValue(1.f);
		aggregate.mNotchSnapToDist = 8.f;
		aggregate.mNotchAction = Slider::Notch::Snap;
		aggregate.mValueQuantize = .05f;
		
		aggregate.mValueMappedLo = 1;
		aggregate.mValueMappedHi = GelSim::kSliderAggregateMaxMultimer;
		
		aggregate.mIsGraph = true;
		aggregate.mGraphValues.resize( GelSim::kSliderAggregateMaxMultimer );
		aggregate.mGraphHeight = kSliderGraphHeight; 
		for( float &x : aggregate.mGraphValues ) x = randFloat(); // test data		
		
		aggregate.mGraphSetter = [this]( std::vector<float> v ) {
			getEditFragment().mAggregate = v;  
			fragmentDidChange();
		};
		aggregate.mGraphGetter = [this]()
		{
			if ( getEditFragment().mAggregate.empty() )
			{
				// default value
				vector<float> v = std::vector<float>(GelSim::kSliderAggregateMaxMultimer,0.f);
				v[0] = 1;
				return v;
			}
			else
			{
				return getEditFragment().mAggregate;
			}
		};
		
		
		degrade.mValueMappedLo = 0.f;
		degrade.mValueMappedHi = 2.f;
		degrade.mSetter = [this]( float v ) {
			getEditFragment().mDegrade = v;  
			fragmentDidChange();
		};
		degrade.mGetter = [this]() {
			return getEditFragment().mDegrade; 
		};
		degrade.addFixedNotches(3);
		degrade.mNotchAction = Slider::Notch::Snap;
		
		// flip individual items (after icons + everything loaded!)
//		size.flipXAxis();
//		aggregate.flipXAxis();
		
		// insert, load icons
		fs::path iconPathBase = getAssetPath("slider-icons");

		auto add = [this,iconPathBase]( Slider s, string name )
		{
			// load icon
			s.loadIcons(
				iconPathBase / (name + "-lo.png"),
				iconPathBase / (name + "-hi.png")
				);
			
			// insert
			SliderViewRef v = make_shared<SliderView>(s);
			
			v->setParent( shared_from_this() );
			
			mSliders.push_back(v);
		};
		
		add( size,			"size" );
		add( concentration, "concentration" );
		add( aspect,		"aspect" );
		add( aggregate,		"multimer" );
		add( degrade,		"degrade" );
		
		// flip all?
		const bool reverseAll = false; 
		if (reverseAll) for( auto v : mSliders )
		{
			v->slider().flipXAxis();
		}
	}
}

void FragmentView::close()
{
	getCollection()->removeView( shared_from_this() );
	// ViewCollection will also remove our children for us
}

void FragmentView::updateLayout()
{
	if ( mSliders.empty() ) makeSliders(); 

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

	// colors
	if (mColorsView)
	{
		vec2 colorsSize = kColorSize * vec2( mColorsView->mColorCols, mColorsView->mColors.size()/mColorsView->mColorCols );
		vec2 tl;
		
		tl.y = mSliders.back()->getFrame().y2 + kSliderColorsGutter;
		tl.x = getBounds().getWidth()/2 - colorsSize.x/2;
		
		Rectf r( tl, tl + colorsSize );
		
		mColorsView->layout(r);
	}
}

void FragmentView::setFragment( SampleRef s, int f )
{
	if ( s != mEditSample || f != mEditFragment )
	{
		mEditSample   = s;
		mEditFragment = f;
		
		syncWidgetsToModel();
	}
}

bool FragmentView::isEditFragmentValid() const
{
	return mEditSample && mEditFragment >= 0 && mEditFragment < mEditSample->mFragments.size();
}

void FragmentView::syncWidgetsToModel()
{
	// kind of unnecessary, but we do it so that immediately can respond to selection
	// change and not for next tick in sliders/colors :P
	if ( isEditFragmentValid() )
	{
		for( SliderViewRef v : mSliders )
		{
			if (v) v->slider().pullValueFromGetter();
		}
		
		if (mColorsView) mColorsView->pullValueFromGetter();
	}
}

void FragmentView::fragmentDidChange() const
{
	if ( isEditFragmentValid() )
	{
		if (mSampleView) mSampleView->fragmentDidChange(mEditFragment);
	}
}

void FragmentView::draw()
{
	// background + frame
	gl::color(1,1,1);
	gl::drawSolidRect(getBounds());
	gl::color(.5,.5,.5);
	gl::drawStrokedRect(getBounds());
}

Sample::Fragment&
FragmentView::getEditFragment()
{
	assert( isEditFragmentValid() );
	
	return mEditSample->mFragments[mEditFragment];
}

const Sample::Fragment&
FragmentView::getEditFragment() const
{
	assert( isEditFragmentValid() );
	
	return mEditSample->mFragments[mEditFragment];
}