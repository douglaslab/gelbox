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


// sim
const int kRandFragMinNumBases = 1;
const int kRandFragMaxNumBases = 14000;
const float kRandFragMaxAspect = 8.f;

// ui
const Color kSelectColor(0,0,0);
const Color kRolloverColor(1,1,0);
const float kOutlineWidth = 4.f;

const float kFadeInStep = .05f; 
const float kFadeOutStep = .05f; 
const float kMaxAge = 30 * 1000;
const float kJitter = .5f;

const float kPartMinPickRadius = 8.f;	

const float kNewBtnRadius = 53.f / 2.f;
const float kNewBtnGutter = 16.f;
const Color kNewBtnDownColor = Color(1.f,1.f,1.f)*.7f;		

const float kFragViewGutter = 16.f;

SampleView::SampleView()
{
	fs::path newBtnPath = "???";
	
	try
	{
		newBtnPath = getAssetPath("new-btn.png");
		
		mNewBtnImage = gl::Texture::create( loadImage(newBtnPath) );
	}
	catch (...)
	{
		cerr <<  "ERROR loading new btn image "  << newBtnPath << endl;
	}	
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
	{
		const bool hasMouseDown = getHasMouseDown() && pickNewBtn(getMouseDownLoc()) && pickNewBtn(getMouseLoc()); 
		
		if (mNewBtnImage)
		{
			if ( hasMouseDown ) gl::color(kNewBtnDownColor);
			else gl::color(1,1,1);
					
			gl::ScopedModelMatrix model;

			gl::translate( mNewBtnLoc - vec2(kNewBtnRadius) );
			
			gl::draw(mNewBtnImage);
		}
		else
		{
			if ( hasMouseDown ) gl::color(kNewBtnDownColor);
			else gl::color(.5,.5,.5);
			
			gl::drawSolidCircle(mNewBtnLoc, mNewBtnRadius);
		}
	}
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
	showFragmentEditor(mSelectedFragment);
}

void SampleView::showFragmentEditor( int i )
{
	if ( isFragment(i) )
	{
		openFragEditor();
		mFragEditor->setFragment( mSample, i );
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
		Part p = mParts[i]; // copy so we can inflate
		
		p.mRadius.x = max( p.mRadius.x, kPartMinPickRadius );
		p.mRadius.y = max( p.mRadius.y, kPartMinPickRadius );
		
		mat4 xform = glm::inverse( p.getTransform() );
		vec2 ploc = vec2( xform * vec4(loc,0,1) );
		
		if ( length(ploc) <= 1.f )
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
	// take keyboard focus
	getCollection()->setKeyboardFocusView( shared_from_this() );
}

void SampleView::mouseUp( ci::app::MouseEvent e )
{
	if ( getHasMouseDown() )
	{
		if ( pickNewBtn(e.getPos()) && pickNewBtn(getMouseDownLoc()) )
		{
			newFragment();
			selectFragment( mFragments.size()-1 );
		}
		else
		{
			// pick fragment
			selectFragment( pickFragment( rootToChild(e.getPos()) ) );
		}

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
	
	// fragment show on hover -- can enable/disable this feature on its own
	if (1)
	{
		if ( isFragment(mRolloverFragment) ) showFragmentEditor(mRolloverFragment);
		else showFragmentEditor(mSelectedFragment);  
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
			
			float r = lmap( (float)s.mBases, 0.f, 14000.f, 2.f, 32.f );
			
			f.mColor		= s.mColor;
			f.mRadius		= vec2( s.mAspectRatio, 1.f ) * r;
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
		f.mBases = lerp((float)kRandFragMinNumBases,(float)kRandFragMaxNumBases,randFloat()*randFloat());
		f.mMass  = randFloat();
		f.mAspectRatio = 1.f;
		
		if ( randInt() % 3 == 0 )
		{
			f.mAspectRatio = 1.f + (kRandFragMaxAspect-1.f) * randFloat();
		}
		
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
	vector<int> alivepop;
	vector<float> cullChance;
	cullChance.resize(mFragments.size(),0);
	pop.resize(mFragments.size(),0);
	alivepop.resize(mFragments.size(),0);
	
	for ( const auto &p : mParts )
	{
		if ( p.mFragment>=0 && p.mFragment<pop.size() )
		{
			pop[p.mFragment]++;
			if (p.mAlive) alivepop[p.mFragment]++;
		}
	}
	
	// update population counts
	for( int f = 0; f<mFragments.size(); ++f )
	{
		int targetPop = max( 1, mFragments[f].mTargetPop );
		
		// make (1 this frame)
		if ( alivepop[f] < targetPop  )
		{
			Part p;
			
			p.mLoc  = vec2( randFloat(), randFloat() )
					* vec2( bounds.getSize() )
					+ bounds.getUpperLeft();
			p.mVel  = randVec2() * .5f;
			
			p.mAge += randInt(kMaxAge); // stagger ages to prevent simul-fadeout-rebirth

			p.mAngle    = randFloat() * M_PI * 2.f;
			p.mAngleVel = randFloat(-1.f,1.f) * M_PI * .002f;
			
			p.mFragment = f;
			p.mRadius = mFragments[p.mFragment].mRadius ;
			p.mColor  = mFragments[p.mFragment].mColor ; 
			
			mParts.push_back(p);
			
			pop[f]++;
		}
		
		// cull		
		if ( alivepop[f] > targetPop )
		{
			cullChance[f] = (float)(alivepop[f] - targetPop) / (float)targetPop;
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
		
		p.mAngle += p.mAngleVel * dt;
		
		// wrap?
		if (0)
		{
			if ( p.mLoc.x > bounds.x2 ) p.mLoc.x = bounds.x1 + (p.mLoc.x - bounds.x2); 
			if ( p.mLoc.x < bounds.x1 ) p.mLoc.x = bounds.x2 - (bounds.x1 - p.mLoc.x); 
			if ( p.mLoc.y > bounds.y2 ) p.mLoc.y = bounds.y1 + (p.mLoc.y - bounds.y2); 
			if ( p.mLoc.y < bounds.y1 ) p.mLoc.y = bounds.y2 - (bounds.y1 - p.mLoc.y);
		}
		
		// kill if out of bounds
		if ( p.mAlive && ! bounds.inflated( vec2( max(p.mRadius.x, p.mRadius.y) ) ).contains( p.mLoc ) )
		{
			p.mAlive = false;
		}
		
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
	// clip
	ivec2 scissorLowerLeft, scissorSize; // (0,0) is lower left of window!
	
	{
		vec2 lowerLeftInRoot = childToRoot( getBounds().getLowerLeft() );
		
		scissorLowerLeft.x = lowerLeftInRoot.x;
		scissorLowerLeft.y = getWindowHeight() - lowerLeftInRoot.y; // invert y
		
		vec2 upperRightInRoot = childToRoot( getBounds().getUpperRight() );
		
		scissorSize.x = upperRightInRoot.x - lowerLeftInRoot.x;
		scissorSize.y = lowerLeftInRoot.y  - upperRightInRoot.y;
	}
	
	gl::ScopedScissor scissor( scissorLowerLeft, scissorSize );
	
	
	// draw parts
	for ( const auto &p : mParts )
	{
		gl::ScopedModelMatrix modelMatrix;
		gl::multModelMatrix( p.getTransform() );

		int nsegs = 32;
				
		gl::color( ColorA( p.mColor, p.mFade ) );
		
		gl::drawSolidCircle( vec2(0,0), 1.f, nsegs ); // fill
		if (p.mFade==1.f)
		{
			gl::drawStrokedCircle( vec2(0,0), 1.f, nsegs ); // outline for anti-aliasing... assumes GL_LINE_SMOOTH
		}
		
		const bool selected = isFragment(p.mFragment) && p.mFragment == mSelectedFragment;
		const bool rollover = isFragment(p.mFragment) && p.mFragment == mRolloverFragment;
		 
		if ( selected || rollover )
		{
			ColorA color;
			
			if (selected && rollover) color = ColorA( lerp( kSelectColor, kRolloverColor, .5f ), p.mFade );
			else color = selected ? ColorA(kSelectColor,p.mFade) : ColorA(kRolloverColor,p.mFade);
			
			gl::color( color );
			float lineWidth = kOutlineWidth / p.mRadius.x;
			gl::drawStrokedCircle( vec2(0,0), 1.f + lineWidth/2.f, lineWidth, nsegs );
			// i guess to get proportional line scaling we could draw a second circle and deform it appropriately...
			// not sure that would actually work though. easiest to just generate our own line shapes...
		}
	}
}

glm::mat4
SampleView::Part::getTransform() const
{
	mat4 xform;
	xform *= translate( vec3(mLoc,0) );
	xform *= glm::rotate( mAngle, vec3(0,0,1) );
	xform *= scale( vec3(mRadius.x,mRadius.y,1.f) );	
	return xform;
}