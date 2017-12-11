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
#include "GelParticleSource.h"
#include "GelView.h"


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

	void update() override;
	void draw() override;
	
	void makeGel( ci::vec2 center );
	GelViewRef pickGelView( ci::vec2 loc, int* pickedLane=0 ) const;
	
	ci::gl::TextureFontRef getUIFont() const { return mUIFont; }
	
  public:
	ci::gl::TextureFontRef	mUIFont;

	ViewCollection		mViews;

	static GelboxApp*	mInstance;
	
};