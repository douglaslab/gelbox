//
//  BufferView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 2/12/18.
//
//

#include "BufferView.h"
#include "Sample.h"
#include "GelSim.h"

using namespace std;
using namespace ci;
using namespace ci::app;


///////
//const float kSliderIconGutter = 12;
//const vec2  kSliderIconNotionalSize(26,26); // for layout purposes; they can be different sizes
//const float kSliderLineLength = 133;
//
//const float kIntersliderVStep  = 56;
//const float kVStepToFirstSliderLine = 42;
// -- for layout consistency, move these values into something else... a Layout.h file?
/////

BufferView::BufferView()
{
}

void BufferView::updateLayout()
{	
#if 0
	mColors = getColorPalette();
	
	mSelectedColor=0;
	
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
		mSliders.push_back(size);
		mSliders.push_back(concentration);
		mSliders.push_back(aspect);
		mSliders.push_back(aggregate);
		mSliders.push_back(degrade);
		
		// flip all?
		const bool reverseAll = false; 
		if (reverseAll) for( auto &s : mSliders ) s.flipXAxis();
	}

	// sliders
	float sliderx[2] = {
		getBounds().getCenter().x - kSliderLineLength/2,
		getBounds().getCenter().x + kSliderLineLength/2
	};
	
	for( int i=0; i<mSliders.size(); ++i )
	{
		Slider &s = mSliders[i];

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
	}
#endif
}

void BufferView::mouseDown( ci::app::MouseEvent e )
{

}

void BufferView::mouseUp ( ci::app::MouseEvent e )
{

}

/*
void BufferView::fragmentDidChange() const
{
	if ( isEditFragmentValid() )
	{
		if (mSampleView) mSampleView->fragmentDidChange(mEditFragment);
	}
}*/

void BufferView::mouseDrag( ci::app::MouseEvent e )
{

}

void BufferView::tick( float dt )
{
	// in case user is editing from elsewhere (?)
//	syncSlidersToModel();
}

void BufferView::draw()
{
	// background + frame
	gl::color(1,1,1);
	gl::drawSolidRect(getBounds());
	gl::color(.5,.5,.5);
	gl::drawStrokedRect(getBounds());
	

}