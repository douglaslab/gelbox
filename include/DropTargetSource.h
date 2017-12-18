//
//  DropTargetSource.h
//  Gelbox
//
//  Created by Chaim Gingold on 12/18/17.
//
//

#pragma once

#include <memory>

class DropTarget;
typedef std::shared_ptr<DropTarget> DropTargetRef;

class DropTargetSource;
typedef std::shared_ptr<DropTargetSource> DropTargetSourceRef;

class DropTargetSource
{
public:
	virtual DropTargetRef getDropTarget( glm::vec2 locInFrame ) { return 0; }
	
};

