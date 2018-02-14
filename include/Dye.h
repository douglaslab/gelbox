//
//  Dye.h
//  Gelbox
//
//  Created by Chaim Gingold on 2/13/18.
//
//

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
	
	
	// names
	const string kNames[kCount] =
	{
		"Xylene cyanol",
		"Cresol red",
		"Bromphenol blue",
		"Orange G"
	};
	
	
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
	const char* kIconName[kCount] =
	{
		"xylene-cyanol",
		"cresol-red",
		"bromphenol-blue",
		"orange-g"
	};
	
	gl::TextureRef getSliderIcon( int );
	
};