//
//  OperationView.h
//  Gelbox
//
//  Created by Chaim Gingold on 12/18/17.
//
//

#pragma once

#include "NodeView.h"
#include "Sample.h"
#include "DropTargetSource.h"

class OperationView;
typedef std::shared_ptr<OperationView> OperationViewRef;

class OperationView :
	public NodeView,
	public DropTargetSource,
	public std::enable_shared_from_this<OperationView>
{
public:

	typedef std::function<Sample(const Sample&)> tOpFunc;
	
	OperationView();
	OperationView( std::string, tOpFunc );
	
	void draw() override;

	DropTargetRef getDropTarget( glm::vec2 locInFrame ) override;
	
	void receive( const Sample& );
	
private:
	std::string mName;
	tOpFunc		mFunc;
	
};