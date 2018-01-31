//
//  GelSim.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 1/31/18.
//
//

#include "GelSim.h"

using namespace std;

namespace GelSim {

void degradeBaseCount( int& baseCountHigh, int& baseCountLow, float degrade )
{
	// as degrade goes 0..1, y2 moves to end of chart--shorter base pairs
	// as degrade goes 1..2, y1 moves to end of chart--shorter bp
	
	float basis = baseCountHigh;
	
	baseCountLow -= min( 1.f, degrade ) * basis;
	
	if ( degrade > 1.f ) baseCountHigh -= min( 1.f, degrade - 1.f ) * basis;		
	
	baseCountLow  = max( 1, baseCountLow  );
	baseCountHigh = max( 1, baseCountHigh );
	
//	y2b -= min( 1.f, b.mDegrade ); // as degrade goes 0..1, y2 moves to end of chart--shorter base pairs
//	if ( b.mDegrade > 1.f ) y1b -= min( 1.f, b.mDegrade - 1.f ); // as degrade goes 1..2, y1 moves to end of chart--shorter bp  
}

float calcY( int bases, int aggregation, float aspectRatio, float time )
{
	return 0.f;
}


} // namespace