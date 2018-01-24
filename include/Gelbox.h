//
//  Gelbox.h
//  Gelbox
//
//  Created by Chaim Gingold on 1/24/18.
//
//

#pragma once

inline ci::vec2 snapToPixel ( ci::vec2 p )
{
	return ci::vec2( roundf(p.x), roundf(p.y) );
}

inline ci::Rectf snapToPixel( ci::Rectf r )
{
	// from upper left
	
	ci::vec2 s = r.getSize();
	ci::vec2 ul = snapToPixel(r.getUpperLeft());
	
	ul = snapToPixel(ul);
//	s = snapToPixel(s);
	
	return ci::Rectf( ul, ul + s );
};
