//
//  Sample.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 12/5/17.
//
//

#include "Sample.h"
#include <cstdlib>

using namespace std;
using namespace ci;

const std::string Sample::kRootXMLNodeName = "Sample";


bool SampleFragRef::isValid() const
{
	return mSample && mFrag >= 0 && mFrag < mSample->mFragments.size();
}

bool SampleFragRef::isValidIn( SampleRef inSample ) const
{
	return mSample && mSample==inSample && mFrag >= 0 && mFrag < mSample->mFragments.size();
}

bool SampleFragRef::isa( SampleRef s, int frag ) const
{
	SampleFragRef p;
	p.set(s,frag);
	
	do
	{
		if ( *this == p ) return true;
	}
	while ( p.setToOrigin() );
	
	return false;
} 

bool SampleFragRef::setToOrigin()
{
	if ( isValid() )
	{
		if ( mSample->mFragments[mFrag].mOriginSample )
		{
			SampleRef s = mSample->mFragments[mFrag].mOriginSample;
			int		  f = mSample->mFragments[mFrag].mOriginSampleFrag;
			
			mSample = s;
			mFrag   = f;
			
			return true; 
		}
	}
	
	return false;
}

bool SampleFragRef::setToRoot()
{
	bool changed=false;
	
	while (setToOrigin())
	{
		changed=true;
	};
	
	return changed;
}

void Sample::clearDyes()
{
	for(int i=0; i<mFragments.size(); ++i )
	{
		if ( mFragments[i].mDye >= 0 ) mFragments[i].mMass = 0.f; 
	}
}

void Sample::removeDyes()
{
	for( int i=0; i<mFragments.size(); )
	{
		if ( mFragments[i].mDye >= 0 )
		{
			mFragments[i] = mFragments.back();
			mFragments.pop_back();
		}
		else ++i;
	}
}

void Sample::mergeDuplicateDyes()
{
	if ((0)) cout << "mergeDuplicateDyes pre " << endl << toXml() << endl;
	
	// prioritize keeping indexing stable, so only remove
	// (flatten down) newer (higher index) entries.
	
	// scan
	vector<float> sum  (Dye::kCount,0.f);
	vector<int>   count(Dye::kCount,0);
	vector<bool>  cull( mFragments.size(), false );
	
	for( int i=0; i<mFragments.size(); ++i )
	{
		int dye = mFragments[i].mDye;
		
		if (dye != -1)
		{
			if ( count[dye] > 0 ) cull[i] = true;
			
			sum  [ dye ] += mFragments[i].mMass;
			count[ dye ]++;
		}
	}
	
	// flatten
	const auto oldf = mFragments; 
	
	mFragments.clear();
	
	for( int i=0; i<oldf.size(); ++i )
	{
		if ( !cull[i] )
		{
			Fragment f = oldf[i];
			
			if (f.mDye != -1) {
				f.mMass = sum[f.mDye];
				f.mMass = min( Dye::kMaxMass, f.mMass );
			}
			
			mFragments.push_back(f);
		}
	}
	
	if ((0)) cout << "mergeDuplicateDyes post " << endl << toXml() << endl;
	
	// 

	// problem with below is that we reindex everything
	// which confuses everybody.
	/*
	auto d = getDyes(); // sums any duplicates
	
	removeDyes();
	
	for ( int i=0; i<Dye::kCount; ++i )
	{
		d[i] = min( d[i], Dye::kMaxMass );
		
		setDye(i,d[i]);
	}*/
}

int Sample::findDye( int dye ) const
{
	assert( Dye::isValidDye(dye) );
	
	for(int i=0; i<mFragments.size(); ++i )
	{
		if ( mFragments[i].mDye==dye ) return i;
	}
	return -1;
}

void Sample::setDye( int dye, float val )
{
	assert( Dye::isValidDye(dye) );

	int i = findDye(dye);
	
	if (i==-1)
	{
		Fragment f;
		f.mDye  = dye;
		f.mMass = val;
		mFragments.push_back(f);
	}
	else mFragments[i].mMass = val;
}

float Sample::getDye( int dye ) const
{
	assert( Dye::isValidDye(dye) );

	int i = findDye(dye);
	if (i==-1) return 0.f;
	else return mFragments[i].mMass;
}

std::vector<float> Sample::getDyes() const
{
	vector<float> d(Dye::kCount,0.f);
	
	for(int i=0; i<mFragments.size(); ++i )
	{
		if ( mFragments[i].mDye>=0 )
		{
			assert( Dye::isValidDye(mFragments[i].mDye) );
			
			d[mFragments[i].mDye] += mFragments[i].mMass;
		}
	}
	
	return d;
}

void Sample::setDyes( const std::vector<float> &dyes )
{
	assert( dyes.size() <= Dye::kCount );
	
	for( int i=0; i<dyes.size(); ++i )
	{
		setDye( i, dyes[i] );
	}
}

void Sample::degrade( float d ) {
	for ( auto& f : mFragments ) f.mDegrade = std::min( 2.f, f.mDegrade + d );
}

int Sample::cloneFragment( int f )
{
	assert( isValidFragment(f) );
	mFragments.push_back( mFragments[f] );
	return (int)mFragments.size()-1;
}

void Sample::removeFragment( int f )
{
	assert( isValidFragment(f) );
	mFragments[f] = mFragments.back();
	mFragments.pop_back();
}


void
Sample::loadXml( const XmlTree& xml )
{
	clearDyes();
	mFragments.clear();
	
	if ( !xml.hasChild(kRootXMLNodeName) )
	{
		cout << "Sample::loadXml no " << kRootXMLNodeName << " root node" << endl;
	}
	else
	{
		XmlTree root = xml.getChild(kRootXMLNodeName);
		
		mName			= root.getAttributeValue("name", string() );
		mIconFileName	= root.getAttributeValue("icon", string() );
		mIconScale		= root.getAttributeValue("iconScale", 1.f );
		
		auto childAttrValue = []( const XmlTree& xml, std::string child, auto def )
		{
			if ( xml.hasChild(child) )
			{
				auto j = xml.getChild(child);
				def = j.getAttributeValue("value",def);
			}
			
			return def;
		};

		auto childAttrValueColor = []( const XmlTree& xml, std::string child, Color def )
		{
			if ( xml.hasChild(child) )
			{
				auto j = xml.getChild(child);
				string s = j.getAttributeValue("value",string("000000"));
				
				def = Color::hex( (int)strtoul( s.data(), 0, 16 ) );
			}
			
			return def;
		};
		
		for ( auto i = root.begin("Fragment"); i != root.end(); ++i )
		{
			Fragment k;
			
			k.mBases	= childAttrValue( *i, "Bases",		k.mBases	);
			k.mMass		= childAttrValue( *i, "Mass",		k.mMass		);
			k.mDegrade	= childAttrValue( *i, "Degrade",	k.mDegrade	);
			
			k.mColor	= childAttrValueColor( *i, "Color",		k.mColor	);
			
			// multimer aggregates
			for( auto m = i->begin("Aggregate"); m != i->end(); ++m )
			{
				if ( m->hasAttribute("Size") && m->hasAttribute("Weight") )
				{
					int   s = m->getAttributeValue<int>("Size");
					float w = m->getAttributeValue<int>("Weight");
					
					if ( k.mAggregate.size() < s ) k.mAggregate.resize(s,0.f);
					
					k.mAggregate[s] = w;
				}
				else cerr << "ERROR Sample::loadXml malformed <Aggregate> node; needs Size and Weight attributes." << endl;
			}
			
			mFragments.push_back(k);
			
			if ((0))
			{
				cout << "Fragment bases=" << k.mBases << " mass=" << k.mMass << " degrade=" << k.mDegrade << endl;
			}		
		}
	}
}

ci::XmlTree
Sample::toXml() const
{
	ci::XmlTree xml(Sample::kRootXMLNodeName,"");

	xml.setAttribute("name",		mName);
	xml.setAttribute("icon",		mIconFileName);
	xml.setAttribute("iconScale",	mIconScale);
	xml.setAttribute("id",			mID);
	
	auto addChildAttrValue = []( XmlTree& x, string child, string value )
	{
		XmlTree c(child,"");
		c.setAttribute("value",value);
		x.push_back(c);
	};
	
	for( auto f : mFragments )
	{
		XmlTree fx ("Fragment","");
		
		addChildAttrValue( fx, "Bases",		toString(f.mBases) );
		addChildAttrValue( fx, "Mass",		toString(f.mMass) );
		addChildAttrValue( fx, "Degrade",	toString(f.mDegrade) );
		
		addChildAttrValue( fx, "Dye",		toString(f.mDye) );
		addChildAttrValue( fx, "AspectRatio",	 toString(f.mAspectRatio) );
		addChildAttrValue( fx, "Color",		toString(f.mColor) );

		addChildAttrValue( fx, "OriginSample",	 toString(f.mOriginSample.get()) );
		addChildAttrValue( fx, "OriginSampleFrag",	 toString(f.mOriginSampleFrag) );
		
		if ( !f.mAggregate.empty() )
		{
			XmlTree ax("Aggregate","");
			
			for( int i=0; i<f.mAggregate.size(); ++i )
			{
				XmlTree mx("a","");
				mx.setAttribute("size",i);
				mx.setAttribute("mass",f.mAggregate[i]);
				ax.push_back(mx);
			}
			
			fx.push_back(ax);
		}
		
		xml.push_back(fx);
	}

	xml.push_back( mBuffer.toXml() );	
	
	return xml;
}
