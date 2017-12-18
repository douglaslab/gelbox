//
//  Interaction.h
//  Gelbox
//
//  Created by Chaim Gingold on 12/18/17.
//
//

#pragma once

class Interaction;
typedef std::shared_ptr<Interaction> InteractionRef;

class Interaction : public std::enable_shared_from_this<Interaction>
{
public:
	
	virtual void mouseDown( ci::app::MouseEvent event ) {}
	virtual void mouseUp  ( ci::app::MouseEvent event ) {}
	virtual void mouseMove( ci::app::MouseEvent event ) {}
	virtual void mouseDrag( ci::app::MouseEvent event ) {}
	virtual void update() {}
	virtual void draw() {}	

	// global interaction accessors
	static InteractionRef get() { return sInteraction; }
	static void set( InteractionRef i ) { sInteraction=i; }
	
	// begin/end convenience
	void begin() { set(shared_from_this()); }
	void end() { if (get().get()==this) set(0); }
	
private:
	static InteractionRef sInteraction;
	
};