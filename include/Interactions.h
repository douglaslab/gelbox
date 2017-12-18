//
//  Interactions.h
//  Gelbox
//
//  Created by Chaim Gingold on 12/18/17.
//
//

#pragma once

#include "Interaction.h"
#include "DropTarget.h"

class DragSampleInteraction : public Interaction
{
public:

	DragSampleInteraction( SampleViewRef s )
	: mSample(s)
	{
	}
	
	void mouseDrag( ci::app::MouseEvent event ) override
	{
		mTarget = GelboxApp::instance()->pickDropTarget( glm::vec2(event.getPos()) );
	}
	
	void mouseUp( ci::app::MouseEvent event ) override
	{
		if ( mTarget )
		{
			// drop!
			mTarget->receive( *(mSample->getSource()) );			
		}
		else
		{
			// move
			mSample->setFrame( mSample->getFrame() + mSample->getMouseLoc() - mSample->getMouseDownLoc() );
		}

		// done
		end();
	}	
	
	void draw() override
	{
		if (mTarget) mTarget->draw();
	}	
	
private:
	SampleViewRef mSample;
	DropTargetRef mTarget;
	
};