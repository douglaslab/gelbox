//
//  Interaction.h
//  Gelbox
//
//  Created by Chaim Gingold on 12/18/17.
//
//

#pragma once

class Interaction
{
public:
	
	virtual void mouseDown( ci::app::MouseEvent event ) {}
	virtual void mouseUp  ( ci::app::MouseEvent event ) {}
	virtual void mouseMove( ci::app::MouseEvent event ) {}
	virtual void mouseDrag( ci::app::MouseEvent event ) {}
	virtual void update() {}
	virtual void draw() {}	

	// global interaction accessors
	static Interaction* get() { return sInteraction; }
	static void set( Interaction* i ) { sInteraction=i; }
	
private:
	static Interaction* sInteraction;
	
};