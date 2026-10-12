//
//  PolyClip.h
//  Gelbox
//
//  Replacement for PolyLine2::calcIntersection(), which Cinder removed along
//  with Boost.Geometry. Sutherland-Hodgman clipping: exact when the clip
//  polygon is convex, which is all Gelbox needs (an ellipse cut by a rectangle).
//

#pragma once

#include <vector>
#include "cinder/PolyLine.h"

//! Intersection of \a subject with the convex polygon \a clip. Returns an empty
//! polyline when the two do not overlap.
inline ci::PolyLine2 calcConvexIntersection( const ci::PolyLine2& subject, const ci::PolyLine2& clip )
{
	using ci::vec2;

	std::vector<vec2> out( subject.begin(), subject.end() );
	const std::vector<vec2>& c = clip.getPoints();
	if ( c.size() < 3 || out.size() < 3 ) return ci::PolyLine2();

	// orientation of the clip polygon decides which side of each edge is "inside"
	float area2 = 0.f;
	for ( size_t i = 0; i < c.size(); ++i ) {
		const vec2& a = c[i];
		const vec2& b = c[( i + 1 ) % c.size()];
		area2 += a.x * b.y - b.x * a.y;
	}
	const float sign = area2 >= 0.f ? 1.f : -1.f;

	auto side = [sign]( const vec2& a, const vec2& b, const vec2& p ) {
		return sign * ( ( b.x - a.x ) * ( p.y - a.y ) - ( b.y - a.y ) * ( p.x - a.x ) );
	};
	auto intersect = []( const vec2& a, const vec2& b, const vec2& p, const vec2& q ) {
		const vec2 r = b - a, s = q - p;
		const float denom = r.x * s.y - r.y * s.x;
		if ( denom == 0.f ) return p;
		const float t = ( ( a.x - p.x ) * s.y - ( a.y - p.y ) * s.x ) / -denom;
		return a + r * t;
	};

	for ( size_t i = 0; i < c.size() && !out.empty(); ++i )
	{
		const vec2& ea = c[i];
		const vec2& eb = c[( i + 1 ) % c.size()];

		std::vector<vec2> in;
		in.swap( out );

		for ( size_t j = 0; j < in.size(); ++j )
		{
			const vec2& cur  = in[j];
			const vec2& prev = in[( j + in.size() - 1 ) % in.size()];
			const bool curIn  = side( ea, eb, cur )  >= 0.f;
			const bool prevIn = side( ea, eb, prev ) >= 0.f;

			if ( curIn ) {
				if ( !prevIn ) out.push_back( intersect( ea, eb, prev, cur ) );
				out.push_back( cur );
			}
			else if ( prevIn ) {
				out.push_back( intersect( ea, eb, prev, cur ) );
			}
		}
	}

	ci::PolyLine2 result;
	if ( out.size() >= 3 ) {
		for ( auto& p : out ) result.push_back( p );
		result.setClosed();
	}
	return result;
}
