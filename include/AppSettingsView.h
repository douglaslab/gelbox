//
//  AppSettingsView.h
//  Gelbox
//
//  Created by Chaim Gingold on 3/8/18.
//

#pragma once

#include "View.h"

class AppSettingsView;
typedef std::shared_ptr<AppSettingsView> AppSettingsViewRef;

class GelView;
typedef std::shared_ptr<GelView> GelViewRef;


class AppSettingsView : public View
{
public:
	void setup( GelViewRef );
	void close();
	
	void draw() override;
		
private:
	GelViewRef				mGelView;
	
	int						mDivLineScale=1;
	ci::gl::TextureRef		mDivLineTex;
	ci::Rectf				mDivLineRect;

};
