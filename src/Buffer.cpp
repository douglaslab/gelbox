//
//  Buffer.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 2/14/18.
//
//

#include "Buffer.h"

namespace Gelbox{

using namespace ci;

static gl::TextureRef sSliderIcons[Buffer::kNumParams];

gl::TextureRef Buffer::getParamSliderIcon( int i )
{
	string prefix("");
	string postfix(".png");
	
	assert( i >= 0 && i < Buffer::kNumParams );
	
	if ( ! sSliderIcons[i] )
	{
		fs::path iconPathBase = app::getAssetPath("slider-icons");
		fs::path path = iconPathBase / (prefix + string(kBufferParamIconName[i]) + postfix); 

		try {
			sSliderIcons[i] = gl::Texture::create( loadImage(path), gl::Texture2d::Format().mipmap() );
		}
		catch (...)
		{
			cerr << "ERROR Buffer::getParamSliderIcon failed to load icon " << path << endl;
		}
	}
	
	return sSliderIcons[i];
}


} // namespace Buffer