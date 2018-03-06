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

ci::gl::TextureRef Layout::loadImage( ci::fs::path path, std::string name, ci::gl::TextureRef* r )
{
	ci::gl::TextureRef tr = r ? *r : 0;

	if ( !tr )
	{
		path = app::getAssetPath(path);
		
		try
		{
			
			tr = gl::Texture::create( ::loadImage( path / name ), gl::Texture2d::Format().mipmap() );
		}
		catch (...)
		{
			cerr << "ERROR loading '" << (path / name) << "'" << endl;
		}
	}
	
	if (r) *r=tr;	
	return tr;
}

ci::gl::TextureRef Layout::loadImage( string name, ci::gl::TextureRef* r )
{
	ci::gl::TextureRef tr = r ? *r : 0;

	if ( !tr )
	{
		try
		{
			tr = gl::Texture::create( ::loadImage( app::getAssetPath(name) ), gl::Texture2d::Format().mipmap() );
		}
		catch (...)
		{
			cerr << "ERROR loading '" << name << "'" << endl;
		}
	}
	
	if (r) *r=tr;	
	return tr;
}

ci::gl::TextureRef Layout::brace() const
{
	return loadImage("brace.png",&mBrace);
}

ci::gl::TextureRef Layout::settings() const
{
	return loadImage("settings.png",&mSettings);
}