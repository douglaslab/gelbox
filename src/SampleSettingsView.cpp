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
	mBufferView->setFrameAndBoundsWithSize(
		Rectf( vec2(0.f), kLayout.mBufferViewSize )
		+ kLayout.mSampleBufferViewTopLeft
		);

	mSubheadTex = kLayout.renderSubhead("Dyes");
	mHeadingTex = kLayout.renderHead(kLayout.mSampleSettingsHeaderStr);

	layout();
}

void SampleSettingsView::makeSliders()
{
	Font labelFont( kLayout.mBufferViewSliderLabelFont, kLayout.mBufferViewSliderLabelFontSize );

	for( int dye=0; dye<Dye::kCount; ++dye )
	{
		Slider s;
		
		s.mStyle = Slider::Style::Bar;
		s.mBarCornerRadius	= kLayout.mBufferViewSliderCornerRadius;
		s.mBarFillColor		= Dye::kColors[dye];
		s.mBarEmptyColor	= lerp( s.mBarFillColor, ColorA(1,1,1,1), .8f );
		
		
		s.mValueMappedLo = GelSim::kSliderDyeMassMin;
		s.mValueMappedHi = GelSim::kSliderDyeMassMax;
		s.mValueQuantize = 1.f;
	
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
			return toString(v) + " mM";
		};
		
		s.pullValueFromGetter();
		
		// labels
		s.setIcon( 1, kLayout.uiImage( fs::path("molecules"), Dye::kIconName[dye] + ".png" ) );
		
		TextLayout label;
		label.clear( ColorA(1,1,1,1) );
		label.setFont( labelFont ); // should be medium, but maybe that's default
		label.setColor( kLayout.mBufferViewSliderTextLabelColor );
		
		// https://stackoverflow.com/questions/236129/the-most-elegant-way-to-iterate-the-words-of-a-string
		
		if ((1))
		{
			label.addRightLine(Dye::kNames[dye]);
		}
		else
		{
			// multi-line
			istringstream iss(Dye::kNames[dye]);
			vector<string> dyeNameLines{
					istream_iterator<string>{iss},
					istream_iterator<string>{}};
			
			for( auto l : dyeNameLines ) {
				label.addRightLine(l);
			}
		}
		
		s.setIcon( 0, gl::Texture::create(label.render()) );		
		
		// insert		
		auto sv = make_shared<SliderView>(s);
		sv->setParent( shared_from_this() );
		mSliders.push_back(sv);
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
	const int pixelsPerPt = 1;

	mBraceRect = kLayout.layoutBrace( getBounds() );	

	SliderView::layoutSlidersFromBar(
		mSliders,
		kLayout.mSampleSettingsSlidersTopLeft,
		kLayout.mSampleSettingsSliderVOffset,
		kLayout.mBufferViewSliderBarSize,
		kLayout.mBufferViewSlidersIconGutter
		);

	if (mSubheadTex)
	{
		mSubheadRect = Rectf( vec2(0.f), mSubheadTex->getSize() * pixelsPerPt );
		
		vec2 ll = kLayout.mSampleSettingsSlidersTopLeft;
		ll.y -= kLayout.mSampleSettingsSlidersToDyeLabel;
		
		mSubheadRect += ll - mSubheadRect.getLowerLeft();
		mSubheadRect = snapToPixel( mSubheadRect );
	}

	if (mHeadingTex) {
		mHeadingRect = kLayout.layoutHeadingText( mHeadingTex, kLayout.mSampleSettingsHeaderBaselinePos );
	}
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
		
	if (mSubheadTex)
	{
		gl::color(1,1,1);
		gl::draw(mSubheadTex,mSubheadRect);
	}

	if (mHeadingTex)
	{
		gl::color(1,1,1);
		gl::draw(mHeadingTex,mHeadingRect);
	}
}
