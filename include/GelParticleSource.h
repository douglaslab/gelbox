//
//  GelParticleSource.h
//  Gelbox
//
//  Created by Chaim Gingold on 12/5/17.
//
//

#include <vector>
#include "cinder/Rand.h"
#include "cinder/Xml.h"

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
	
	GelParticleSource() {}
	GelParticleSource( const ci::XmlTree& xml ) { loadXml(xml); }
	
	void   loadXml( const ci::XmlTree& ); // clears existing mKinds first
	
	Result next( ci::Rand& ) const;
	
};
