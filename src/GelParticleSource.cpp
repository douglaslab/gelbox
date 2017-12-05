//
//  GelParticleSource.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 12/5/17.
//
//

#include "GelParticleSource.h"

using namespace std;
using namespace ci;

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
	auto randcurved = [&randgen]( int curve ) -> float
	{
//		follow this spec:
//		randgen.nextFloat(-1.f,1.f);
		
		// for sure there is a better way to do this...
		
		float q = randgen.nextFloat();
		
		while (curve-- > 1)
		{
			q *= randgen.nextFloat();
		}
		
		// fit 0..1 to -1 .. 0 OR 0 .. 1
		if ( randgen.nextBool() ) q -= 1.f;
		else q = 1.f - q; 
		
		return q;
	};
	
	Result r;
	r.mSpeed = mKinds[k].mSpeed + randcurved(3) * mKinds[k].mDeviation;
	return r;
}

void
GelParticleSource::loadXml( const ci::XmlTree& xml )
{
	mKinds.clear();
	
	if ( !xml.hasChild("GelParticleSource") )
	{
		cout << "GelParticleSource::loadXml no GelParticleSource root node" << endl;
	}
	
	auto childAttrValue = []( const XmlTree& xml, std::string child, auto def )
	{
		if ( xml.hasChild(child) )
		{
			auto j = xml.getChild(child);
			def = j.getAttributeValue("value",def);
		}
		
		return def;
	};
	
	for ( auto i = xml.begin("GelParticleSource/Kind"); i != xml.end(); ++i )
	{
		Kind k;
		
		k.mSpeed				= childAttrValue( *i, "Speed", k.mSpeed );
		k.mDeviation			= childAttrValue( *i, "Deviation", k.mSpeed );
		k.mProbabilityWeight	= childAttrValue( *i, "ProbabilityWeight", k.mSpeed );
		
		mKinds.push_back(k);
		
		if (0)
		{
			cout << "Kind speed=" << k.mSpeed << " dev=" << k.mDeviation << " p=" << k.mProbabilityWeight << endl;
		}		
	}
}
