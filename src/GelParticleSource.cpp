//
//  GelParticleSource.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 12/5/17.
//
//

#include "GelParticleSource.h"

GelParticleSource::Result
GelParticleSource::next( ci::Rand& randgen ) const
{
	// no data!
	if (mKinds.empty()) return Result();
	
	// select kind
	int		k = 0;
	float	w = mKinds[0].mProbabilityWeight;
	
	for( int i=0; i<mKinds.size(); ++i )
	{
		float neww = w + mKinds[i].mProbabilityWeight;
		
		// select i?
		// (or stick to old choice)
		if ( randgen.nextFloat() * neww > w )
		{
			k=i;
		}
		
		// adjust w
		w = neww;
	}
	
	// fill it out
	Result r;
	r.mSpeed = mKinds[k].mSpeed + randgen.nextFloat(-1.f,1.f) * mKinds[k].mDeviation;
	return r;
}
