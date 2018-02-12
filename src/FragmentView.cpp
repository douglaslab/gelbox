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
#include "GelSim.h"

using namespace std;
using namespace ci;
using namespace ci::app;

const vec2  kColorSize(35,35);
const float kSelectedColorStrokeWidth = 4.f;
const Color kSelectedColorStrokeColor(0,0,0);


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
	int i;
	
	if (r) i = r->nextInt();
	else i = randInt();
	
	auto colors = getColorPalette();
	
	return colors[ i % colors.size() ];
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
		
		
		aggregate.addFixedNotches( kNumMultimerNotches );
		aggregate.mNotchAction = Slider::Notch::DrawOnly;
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
}

void FragmentView::updateLayout()
{	
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
		
		// shift graph endpoints -- after we've layed out icons with proper endpoints
		if (s.mIsGraph)
		{
			float d = s.mGraphHeight * .5f;
			s.mEndpoint[0].y += d;
			s.mEndpoint[1].y += d;
		}
	}

	// colors
	mColorSize = kColorSize;
	
	vec2 colorsSize = mColorSize * vec2( mColorCols, mColors.size()/mColorCols );

	mColorsTopLeft.y = kVStepToFirstSliderLine + (float)(mSliders.size()-1) * kIntersliderVStep + kVStepToColors;
	mColorsTopLeft.x = getBounds().getWidth()/2 - colorsSize.x/2;
	
	mColorsRect = Rectf( mColorsTopLeft, mColorsTopLeft + colorsSize );
}

void FragmentView::mouseDown( ci::app::MouseEvent e )
{
	vec2 local = rootToChild(e.getPos());
	
	int sliderB = pickSliderBar(local);
	int sliderH = pickSliderHandle(local);
	int sliderI = pickSliderIcon(local,mMouseDownIcon);
	int color   = pickColor(local);
	
	mMouseDownSlider=-1;
	
	if ( sliderI != -1 )
	{
		// nothing; just capture this case
		mMouseDownSlider = sliderI;
	}
	else if ( sliderH != -1 )
	{
		mDragSlider = sliderH;
		mMouseDownSlider = sliderH;
	}
	else if ( sliderB != -1 )
	{
		mDragSlider = sliderB;
		mMouseDownSlider = sliderB;
		
		mSliders[mDragSlider].setValueWithMouse(local);

		fragmentDidChange();
	}
	else if ( color != -1 )
	{
		mSelectedColor = color;
		syncModelToColor();
	}

	// capture start value if dragging slider
	if (mDragSlider != -1)
	{
		mDragSliderStartValue = mSliders[mDragSlider].mValue;
	}
}

void FragmentView::mouseUp ( ci::app::MouseEvent e )
{
	const float kSingleClickDist = 2.f; 
	
	vec2 local = rootToChild( e.getPos() );

	// click end-cap icon
	if ( mMouseDownIcon != -1 )
	{
		int icon;
		int s = pickSliderIcon(local,icon);
		
		if ( s != -1 && mMouseDownSlider==s && icon==mMouseDownIcon )
		{
			mSliders[s].setLimitValue( mMouseDownIcon );
		}
	}
	// click into slider bar
	else if ( distance( getMouseDownLoc(), getMouseLoc() ) < kSingleClickDist )
	{
		int s = pickSliderBar( local );

		if ( s != -1 )
		{
			mSliders[s].setValueWithMouse(local);
			fragmentDidChange();
		}
	}
	
	// clear
	mMouseDownIcon=-1;
	mDragSlider=-1;
}

void FragmentView::setFragment( SampleRef s, int f )
{
	if ( s != mEditSample || f != mEditFragment )
	{
		mEditSample   = s;
		mEditFragment = f;
		
		syncSlidersToModel();
		syncColorToModel();
	}
}

bool FragmentView::isEditFragmentValid() const
{
	return mEditSample && mEditFragment >= 0 && mEditFragment < mEditSample->mFragments.size();
}

void FragmentView::syncSlidersToModel()
{
	if ( isEditFragmentValid() )
	{
		for( Slider &s : mSliders )
		{
			s.pullValueFromGetter();
		}
	}
}

void FragmentView::fragmentDidChange() const
{
	if ( isEditFragmentValid() )
	{
		if (mSampleView) mSampleView->fragmentDidChange(mEditFragment);
	}
}

void FragmentView::syncModelToColor() const
{
	if ( isEditFragmentValid() && mSelectedColor >= 0 && mSelectedColor < mColors.size() )
	{
		mEditSample->mFragments[mEditFragment].mColor = mColors[ mSelectedColor ];
		
		fragmentDidChange();
	}
}

void FragmentView::syncColorToModel()
{
	if ( isEditFragmentValid() )
	{
		Color c = mEditSample->mFragments[mEditFragment].mColor;
		
		int closest = 0;
		float bestdist = MAXFLOAT;
		
		for( int i=0; i<mColors.size(); ++i )
		{
			float d = distance( mColors[i], c );
			
			if ( d < bestdist )
			{
				closest  = i;
				bestdist = d;
			}
		}
		
		mSelectedColor = closest;
	}
}

void FragmentView::mouseDrag( ci::app::MouseEvent e )
{
	vec2 mouseDownLocal = rootToChild(getMouseDownLoc());
	vec2 local = rootToChild(e.getPos());
	vec2 delta = local - mouseDownLocal; 
	
	// slider
	if ( mDragSlider != -1 )
	{
		Slider &s = mSliders[mDragSlider];
		
		if ( s.mIsGraph )
		{
			s.setValueWithMouse(local);
		}
		else
		{		
			float deltaVal = delta.x / kSliderLineLength; 
			
			s.setNormalizedValue(mDragSliderStartValue + deltaVal);
		}

		// push
		fragmentDidChange();
	}
	// color
	else if ( pickColor(mouseDownLocal) != -1 )
	{
		int oldColor = mSelectedColor;
		int color = pickColor(local);
		mSelectedColor = color;
		
		// revert?
//		if (mSelectedColor==-1) mSelectedColor = pickColor(mouseDownLocal);
		if (mSelectedColor==-1) mSelectedColor = oldColor;

		syncModelToColor();
	}
}

void FragmentView::tick( float dt )
{
	// in case user is editing from gel view
	syncSlidersToModel();
}

void FragmentView::draw()
{
	// background + frame
	gl::color(1,1,1);
	gl::drawSolidRect(getBounds());
	gl::color(.5,.5,.5);
	gl::drawStrokedRect(getBounds());
	
	// sliders
	for ( int i=0; i<mSliders.size(); ++i )
	{
		const auto &s = mSliders[i];

		int hicon = -1;
		
		if (mMouseDownSlider==i)
		{
			hicon = mMouseDownIcon;
			
			if ( hicon != s.pickIcon(rootToChild(getMouseLoc())) ) hicon=-1;
		}
		
		s.draw(hicon);
	}
	
	// colors
	drawColors();
}

void FragmentView::drawColors() const
{
	// colors
	for( int i=0; i<mColors.size(); ++i )
	{
		gl::color( mColors[i] );
		gl::drawSolidRect( calcColorRect(i) );
	}
	
	if ( mSelectedColor >= 0 )
	{
		gl::color(kSelectedColorStrokeColor);
		gl::drawStrokedRect(
			calcColorRect(mSelectedColor).inflated( vec2(.5f)*kSelectedColorStrokeWidth ),
			kSelectedColorStrokeWidth );
	}
}

int
FragmentView::pickSliderHandle( glm::vec2 loc ) const
{
	for ( int i=0; i<mSliders.size(); ++i )
	{
		const bool hasHandle = ! mSliders[i].mIsGraph;
		
		if ( hasHandle && mSliders[i].calcHandleRect().contains(loc) ) return i;
	}
	
	return -1;
}

int	FragmentView::pickSliderBar( glm::vec2 p ) const
{
	for ( int i=0; i<mSliders.size(); ++i )
	{
		const Slider& s = mSliders[i];
		
		Rectf r = s.calcPickRect();
		
		if ( r.contains(p) )
		{
			return i;
		}
	}
	
	return -1;
}

int FragmentView::pickSliderIcon  ( glm::vec2 p, int &icon ) const
{
	for ( int i=0; i<mSliders.size(); ++i )
	{
		const Slider& s = mSliders[i];
		
		int v = s.pickIcon(p);
		
		if (v!=-1)
		{
			icon = v;
			return i;
		}
	}
	
	icon = -1;
	return -1;
}

int	
FragmentView::pickColor( glm::vec2 loc ) const
{
	if ( mColorsRect.contains(loc) )
	{
		loc -= mColorsRect.getUpperLeft();
		
		int x = loc.x / mColorSize.x;
		int y = loc.y / mColorSize.y;
		
		int i = x + y * mColorCols;
		
		if ( i >= mColors.size() ) i = -1;
		
		return i;
	}
	else return -1;
}

Rectf
FragmentView::calcColorRect( int i ) const
{
	int x = i % mColorCols;
	int y = i / mColorCols;
	
	Rectf r( vec2(0,0), mColorSize );
	r += mColorSize * vec2(x,y);
	r += mColorsTopLeft;
	
	return r;
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