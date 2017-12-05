//
//  GelParticleSource.h
//  Gelbox
//
//  Created by Chaim Gingold on 12/5/17.
//
//

#include <vector>
#include "cinder/Rand.h"

class GelParticleSource
{
public:

	class Kind
	{
	public:
		float mSpeed = 1.f;
		float mDeviation = .2f;
		float mProbabilityWeight = 1.f;
	};
	
	class Result
	{
	public:
		float mSpeed = 0.f;
	};

	std::vector<Kind> mKinds;
	
	Result next( ci::Rand& ) const;
	
};
