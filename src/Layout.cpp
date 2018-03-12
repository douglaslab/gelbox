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

ci::Rectf Layout::layoutBrace( ci::Rectf inRect ) const
{
	Rectf r;
	
	r = Rectf( vec2(0.f), mBraceSize );
	r += vec2( vec2(0.f,inRect.getCenter().y) - vec2(0.f,r.getCenter().y) );
	r = snapToPixel(r);
	
	return r;	
}

vec2 Layout::snapToPixel ( vec2 p ) const
{
	return vec2( roundf(p.x), roundf(p.y) );
}

Rectf Layout::snapToPixel( Rectf r ) const
{
	// from upper left
	
	vec2 s = r.getSize();
	vec2 ul = snapToPixel(r.getUpperLeft());
	
	ul = snapToPixel(ul);
//	s = snapToPixel(s);
	
	return Rectf( ul, ul + s );
};

ci::gl::TextureRef Layout::renderSubhead( string str ) const
{
	return renderText( str, Font(mSubheadFont,mSubheadFontSize), mSubheadFontColor );
}

ci::gl::TextureRef Layout::renderHead( string str ) const
{
	return renderText( str, Font(mHeadFont,mHeadFontSize), mHeadFontColor );
}

ci::gl::TextureRef Layout::renderUI( string str ) const
{
	return renderText( str, Font(mUIFont,mUIFontSize), mUIFontColor );
}

ci::gl::TextureRef Layout::renderText ( std::string str, const ci::Font& font, ci::ColorA color ) const
{
	TextLayout label;
	label.clear( ColorA(1,1,1,0) );
	label.setColor( color );
	label.setFont( font );
	label.addLine(str);
	return gl::Texture::create(label.render(true));	
}

ci::Rectf Layout::layoutHeadingText( ci::gl::TextureRef tex, ci::vec2 offsetFromViewTopLeft ) const
{
	const int pixelsPerPt = 1;
	
	Rectf r;
	
	r = Rectf( vec2(0.f), tex->getSize() * pixelsPerPt );
	
	r += vec2( 0.f, -r.getSize().y );
	r += offsetFromViewTopLeft;
	r += vec2( 0.f, Font(kLayout.mHeadFont,kLayout.mHeadFontSize).getDescent() );
	
	r = snapToPixel( r );
	
	return r;
}
