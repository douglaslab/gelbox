//
//  AppSettingsView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 3/8/18.
//

#include "GelboxApp.h"
#include "AppSettingsView.h"
#include "GelView.h"
#include "Layout.h"
#include "CheckboxView.h"
#include "ButtonView.h"

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
	
	auto setFrame = [&n]( ViewRef cv )
	{
		cv->setFrame(
			cv->getFrame()
			+ vec2(0.f,-kLayout.mAppSettingsToFirstWidgetGutter - kLayout.mAppSettingsItemVOffset * n )
			- cv->getFrame().getLowerLeft()
			);
			
		n++;		
	};
	
	auto addCheckbox = [this,setFrame]( string name, function<bool()> get, function<void(bool)> set )
	{
		CheckboxViewRef cv = make_shared<CheckboxView>();
		cv->setup(name);
		cv->mSetter = set;
		cv->mGetter = get;
		cv->setParent( shared_from_this() );
		setFrame(cv);
	};
	
	auto addButton = [this,setFrame]( string name, function<void()> click, function<bool(void)> isEnabled )
	{
		ButtonViewRef cv = make_shared<ButtonView>();
		cv->setup( name, ci::app::getWindowContentScale() );
		cv->mClickFunction		= click;
		cv->mIsEnabledFunction	= isEnabled;
		cv->mRectCornerRadius	= kLayout.mAppSettingsButtonCornerRadius;
//		cv->mFrameColor			= kLayout.mAppSettingsButtonColor;
		cv->mFillColor			= ColorA(.95,.95,.95,1.f);
		cv->setParent( shared_from_this() );
		setFrame(cv);
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
		
	if (GelboxApp::instance()->isSampleSelected())
	{
		addButton( " Save Selected Sample… ",
			[]() {
				GelboxApp::instance()->promptUserToSaveSelectedSample();
				GelboxApp::instance()->closeSettingsMenu();
			},
			[]() {
				return GelboxApp::instance()->isSampleSelected();
			}
			);
	}
		
	addButton( " Save Gel… ",
		[]() {
			GelboxApp::instance()->promptUserToSaveGel();
			GelboxApp::instance()->closeSettingsMenu();
		},
		0
		);

	addButton( " Open… ",
		[]() {
			GelboxApp::instance()->promptUserToOpenFile();
			GelboxApp::instance()->closeSettingsMenu();
		},
		0
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
