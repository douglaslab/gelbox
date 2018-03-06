//
//  Layout.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 3/5/18.
//
//

#include "Layout.h"

using namespace std;
using namespace ci;

	  Layout  gLayout;
const Layout &kLayout = gLayout;

ci::gl::TextureRef Layout::uiImage( string name ) const
{
	return uiImageWithPath( app::getAssetPath(name) );
}

ci::gl::TextureRef Layout::uiImage( fs::path stem, string name ) const
{
	return uiImageWithPath( app::getAssetPath(stem) / name );
}

ci::gl::TextureRef Layout::uiImageWithPath( fs::path assetPath ) const
{
	auto i = mUIImages.find(assetPath);
	
	if (i==mUIImages.end())
	{
		try
		{
			mUIImages[assetPath] = gl::Texture::create( ::loadImage( assetPath ), gl::Texture2d::Format().mipmap() );
			return mUIImages[assetPath];
		}
		catch (...)
		{
			cerr << "ERROR loading '" << assetPath << "'" << endl;
			return 0;
		}
	}
	else return i->second;
}
