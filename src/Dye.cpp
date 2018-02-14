//
//  Dye.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 2/13/18.
//
//

#include "Dye.h"

namespace Dye{

static gl::TextureRef sSliderIcons[kCount];

gl::TextureRef getSliderIcon( int i )
{
	string prefix("dye-");
	string postfix("-3d-spheres.png");
	
	assert( i >= 0 && i < kCount );
	
	if ( ! sSliderIcons[i] )
	{
		fs::path iconPathBase = app::getAssetPath("slider-icons");
		fs::path path = iconPathBase / (prefix + string(kIconName[i]) + postfix); 

		try {
			sSliderIcons[i] = gl::Texture::create( loadImage(path), gl::Texture2d::Format().mipmap() );
		}
		catch (...)
		{
			cerr << "ERROR Dye::getSliderIcon failed to load icon " << path << endl;
		}
	}
	
	return sSliderIcons[i];
}


} // namespace Dye