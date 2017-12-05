//
//  GelView.h
//  Gelbox
//
//  Created by Chaim Gingold on 12/5/17.
//
//

#pragma once

#include "Gel.h"

class GelView;
typedef std::shared_ptr<GelView> GelViewRef;

class GelView
{
public:

	GelView( GelRef gel )
	: mGel(gel)
	  {}
	
	void draw();
	
private:
	GelRef mGel;
	
};