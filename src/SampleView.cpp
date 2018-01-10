//
//  SampleView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 1/5/18.
//
//

#include "SampleView.h"
#include "FragmentView.h"
#include "cinder/ConvexHull.h"
#include "cinder/Rand.h"

using namespace std;
using namespace ci;
using namespace ci::app;


const Color kSelectColor(0,0,0);
const Color kRolloverColor(1,1,0);
const float kOutlineWidth = 4.f;

const float kFadeInStep = .05f; 
const float kFadeOutStep = .05f; 
const float kMaxAge = 30 * 30;
const float kJitter = .5f;

const float kPartMinPickRadius = 4.f;	

const float kNewBtnRadius = 24.f;
const float kNewBtnGutter = 16.f;

const float kFragViewGutter = 16.f;

SampleView::SampleView()
{
//	mFragments = vector<Frag>{
//		Frag( Color(.5,1,1), 5 ), 
//		Frag( Color(1,.5,.5), 10 ),
//		Frag( Color(.5,.5,1), 3 ),
//		Frag( Color(.5,1,.8), 7 ) 
//	};
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

	// focus
	if ( getHasKeyboardFocus() )
	{
		gl::color(1,1,.3,.35f);
		gl::drawStrokedRect(getBounds(),2.f);
	}
	
	// bkgnd, frame
	gl::color(1,1,1);
	gl::drawSolidRect( getBounds() );
	gl::color(.5,.5,.5);
	gl::drawStrokedRect( getBounds() );
	
	// parts
	drawSim();
	
	// new btn
	gl::color(.5,.5,.5);
	gl::drawSolidCircle(mNewBtnLoc, mNewBtnRadius);
}

void SampleView::drawFrame()
{
}

void SampleView::setBounds( ci::Rectf r )
{
	View::setBounds(r);
	
	mNewBtnRadius = kNewBtnRadius;
	mNewBtnLoc = getBounds().getLowerRight() + vec2(-mNewBtnRadius,mNewBtnRadius+kNewBtnGutter);
}

bool SampleView::pick( glm::vec2 p ) const
{
	return View::pick(p) || pickNewBtn(p);
}

bool SampleView::pickNewBtn( glm::vec2 p ) const
{
	return distance( parentToChild(p), mNewBtnLoc ) <= mNewBtnRadius;
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

void SampleView::selectFragment( int i )
{
	mSelectedFragment = i;
	
	if ( isFragment(mSelectedFragment) )
	{
		openFragEditor();
		mFragEditor->setFragment( mSample, mSelectedFragment );
	}
	else closeFragEditor();
}

void SampleView::openFragEditor()
{
	if ( !mFragEditor )
	{
		mFragEditor = make_shared<FragmentView>();
		
		vec2 center;
		Rectf frame(-.5,-.5,.5,.5);
		frame.scaleCentered(kFragmentViewSize);
		frame.offsetCenterTo(
			vec2( getFrame().getX2(), getFrame().getCenter().y )
			+ vec2( frame.getWidth()/2.f + kFragViewGutter, 0 )
			);
		
		mFragEditor->setFrameAndBoundsWithSize( frame );
		
		getCollection()->addView(mFragEditor);
	}
}

void SampleView::closeFragEditor()
{
	if ( mFragEditor )
	{
		getCollection()->removeView(mFragEditor);
		mFragEditor = 0;
	}
}

int  SampleView::pickPart( vec2 loc ) const
{
	// in reverse, so pick order matches draw order 
	for( int i=mParts.size()-1; i>=0; --i )
	{
		const Part& p = mParts[i];
		
		if ( distance(p.mLoc,loc) <= max(p.mRadius,kPartMinPickRadius) )
		{
			return i;
		}
	}
	
	return -1;
}

int  SampleView::pickFragment( vec2 loc ) const
{
	int p = pickPart(loc);
	
	if ( p == -1 ) return -1;
	else return mParts[p].mFragment; 
}

void SampleView::mouseDown( ci::app::MouseEvent e )
{
	if ( pickNewBtn(e.getPos()) )
	{
		newFragment();		
		selectFragment( mFragments.size()-1 );
	}
	else
	{
		// pick fragment
		selectFragment( pickFragment( rootToChild(e.getPos()) ) );

		// take keyboard focus
		getCollection()->setKeyboardFocusView( shared_from_this() );
	}
}

void SampleView::keyDown( ci::app::KeyEvent e )
{
	if ( e.getCode() == KeyEvent::KEY_BACKSPACE || e.getCode() == KeyEvent::KEY_DELETE )
	{
		if ( isFragment(mSelectedFragment) )
		{
			int which = mSelectedFragment;
			selectFragment(-1);
			deleteFragment( which );
		}
	}
}

void SampleView::tick( float dt )
{
	syncToModel();

	tickSim( (getHasRollover() && !pickNewBtn(getMouseLoc()) ) ? .1f : 1.f );
	
	// rollover
	mRolloverFragment = pickFragment( rootToChild(getMouseLoc()) );
	
	// deselect?
	if ( isFragment(mSelectedFragment) && !getHasKeyboardFocus() )
	{
		selectFragment(-1);
	}
}

void SampleView::syncToModel()
{
	if (mSample)
	{
		mFragments.resize( mSample->mFragments.size() );
		
		for( int i=0; i<mFragments.size(); ++i )
		{
			Frag &f = mFragments[i];
			auto  s = mSample->mFragments[i];
			
			f.mColor		= s.mColor;
			f.mRadius		= lmap( (float)s.mBases, 0.f, 14000.f, 2.f, 32.f );
			f.mTargetPop	= max( 1.f, s.mMass * 50.f ); // ??? just assuming 0..1 for now 
		}
	}
}

void SampleView::newFragment()
{
	if (mSample)
	{
		Sample::Fragment f;
		
		auto colors = FragmentView::getColorPalette();
		
		f.mColor = colors[ randInt() % colors.size() ];
		f.mBases = lerp(1.f,14000.f,randFloat()*randFloat());
		f.mMass  = randFloat();
		
		mSample->mFragments.push_back(f);
		
		syncToModel();
	}
	else
	{
		Frag f( ci::Color(randFloat(),randFloat(),randFloat()), lerp(2.f,16.f,randFloat()*randFloat()) );
		mFragments.push_back(f);
	}
}

void SampleView::deleteFragment( int i )
{
	syncToModel();
	
	if ( i >= 0 && i < mFragments.size() )
	{
		// fade out particles
		for ( auto &p : mParts )
		{
			if ( p.mFragment==i )
			{
				p.mFragment = -1;
			}
		}

		// remove from our list
		int from, to;
		
		from = mFragments.size()-1;
		to   = i;
		
		mFragments[to] = mFragments[from];
		mFragments.pop_back();
		
		// remove from mSample
		if (mSample)
		{
			assert( mFragments.size()+1 == mSample->mFragments.size() ); // +1 since we just popped it

			mSample->mFragments[to] = mSample->mFragments[from];
			mSample->mFragments.pop_back();
		}
		
		// reindex
		for ( auto &p : mParts )
		{
			if ( p.mFragment==from )
			{
				p.mFragment = to;
			}
		}		
	}
}

void SampleView::tickSim( float dt )
{
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
		int targetPop = max( 1, mFragments[f].mTargetPop );
		
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
			p.mColor  = mFragments[p.mFragment].mColor ; 
			
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
		// try get fragment
		Frag* frag=0;
		if ( isFragment(p.mFragment) ) frag = &mFragments[p.mFragment];
		
		// age
		p.mAge += dt;
		
		if ( p.mAlive )
		{
			p.mFade = min( 1.f, p.mFade + kFadeInStep * dt );
			
			// maybe cull?
			if (   !frag
				|| p.mAge > kMaxAge
				|| randFloat() < cullChance[p.mFragment] // ok to index bc of !frag test above
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
		p.mLoc += randVec2() * randFloat() * kJitter * dt;
		
		// wrap?
		if ( p.mLoc.x > bounds.x2 ) p.mLoc.x = bounds.x1 + (p.mLoc.x - bounds.x2); 
		if ( p.mLoc.x < bounds.x1 ) p.mLoc.x = bounds.x2 - (bounds.x1 - p.mLoc.x); 
		if ( p.mLoc.y > bounds.y2 ) p.mLoc.y = bounds.y1 + (p.mLoc.y - bounds.y2); 
		if ( p.mLoc.y < bounds.y1 ) p.mLoc.y = bounds.y2 - (bounds.y1 - p.mLoc.y);
		
		// sync to frag
		if (frag)
		{
			p.mColor	= lerp( p.mColor,  frag->mColor,  .5f );
			p.mRadius	= lerp( p.mRadius, frag->mRadius, .5f );
		} 
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
		gl::color( ColorA( p.mColor, p.mFade ) );
		
		gl::drawSolidCircle( p.mLoc, p.mRadius ); // fill
		if (p.mFade==1.f)
		{
			gl::drawStrokedCircle( p.mLoc, p.mRadius ); // outline for anti-aliasing... assumes GL_LINE_SMOOTH
		}
		
		const bool selected = isFragment(p.mFragment) && p.mFragment == mSelectedFragment;
		const bool rollover = isFragment(p.mFragment) && p.mFragment == mRolloverFragment;
		 
		if ( selected || rollover )
		{
			ColorA color = selected ? ColorA(kSelectColor,p.mFade) : ColorA(kRolloverColor,p.mFade);
			gl::color( color );
			gl::drawStrokedCircle( p.mLoc, p.mRadius + kOutlineWidth/2.f, kOutlineWidth );
		}
	}
}
