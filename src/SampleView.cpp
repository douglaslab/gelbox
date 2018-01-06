//
//  SampleView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 1/5/18.
//
//

#include "SampleView.h"
#include "cinder/ConvexHull.h"
#include "cinder/Rand.h"

using namespace std;
using namespace ci;

SampleView::SampleView()
{
	mFragments = vector<Frag>{
		Frag( Color(.5,1,1), 5 ), 
		Frag( Color(1,.5,.5), 5 ),
		Frag( Color(.5,.5,1), 5 ),
		Frag( Color(.5,1,.8), 5 ) 
	};
	

}

void SampleView::draw()
{
	// draw callout behind
	if ( mCallout.size()>0 )
	{
		gl::ScopedModelMatrix m;
		
		gl::multModelMatrix( getParentToChildMatrix() );
		
		gl::color(1,1,1,.8);
		gl::drawSolid(mCallout);
	}	
	
	// bkgnd, frame
	gl::color(1,1,1);
	gl::drawSolidRect( getBounds() );
	gl::color(.5,.5,.5);
	gl::drawStrokedRect( getBounds() );
	
	// parts
	drawSim();
}

void SampleView::drawFrame()
{
}

void SampleView::updateCallout()
{
	PolyLine2 p;

	p.push_back(getFrame().getUpperLeft());
	p.push_back(getFrame().getUpperRight());
	p.push_back(getFrame().getLowerRight());
	p.push_back(getFrame().getLowerLeft());
	p.push_back(mAnchor);
	
	p.setClosed();
	
	mCallout = calcConvexHull(p);
	mCallout.setClosed();
}

void SampleView::tick( float dt )
{
	tickSim(1.f);
}

void SampleView::tickSim( float dt )
{
	const float kFadeInStep = .1f; 
	const float kFadeOutStep = .2f; 
	const float kMaxAge = 30 * 5;
	
	const Rectf bounds = getBounds();
	
	// census
	vector<int> pop;
	vector<float> cullChance;
	cullChance.resize(mFragments.size(),0);
	pop.resize(mFragments.size(),0);

	
	for ( const auto &p : mParts )
	{
		if ( p.mFragment>=0 && p.mFragment<pop.size() )
		{
			pop[p.mFragment]++;
		}
	}
	
	// update population counts
	for( int f = 0; f<mFragments.size(); ++f )
	{
		int targetPop = 15;
		
		// make (1 this frame)
		if ( pop[f] < targetPop  )
		{
			Part p;
			
			p.mLoc  = vec2( randFloat(), randFloat() )
					* vec2( bounds.getSize() )
					+ bounds.getUpperLeft();
			p.mFace = randVec2();
			p.mVel  = randVec2() * .5f; 
			
			p.mAge += randInt(kMaxAge); // stagger ages to prevent simul-fadeout-rebirth
			
			p.mFragment = f;
			p.mRadius = mFragments[p.mFragment].mRadius ;
			
			mParts.push_back(p);
			
			pop[f]++;
		}
		
		// cull		
		if ( pop[f] > targetPop )
		{
			cullChance[f] = (float)(pop[f] - targetPop) / (float)targetPop;
		}
	}
	
	// update each
	for ( auto &p : mParts )
	{
		p.mAge += dt;
		
		if ( p.mAlive )
		{
			p.mFade = min( 1.f, p.mFade + kFadeInStep * dt );
			
			// maybe cull?
			if (   randFloat() < cullChance[p.mFragment]
				|| p.mAge > kMaxAge
				|| p.mFragment < 0 || p.mFragment >= mFragments.size()
//				|| ! bounds.inflated(vec2(p.mRadius)).contains( p.mLoc )
				)
			{
				p.mAlive = false;
			}
		}
		else
		{
			p.mFade = max( 0.f, p.mFade - kFadeOutStep * dt );
		}
		
		// move
		p.mLoc += p.mVel * dt;
		
		// wrap?
		if ( p.mLoc.x > bounds.x2 ) p.mLoc.x = bounds.x1 + (p.mLoc.x - bounds.x2); 
		if ( p.mLoc.x < bounds.x1 ) p.mLoc.x = bounds.x2 - (bounds.x1 - p.mLoc.x); 
		if ( p.mLoc.y > bounds.y2 ) p.mLoc.y = bounds.y1 + (p.mLoc.y - bounds.y2); 
		if ( p.mLoc.y < bounds.y1 ) p.mLoc.y = bounds.y2 - (bounds.y1 - p.mLoc.y); 
	}
	
	// cull dead ones
	mParts.erase( remove_if( mParts.begin(), mParts.end(),
		[]( const Part& p ) -> bool
	{
		return !p.mAlive && p.mFade == 0.f;
	}), mParts.end() );
}

void SampleView::drawSim()
{
	for ( const auto &p : mParts )
	{
		gl::color( ColorA( mFragments[p.mFragment].mColor, p.mFade ) );
		
		gl::drawSolidCircle( p.mLoc, p.mRadius );
	}
}
