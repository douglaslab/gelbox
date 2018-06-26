//
//  Layout.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 3/5/18.
//
//

#include "Layout.h"
#include "Config.h"

using namespace std;
using namespace ci;

	  Layout  gLayout;
const Layout &kLayout = gLayout;

ci::gl::TextureRef Layout::uiImage( string name, int* oScaleFactor ) const
{
	return uiImageWithPath( app::getAssetPath(name), -1, oScaleFactor );
}

ci::gl::TextureRef Layout::uiImage( fs::path stem, string name, int* oScaleFactor ) const
{
	return uiImageWithPath( app::getAssetPath(stem) / name, -1, oScaleFactor );
}

ci::gl::TextureRef Layout::uiImageWithPath( fs::path assetPath, int scaleFactor, int* oScaleFactor ) const
{	
	// auto-pick size
	if ( scaleFactor == -1 ) {
		scaleFactor = (ci::app::getWindowContentScale()==2) ? 2 : 1;
		
		// try higher size, default to lower
		if (scaleFactor != 1) {
			ci::gl::TextureRef r = uiImageWithPath(assetPath,scaleFactor,oScaleFactor);
			if (r) return r;
			else return uiImageWithPath(assetPath,1,oScaleFactor);
		}
	}

	if ( scaleFactor != 1 )
	{
		fs::path ext = assetPath.extension();
		fs::path pp  = assetPath.parent_path();
		fs::path fn  = assetPath.stem();
		
		string fn2 = fn.string() + ("@" + to_string(scaleFactor)) + "x" + ext.string();
		
		assetPath = pp / fn2; 
	}
			

	// load it
	auto i = mUIImages.find(assetPath);
	
	if (i==mUIImages.end())
	{
		try
		{
			mUIImages[assetPath] = gl::Texture::create( ::loadImage( assetPath ), gl::Texture2d::Format().mipmap() );
			if (oScaleFactor) *oScaleFactor = scaleFactor;
			return mUIImages[assetPath];
		}
		catch (...)
		{
			cerr << "ERROR loading '" << assetPath << "'" << endl;
			return 0;
		}
	}
	else
	{
		if (oScaleFactor) *oScaleFactor = scaleFactor;
		return i->second;
	}
}

ci::fs::path Layout::sliderIconPath() const
{
	return app::getAssetPath("slider-icons");	
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

ci::gl::TextureRef Layout::renderSubhead( string str, int pixelScale ) const
{
	return renderText( str, Font(mSubheadFont,mSubheadFontSize*pixelScale), mSubheadFontColor );
}

ci::gl::TextureRef Layout::renderHead( string str, int pixelScale ) const
{
	return renderText( str, Font(mHeadFont,mHeadFontSize*pixelScale), mHeadFontColor );
}

ci::gl::TextureRef Layout::renderUI( string str, int pixelScale ) const
{
	return renderText( str, Font(mUIFont,mUIFontSize*pixelScale), mUIFontColor );
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

ci::Rectf Layout::layoutHeadingText( ci::gl::TextureRef tex, ci::vec2 offsetFromViewTopLeft, int pixelScale ) const
{
	Rectf r;
	
	r = Rectf( vec2(0.f), tex->getSize() / pixelScale );
	
	r += vec2( 0.f, -r.getSize().y );
	r += offsetFromViewTopLeft;
	r += vec2( 0.f, Font(kLayout.mHeadFont,kLayout.mHeadFontSize).getDescent() );
	
	r = snapToPixel( r );
	
	return r;
}
