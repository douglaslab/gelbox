//
//  Buffer.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 2/14/18.
//
//

#include "Buffer.h"
#include "Layout.h"

namespace Gelbox{

using namespace ci;

static gl::TextureRef sSliderIcons[Buffer::kNumParams];

gl::TextureRef Buffer::getParamSliderIcon( int i )
{
	// this should probably be in Layout.h, not calling into it.
	
	string prefix("");
	string postfix(".png");
	
	assert( i >= 0 && i < Buffer::kNumParams );
	
	if ( ! sSliderIcons[i] )
	{
		fs::path iconPathBase = kLayout.sliderIconPath();
		fs::path path = iconPathBase / (prefix + string(kBufferParamIconName[i]) + postfix); 
		
		return kLayout.uiImageWithPath(path);
	}
	
	return sSliderIcons[i];
}

ci::XmlTree Buffer::toXml() const
{
	XmlTree xml("Buffer","");
	
	for( int i=0; i<kNumParams; ++i )
	{
		XmlTree b("b","");
		b.setAttribute("name", kBufferParamName[i]);
		b.setAttribute("mass", mValue[i]);
	}
	
	return xml;
}

} // namespace Buffer
