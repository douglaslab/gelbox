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

const float kSliderIconGutter = 12;
const vec2  kSliderIconNotionalSize(26,26); // for layout purposes; they can be different sizes
const float kSliderLineLength = 133;

const float kIntersliderVStep  = 56;
const float kVStepToFirstSliderLine = 42;

const float kSliderGraphHeight = 32.f;

const float kVStepToColors = 42; 

const float kMinBases = 1;
const float kMaxBases = GelSim::kBaseCountHigh;

const float kMaxAspectRatio = 16.f;

const int kNumMultimerNotches = 7;

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
	mColorsView->mDidPushValue = [this](){ fragmentDidChange(); }; 
	mColorsView->mSetter = [this]( Color c ){
		getEditFragment().mColor = c;
	};
	mColorsView->mGetter = [this](){
		return getEditFragment().mColor;
	};
	
	// sliders
	{
		// icon loading helper
		fs::path iconPathBase = getAssetPath("slider-icons");
		
		auto loadIcons = [iconPathBase]( Slider& s, string name )
		{
			s.mIconSize[0] = s.mIconSize[1] = kSliderIconNotionalSize; // does't really matter unless it fails to load
			
			s.loadIcons(
				iconPathBase / (name + "-lo.png"),
				iconPathBase / (name + "-hi.png")
				);
		};
		
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
		
		size.mValueMappedLo = kMinBases;
		size.mValueMappedHi = kMaxBases;
		size.mValueQuantize = 100;
		size.mSetter = [this]( float v ) {
			getEditFragment().mBases = roundf(v);  
		};
		size.mGetter = [this]() {
			return getEditFragment().mBases; 
		};
		size.mMappedValueToStr = []( float v )
		{
			return addCommasToNumericStr( toString(v) ) + " bp";
		};
		
		concentration.mValueMappedLo = 0.f;
		concentration.mValueMappedHi = GelSim::kSampleMassHigh;
		concentration.mSetter = [this]( float v ) {
			getEditFragment().mMass = v;
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
		aspect.mValueMappedHi = kMaxAspectRatio;
		aspect.mSetter = [this](float v ) {
			getEditFragment().mAspectRatio = v;  
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
			aggregate.addFixedNotches( kNumMultimerNotches );
			aggregate.mNotchAction = Slider::Notch::DrawOnly;
		}
				
		aggregate.addNotchAtMappedValue(0.f);
		aggregate.addNotchAtMappedValue(1.f);
		aggregate.mNotchSnapToDist = 8.f;
		aggregate.mNotchAction = Slider::Notch::Snap;
		aggregate.mValueQuantize = .05f;
		
		aggregate.mValueMappedLo = 1;
		aggregate.mValueMappedHi = kNumMultimerNotches;
		
		aggregate.mIsGraph = true;
		aggregate.mGraphValues.resize( kNumMultimerNotches );
		aggregate.mGraphHeight = kSliderGraphHeight; 
		for( float &x : aggregate.mGraphValues ) x = randFloat(); // test data		
		
		aggregate.mGraphSetter = [this]( std::vector<float> v ) {
			getEditFragment().mAggregate = v;  
		};
		aggregate.mGraphGetter = [this]()
		{
			if ( getEditFragment().mAggregate.empty() )
			{
				// default value
				vector<float> v = std::vector<float>(kNumMultimerNotches,0.f);
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
		};
		degrade.mGetter = [this]() {
			return getEditFragment().mDegrade; 
		};
		degrade.addFixedNotches(3);
		degrade.mNotchAction = Slider::Notch::Snap;
		
		// load icons
		loadIcons( size, "size" );
		loadIcons( concentration, "concentration" );
		loadIcons( aspect, "aspect" );
		loadIcons( aggregate, "multimer" );
		loadIcons( degrade, "degrade" );

		// flip individual items (after icons + everything loaded!)
//		size.flipXAxis();
//		aggregate.flipXAxis();
		
		// insert
		auto add = [this]( Slider s )
		{
			s.mDidPushValue = [this]()
			{
				this->fragmentDidChange();
			};
			
			SliderViewRef v = make_shared<SliderView>(s);
			
			v->setParent( shared_from_this() );
			
			mSliders.push_back(v);
		};
		
		add(size);
		add(concentration);
		add(aspect);
		add(aggregate);
		add(degrade);
		
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
	
	// sliders
	float sliderx[2] = {
		getBounds().getCenter().x - kSliderLineLength/2,
		getBounds().getCenter().x + kSliderLineLength/2
	};
	
	for( int i=0; i<mSliders.size(); ++i )
	{
		Slider  s = mSliders[i]->getSlider();

		float slidery = kVStepToFirstSliderLine + (float)i * kIntersliderVStep;
		
		s.mEndpoint[0] = vec2( sliderx[0], slidery );
		s.mEndpoint[1] = vec2( sliderx[1], slidery );
		
		vec2 offset = vec2(kSliderIconNotionalSize.x/2+kSliderIconGutter,0);
		
		for( int i=0; i<2; ++i )
		{
			s.mIconRect[i] = Rectf( vec2(0,0), s.mIconSize[i] );
			s.mIconRect[i].offsetCenterTo( s.mEndpoint[i] + offset * ( i ? 1.f : -1.f ) );
			s.mIconRect[i] = snapToPixel(s.mIconRect[i]);
		}

		// pick rect
		for ( int i=0; i<2; ++i )
		{
			vec2 c = s.mIconRect[i].getCenter();
			s.mIconPickRect[i] = Rectf( c - kSliderIconNotionalSize/2.f, c + kSliderIconNotionalSize/2.f );
		}
		
		// shift graph endpoints -- after we've layed out icons with proper endpoints
		if (s.mIsGraph)
		{
			float d = s.mGraphHeight * .5f;
			s.mEndpoint[0].y += d;
			s.mEndpoint[1].y += d;
		}
		
		mSliders[i]->setSlider(s);
	}

	// colors
	if (mColorsView)
	{
		vec2 colorsSize = kColorSize * vec2( mColorsView->mColorCols, mColorsView->mColors.size()/mColorsView->mColorCols );
		vec2 tl;
		
		tl.y = kVStepToFirstSliderLine + (float)(mSliders.size()-1) * kIntersliderVStep + kVStepToColors;
		tl.x = getBounds().getWidth()/2 - colorsSize.x/2;
		
		Rectf r( tl, tl + colorsSize );
		
//		mColorsView->setFrameAndBoundsWithSize(r);
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