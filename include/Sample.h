//
//  Sample.h
//  Gelbox
//
//  Created by Chaim Gingold on 12/5/17.
//
//

#pragma once

#include <vector>
#include "cinder/Rand.h"
#include "cinder/Xml.h"
#include "cinder/Json.h"
#include "Dye.h"
#include "Buffer.h"
#include "Aggregate.h"

class Sample;
typedef std::shared_ptr<Sample> SampleRef;

class SampleFragRef
{
public:
	SampleFragRef() {}
	SampleFragRef( SampleRef s, int frag ) { set(s,frag); }
	
	void clear() { mSample=0; mFrag=-1; }
	
	void set( SampleRef s, int frag ) { mSample=s; mFrag=frag; }
	bool is ( SampleRef s, int frag ) const { return mSample==s && mFrag==frag; } 
	bool isa( SampleRef s, int frag ) const; // is identical, or is (s,frag) derived from this 
		// e.g. x->isa(s,f) means is x equal to or a parent of (s,f)
		
	bool isValid() const;
	bool isValidIn( SampleRef inSample ) const;
	
	SampleRef getSample() const { return mSample; }
	int		  getFrag()   const { return mFrag; }
	
	bool setToOrigin(); // returns true if changed
	bool setToRoot();

	bool operator==(const SampleFragRef &rhs) const {
		return mSample == rhs.mSample && mFrag == rhs.mFrag ;
	}
		
private:
	SampleRef	mSample;
	int			mFrag = -1;
};
typedef std::shared_ptr<SampleFragRef> SampleFragRefRef; // :D it is a pointer-pointer after all

class Sample
{
public:

	class Fragment
	{
	public:
		int   mBases		= 0;   // base count
		
		float mMass			= 0.f; // ng
		
		float mDegrade		= 0.f; // 0..2
		
		int   mDye			= -1; // if >=0, then this fragment is a dye, and this is which dye. mMass will indicate how much of the dye there is.
		
		Aggregate mAggregate;
		
		float mAspectRatio	= 1.f;
		ci::Color mColor	= ci::Color(.5,.5,.5);
		
		// tracking parentage across sample derivatives
		// -- e.g. for a loupe into a band of another sample
		//		in that case, loupe peers into a new sample that is derived from
		//		a larger sample defining an entire lane
		SampleRef mOriginSample;
		int		  mOriginSampleFrag=-1;
		
		// derived properties
		bool isDye() const { return mDye != -1; }		
	};

	std::vector<Fragment>	mFragments;
	Gelbox::Buffer			mBuffer = Gelbox::kBufferPresets[Gelbox::kBufferDefaultPreset];
	
	std::string				mName;
	int						mID = -1;
	
	std::string				mIconFileName;
	float					mIconScale=1.f;
	
	
	
	
	Sample() { clearDyes(); }
	Sample( const ci::XmlTree& xml ) { loadXml(xml); }

	int		findDye( int dye ) const;
	void	setDye ( int dye, float val );	
	float	getDye ( int dye ) const;
	std::vector<float> getDyes() const;
	void	setDyes( const std::vector<float>& );
	void	clearDyes(); // set all to zero
	void	removeDyes(); // remove all dyes
	void	mergeDuplicateDyes();
	
	void	degrade( float d );
	
	int		cloneFragment( int f );	
	void	removeFragment( int f );
	
	bool	isValidFragment( int f ) const { return f >=0 && f < mFragments.size(); }
	
	void	loadXml( const ci::XmlTree& ); // clears existing mFragments, mDyes first
	ci::XmlTree  toXml() const;
	ci::JsonTree toJson() const;
	static SampleRef fromJson( const ci::JsonTree& );		 
	
	static const std::string kRootXMLNodeName;
	
};
