//
//  AppSettingsView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 3/8/18.
//

#include "AppSettingsView.h"
#include "GelView.h"
#include "Layout.h"
#include "CheckboxView.h"

using namespace std;
using namespace ci;

void AppSettingsView::setup( GelViewRef gelView )
{
	mGelView = gelView;

	mDivLineTex = kLayout.uiImage("app-settings-line.png",&mDivLineScale);
	
	if (mDivLineTex) {
		mDivLineRect = Rectf( vec2(0.f), mDivLineTex->getSize() / mDivLineScale );
		mDivLineRect -= kLayout.mAppSettingsToDivLine;
		mDivLineRect -= vec2( 0.f, mDivLineRect.getHeight() );
		mDivLineRect = snapToPixel(mDivLineRect);
	}
	
	// make stuff
	int n=0;
	
	auto addCheckbox = [this,&n]( string name, function<bool()> get, function<void(bool)> set )
	{
		CheckboxViewRef cv = make_shared<CheckboxView>();
		cv->setup(name);
		cv->mSetter = set;
		cv->mGetter = get;
		cv->setParent( shared_from_this() );
		cv->setFrame( cv->getFrame()
			+ vec2(0.f,-kLayout.mAppSettingsToFirstCheckboxGuter - kLayout.mAppSettingsItemVOffset * n )
			- cv->getFrame().getLowerLeft()
			);		
		
		n++;
	};
	
	// this appear in an inverted order...
	addCheckbox(
		"Render",
		[this]() {
			return mGelView->isGelRenderEnabled();
		},
		[this]( bool v ) {
			mGelView->enableGelRender(v);
		}
		);
		
	addCheckbox(
		"Loupe on hover",
		[this]() {
			return mGelView->isLoupeOnHoverEnabled();
		},
		[this]( bool v ) {
			mGelView->enableLoupeOnHover(v);
		}
		);		
}

void AppSettingsView::close()
{
	if (getCollection()) getCollection()->removeView(shared_from_this());
}

void AppSettingsView::draw()
{
	if (mDivLineTex)
	{
		gl::color(1,1,1,1);
		gl::draw(mDivLineTex,mDivLineRect);
	}
}
