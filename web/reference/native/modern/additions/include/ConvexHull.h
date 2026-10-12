//
//  ConvexHull.h
//  Gelbox
//
//  Replacement for cinder/ConvexHull.h, which Cinder removed along with its
//  Boost dependency. Andrew's monotone chain; returns the hull as a closed
//  counter-clockwise PolyLine2 (collinear points dropped).
//

#pragma once

#include <algorithm>
#include <vector>
#include "cinder/PolyLine.h"

inline ci::PolyLine2 calcConvexHull( const ci::PolyLine2& poly )
{
	using ci::vec2;

	std::vector<vec2> pts( poly.begin(), poly.end() );
	std::sort( pts.begin(), pts.end(), []( const vec2& a, const vec2& b ) {
		return a.x < b.x || ( a.x == b.x && a.y < b.y );
	});
	pts.erase( std::unique( pts.begin(), pts.end() ), pts.end() );

	ci::PolyLine2 hull;
	if ( pts.size() < 3 ) {
		for ( auto& p : pts ) hull.push_back( p );
		hull.setClosed();
		return hull;
	}

	auto cross = []( const vec2& o, const vec2& a, const vec2& b ) {
		return ( a.x - o.x ) * ( b.y - o.y ) - ( a.y - o.y ) * ( b.x - o.x );
	};

	std::vector<vec2> h( 2 * pts.size() );
	size_t k = 0;

	for ( size_t i = 0; i < pts.size(); ++i ) {               // lower hull
		while ( k >= 2 && cross( h[k-2], h[k-1], pts[i] ) <= 0.f ) --k;
		h[k++] = pts[i];
	}
	for ( size_t i = pts.size() - 1, t = k + 1; i > 0; --i ) { // upper hull
		while ( k >= t && cross( h[k-2], h[k-1], pts[i-1] ) <= 0.f ) --k;
		h[k++] = pts[i-1];
	}
	h.resize( k - 1 ); // last point repeats the first

	for ( auto& p : h ) hull.push_back( p );
	hull.setClosed();
	return hull;
}
