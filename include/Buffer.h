//
//  Buffer.h
//  Gelbox
//
//  Created by Chaim Gingold on 2/14/18.
//
//

#pragma once

#include <memory>
#include "cinder/gl/Texture.h"
#include "cinder/Xml.h"
#include "cinder/Json.h"

namespace Gelbox
{

using namespace std;

class Buffer;
typedef std::shared_ptr<Buffer> BufferRef;

class Buffer
{
public:
	
	Buffer(){}
	Buffer( const ci::JsonTree& );
	
	// params
	static const int kTris    = 0;
	static const int kBorate  = 1;
	static const int kAcetate = 2;
	static const int kEDTA	  = 3;
	
	static const int kNumParams = 4; 
	
	
	// state
	union
	{
		struct
		{
			float mTris		= 0.f; // 0..200 mM
			float mBorate	= 0.f; // 0..200 mM
			float mAcetate  = 0.f; // 0..200 mM
			float mEDTA		= 0.f; // 0.. 10 mM
		};
		
		float mValue[4];
	};
	
	
	// preset primitives
	static Buffer TBE()
	{
		Buffer b;
		b.mTris		= 89.f;
		b.mBorate	= 89.f;
		b.mEDTA		= 2.f;
		return b;
	}

	static Buffer TAE()
	{
		Buffer b;
		b.mTris		= 40.f;
		b.mAcetate	= 20.f;
		b.mEDTA		= 1.f;
		return b;
	}

	static Buffer h2o()
	{
		Buffer b;
		b.mTris		= 0.f;
		b.mAcetate	= 0.f;
		b.mEDTA		= 0.f;
		return b;
	}
	
	// xml
	ci::XmlTree  toXml() const;
	ci::JsonTree toJson() const;

	// icons
	ci::gl::TextureRef getParamSliderIcon( int );

	// misc
	bool operator==(const Buffer &rhs) const {
		for( int i=0; i<kNumParams; ++i )
		{
			if ( rhs.mValue[i] != mValue[i] ) return false;
		}
		return true;
	}

};

inline Buffer operator* ( float s, Buffer b )
{
	for( int i=0; i<4; ++i ) b.mValue[i] *= s;
	return b;
}

inline Buffer operator* ( Buffer b, float s )
{
	for( int i=0; i<4; ++i ) b.mValue[i] *= s;
	return b;
}

// min/max
const float kBufferParamMax[Buffer::kNumParams] =
{
	200,
	200,
	200,
	10
};

// names
const string kBufferParamName[Buffer::kNumParams] =
{
	"Tris",
	"Borate",
	"Acetate",
	"EDTA"
};

const string kBufferParamIconName[Buffer::kNumParams] =
{
	"Tris",
	"Borate",
	"Acetate",
	"EDTA"
};

// presets
const int kBufferNumPresets = 3;
const int kBufferDefaultPreset = 1;

const string kBufferPresetNames[kBufferNumPresets] =
{
	"H2O",
	".5x TBE",
	"1x TAE"
};

const Buffer kBufferPresets[kBufferNumPresets] =
{
	Buffer::h2o(),
	Buffer::TBE() * .5f,
	Buffer::TAE()
};


}; // namespace Gelbox
