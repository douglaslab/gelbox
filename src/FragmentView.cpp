//
//  FragmentView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 1/8/18.
//
//

#include "FragmentView.h"
#include "Sample.h"

using namespace std;
using namespace ci;
using namespace ci::app;

const vec2  kColorSize(35,35);
const float kSelectedColorStrokeWidth = 4.f;
const Color kSelectedColorStrokeColor(0,0,0);

const Color kSliderLineColor   = Color::hex(0x979797); 
const Color kSliderHandleColor = Color::hex(0x4990E2);
const vec2  kSliderHandleSize  = vec2(16,20);
const float kSliderNotchRadius = 2.5f;
const float kSliderLineLength = 133;
const float kSliderIconGutter = 12;
const vec2  kSliderIconNotionalSize(26,26); // for layout purposes; they can be different sizes
const float kIntersliderVStep  = 56;
const float kVStepToFirstSliderLine = 42;

const float kVStepToColors = 42; 

const float kMinBases = 1;
const float kMaxBases = 14000;

const float kMaxAspectRatio = 8.f;

const int kNumMultimerNotches = 7;


FragmentView::FragmentView()
{
	mColors = vector<Color>{
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
	
	mSelectedColor=0;
	
	{
		// icon loading helper
		fs::path iconPathBase = getAssetPath("fragment-icons");
		
		auto loadIcons = [iconPathBase]( Slider& s, string name )
		{
			fs::path paths[2] =
			{
				iconPathBase / (name + "-lo.png"),
				iconPathBase / (name + "-hi.png")
			};
			
			for( int i=0; i<2; ++i )
			{
				try {
					s.mIcon[i] = gl::Texture::create( loadImage(paths[i]) );
				} catch (...)
				{
					cerr << "ERROR failed to load icon " << paths[i] << endl;
				}
				
				if ( s.mIcon[i] )
				{
					s.mIconSize[i] = vec2( s.mIcon[i]->getWidth(), s.mIcon[i]->getHeight() );
				}
				else s.mIconSize[i] = kSliderIconNotionalSize;
			}
		};
		
		// config sliders
		Slider size;
		Slider concentration;
		Slider aspect;
		Slider aggregate;
		Slider degrade;
		
		size.mValueMappedLo = kMinBases;
		size.mValueMappedHi = kMaxBases;
		size.mSetter = []( Sample::Fragment& f, float v ) {
			f.mBases = v;  
		};
		size.mGetter = []( Sample::Fragment& f ) {
			return f.mBases; 
		};
		
		// ??? what should mapping be?
		concentration.mSetter = []( Sample::Fragment& f, float v ) {
			f.mMass = v;  
		};
		concentration.mGetter = []( Sample::Fragment& f ) {
			return f.mMass; 
		};

		aspect.mValueMappedLo = 1.f;
		aspect.mValueMappedHi = kMaxAspectRatio;
		aspect.mSetter = []( Sample::Fragment& f, float v ) {
			f.mAspectRatio = v;  
		};
		aspect.mGetter = []( Sample::Fragment& f ) {
			return f.mAspectRatio; 
		};

		aggregate.mNotches = kNumMultimerNotches;
		aggregate.mValueMappedLo = 1;
		aggregate.mValueMappedHi = kNumMultimerNotches;
		aggregate.mSetter = []( Sample::Fragment& f, float v ) {
			f.mAggregate = v;  
		};
		aggregate.mGetter = []( Sample::Fragment& f ) {
			return f.mAggregate; 
		};
		
		degrade.mValueMappedLo = 0.f;
		degrade.mValueMappedHi = 2.f;
		degrade.mSetter = []( Sample::Fragment& f, float v ) {
			f.mDegrade = v;  
		};
		degrade.mGetter = []( Sample::Fragment& f ) {
			return f.mDegrade; 
		};
		
		// load icons
		loadIcons( size, "size" );
		loadIcons( concentration, "concentration" );
		loadIcons( aspect, "aspect" );
		loadIcons( aggregate, "multimer" );
		loadIcons( degrade, "degrade" );
		
		// insert
		mSliders.push_back(size);
		mSliders.push_back(concentration);
		mSliders.push_back(aspect);
		mSliders.push_back(aggregate);
		mSliders.push_back(degrade);
	}
}

void FragmentView::updateLayout()
{
	auto snapToPixel = []( vec2 p )
	{
		return vec2( roundf(p.x), roundf(p.y) );
	};
	
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
		
		s.mIconRect[0] = Rectf( vec2(0,0), s.mIconSize[0] );
		s.mIconRect[1] = Rectf( vec2(0,0), s.mIconSize[1] );
		s.mIconRect[0].offsetCenterTo( snapToPixel(s.mEndpoint[0] - offset) );
		s.mIconRect[1].offsetCenterTo( snapToPixel(s.mEndpoint[1] + offset) );
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
	
	int slider = pickSliderHandle(local);
	int color  = pickColor(local);
	
	if ( slider != -1 )
	{
		mDragSlider = slider;
	}
	else if ( color != -1 )
	{
		mSelectedColor = color;
	}
	else
	{
		mDragSlider = tryInstantSliderSet(local);		
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
	
	if ( distance( getMouseDownLoc(), getMouseLoc() ) < kSingleClickDist )
	{
		tryInstantSliderSet( rootToChild(e.getPos()) );
	}
	
	// clear drag
	mDragSlider=-1;
}

int FragmentView::tryInstantSliderSet( vec2 local )
{
	float value;
	int s = pickSliderBar( local, value );
	
	if ( s != -1 )
	{
		setSliderValue( mSliders[s], value );
	}
	
	return s;
}

void FragmentView::setFragment( SampleRef s, int f )
{
	mEditSample   = s;
	mEditFragment = f;
	
	syncSlidersToModel();
}

void FragmentView::syncSlidersToModel()
{
	if ( mEditSample && mEditFragment >= 0 && mEditFragment < mEditSample->mFragments.size() )
	{
		for( Slider &s : mSliders )
		{
			if (s.mGetter)
			{
				float value = s.mGetter( mEditSample->mFragments[mEditFragment] );

				s.mValue = lmap( value, s.mValueMappedLo, s.mValueMappedHi, 0.f, 1.f );
			}
		}
	}
}

void FragmentView::syncModelToSlider( Slider& s ) const
{
	if ( mEditSample && mEditFragment >= 0 && mEditFragment < mEditSample->mFragments.size() )
	{
		if (s.mSetter)
		{
			float value = lerp( s.mValueMappedLo, s.mValueMappedHi, s.mValue );
			
			s.mSetter( mEditSample->mFragments[mEditFragment], value );			
		}
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
		
		float deltaVal = delta.x / kSliderLineLength; 
		
		setSliderValue( s, mDragSliderStartValue + deltaVal );
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
	}
}

void FragmentView::draw()
{
	// background + frame
	gl::color(1,1,1);
	gl::drawSolidRect(getBounds());
	gl::color(.5,.5,.5);
	gl::drawStrokedRect(getBounds());
	
	// sliders
	for ( const auto &s : mSliders )
	{
		// line
		gl::color(kSliderLineColor);
		gl::drawLine(s.mEndpoint[0], s.mEndpoint[1]);
		
		// notches
		if ( s.mNotches>0 )
		{
			float step = 1.f / (float)(s.mNotches-1);
			
			for( int i=0; i<s.mNotches; ++i )
			{
				vec2 c = lerp( s.mEndpoint[0], s.mEndpoint[1], step * (float)i );
				gl::drawSolidCircle( c, kSliderNotchRadius );
			}
		}
		
		// handle
		gl::color(kSliderHandleColor);
		gl::drawSolidRect(calcSliderHandleRect(s));
		
		// icons
		gl::color(1,1,1);
		gl::draw( s.mIcon[0], s.mIconRect[0] );
		gl::draw( s.mIcon[1], s.mIconRect[1] );
		
		// text label
	}
	
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

ci::Rectf
FragmentView::calcSliderHandleRect( const Slider& s ) const
{
	Rectf r( vec2(0,0), kSliderHandleSize );
	
	r.offsetCenterTo( lerp(s.mEndpoint[0],s.mEndpoint[1],s.mValue) ); 
	
	return r;
}

int
FragmentView::pickSliderHandle( glm::vec2 loc ) const
{
	for ( int i=0; i<mSliders.size(); ++i )
	{
		if ( calcSliderHandleRect(mSliders[i]).contains(loc) ) return i;
	}
	
	return -1;
}

int	FragmentView::pickSliderBar( glm::vec2 p, float& valuePicked ) const
{
	for ( int i=0; i<mSliders.size(); ++i )
	{
		const Slider& s = mSliders[i];
		
		Rectf r( s.mEndpoint[0], s.mEndpoint[1] );
		r.inflate( vec2(0,kSliderHandleSize.y/2) );
		
		if ( r.contains(p) )
		{
			valuePicked = (p.x - r.getX1()) / r.getWidth();
			
			return i;
		}
	}
	
	return -1;
}

void FragmentView::setSliderValue( Slider& s, float value )
{
	s.mValue = constrain( value, 0.f, 1.f );
	
	// notched?
	if ( s.mNotches > 0 )
	{
		s.mValue = round( s.mValue * (float)(s.mNotches-1) );
		s.mValue /= (float)(s.mNotches-1);
	}
	
	syncModelToSlider(s);
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
