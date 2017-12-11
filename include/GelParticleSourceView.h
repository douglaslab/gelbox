//
//  GelParticleSourceView.h
//  Gelbox
//
//  Created by Chaim Gingold on 12/6/17.
//
//

#pragma once

#include "View.h"
#include "GelParticleSource.h"
#include "GelView.h"

class GelParticleSourceView;
typedef std::shared_ptr<GelParticleSourceView> GelParticleSourceViewRef;

class GelParticleSourceView : public View
{
public:

	GelParticleSourceView( GelParticleSourceRef source ) { setSource(source); }
	
	void setSource( GelParticleSourceRef );
	
	void draw() override;

	void mouseDrag( ci::app::MouseEvent ) override;
	void mouseUp( ci::app::MouseEvent ) override;
	
private:
	GelParticleSourceRef	mSource;

	ci::gl::TextureRef		mIcon;

	GelViewRef				mGelDropTarget;
	int						mGelDropTargetLane;
};