//
//  DropTarget.h
//  Gelbox
//
//  Created by Chaim Gingold on 12/18/17.
//
//

#pragma once

#include "GelView.h"
#include "OperationView.h"

class DropTarget;
typedef std::shared_ptr<DropTarget> DropTargetRef;

class DropTarget
{
public:
	
	virtual void draw() {}
	virtual void receive( const Sample& ) {}
	
};

class DropTargetGelView : public DropTarget
{
public:
	
	DropTargetGelView( GelViewRef gv, int lane )
	: mGelView(gv)
	, mGelViewLane(lane)
	{}
	
	void draw() override;
	void receive( const Sample& ) override;

private:
	GelViewRef	mGelView;
	int			mGelViewLane;

};

class DropTargetOpView : public DropTarget
{
public:
	DropTargetOpView( OperationViewRef op )
	: mOperationView(op)
	{}

	void draw() override;
	void receive( const Sample& ) override;
	
private:
	OperationViewRef mOperationView;	
};