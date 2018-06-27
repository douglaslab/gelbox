//
//  Dye.h
//  Gelbox
//
//  Created by Chaim Gingold on 2/13/18.
//
//

#ifndef __DYE_H__ // for some reason #pragma once doesn't work here :P
#define __DYE_H__

#pragma once

#include "cinder/gl/Texture.h"
#include "cinder/Color.h"

namespace Dye
{
	using namespace std;
	using namespace ci;
	
	
	// enums
	const int kXyleneCyanol	  = 0;
	const int kCresolRed	  = 1;
	const int kBromphenolBlue = 2;
	const int kOrangeG		  = 3;
	
	const int kCount		  = 4;
	
	inline bool isValidDye( int dye )
	{
		return dye >= 0 && dye < kCount;
	}
	
	// misc
	const float kMaxMass = 125.f;
	
	// names
	const string kNames[kCount] =
	{
		"Xylene cyanol",
		"Cresol red",
		"Bromphenol blue",
		"Orange G"
	};
	
	inline int nameToDye( std::string name )
	{
		for( int i=0; i < kCount; ++i )
		{
			if ( kNames[i] == name ) return i;
		}
		return -1;
	}
	
	// colors
	const Color kColors[kCount] =
	{
		Color::hex(0x00AFE2),
		Color::hex(0x985D93),
		Color::hex(0xB3A7D3),
		Color::hex(0xFACB01)
	};
	
	
	// sizes
	const int kBPLo[kCount] =
	{
		6000,
		700,
		300,
		50
	};

	const int kBPHi[kCount] =
	{
		7000,
		900,
		500,
		100
	};

	
	// icons
	const string kIconName[kCount] =
	{
		"Xylene",
		"Cresol",
		"Bromphenol",
		"Orange G"
	};
	
};

#endif
