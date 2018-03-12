//
//  GelboxApp.h
//  Gelbox
//
//  Created by Chaim Gingold on 12/11/17.
//
//

#pragma once

#include "cinder/app/App.h"

#include "View.h"
#include "Sample.h"
#include "GelView.h"
//#include "DropTarget.h"

class AppSettingsView;
typedef std::shared_ptr<AppSettingsView> AppSettingsViewRef;

class GelboxApp : public ci::app::App {
  public:
	static GelboxApp* instance() { return mInstance; }
	
	GelboxApp();
	~GelboxApp();
	
	void setup() override;
	void mouseDown( ci::app::MouseEvent event ) override;
	void mouseUp  ( ci::app::MouseEvent event ) override;
	void mouseMove( ci::app::MouseEvent event ) override;
	void mouseDrag( ci::app::MouseEvent event ) override;
	void fileDrop ( ci::app::FileDropEvent event ) override;
	void keyDown  ( ci::app::KeyEvent ) override;
	void keyUp    ( ci::app::KeyEvent ) override;

	void update() override;
	void draw() override;
	
	static void prepareSettings( Settings *settings );

	
//	DropTargetRef pickDropTarget( ci::vec2 ) const;
	
	ci::gl::TextureFontRef getUIFont() const { return mUIFont; }
	
	int getModifierKeys() const { return mModifierKeys; }
	
  public:
  	
  	int						mModifierKeys=0; // e.g. ci::app::KeyEvent::SHIFT_DOWN
  	
	ci::gl::TextureFontRef	mUIFont;

	ViewCollection			mViews;
	GelViewRef				mGelView;
	ButtonViewRef	 		mSettingsBtn;
	AppSettingsViewRef		mSettingsView;
	
	static GelboxApp*		mInstance;

	void		setupSettingsBtn();
  	int			getModifierKeys( ci::app::KeyEvent ) const;
	SampleRef	loadSample( ci::fs::path ) const;	

	void makeGel();
	
};
