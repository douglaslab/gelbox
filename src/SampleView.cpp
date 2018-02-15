//
//  SampleView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 1/5/18.
//
//

#include "cinder/ConvexHull.h"
#include "cinder/Rand.h"

#include "SampleView.h"
#include "FragmentView.h"
#include "GelView.h"
#include "GelSim.h"

using namespace std;
using namespace ci;
using namespace ci::app;


// sim
const int kRandFragMinNumBases = 1;
const int kRandFragMaxNumBases = 14000;
const float kRandFragMaxAspect = 8.f;
const bool  kPartSimIsOldAgeDeathEnabled = false;
const int kNumPartsPerMassHigh = 50;

const int kNewFragNumAggregateBands = 7;
	// magic number we are copying from # notches in sample view...
	// !! TODO: pull out into a const !!

// ui
const Color kSelectColor(0,0,0);
const Color kRolloverColor(1,1,0);
const float kOutlineWidth = 4.f;

const float kFadeInStep = .05f; 
const float kFadeOutStep = .05f;
const float kMaxAge = 30 * 1000;

const float kLoupeRadius = 16.f * .65f;
const bool  kCanPickCalloutWedge = true;
const bool  kLoupePartsSelectable = true;

// mitigate dithering artifacts by being lenient / less aggressive with aggregate culling
const float kAggregateCullChanceScale = (1.f / 30.f) * .5f;
const int   kAggregateCullPopEps = 0;
const float kMaxAgeMisfitAggregate = 30 * 30;
 
const float kJitter = .75f;

const float kPartMinPickRadius = 8.f;	

const float kNewBtnRadius = 53.f / 2.f;
const float kNewBtnGutter = 16.f;
const Color kNewBtnDownColor = Color(1.f,1.f,1.f)*.7f;

const float kFragViewGutter = 16.f;

void drawThickStrokedCircle( vec2 p, float r, float thickness )
{
	gl::drawStrokedCircle( p, r, thickness );
	
	if (thickness > 1.f)
	{
		gl::drawStrokedCircle( p, r - thickness/2 ); // use this call, has anti-aliasing
		gl::drawStrokedCircle( p, r + thickness/2 ); // use this call, has anti-aliasing
	}
}

SampleView::SampleView()
{
	mSelection = make_shared<SampleFragRef>();
	mRollover  = make_shared<SampleFragRef>();
	mHighlight = make_shared<SampleFragRef>();
	
	mRand.seed( randInt() ); // random random seed :-)
	
	fs::path newBtnPath = "???";
	
	try
	{
		newBtnPath = getAssetPath("new-btn.png");
		
		mNewBtnImage = gl::Texture::create( loadImage(newBtnPath), gl::Texture2d::Format().mipmap() );
	}
	catch (...)
	{
		cerr <<  "ERROR loading new btn image "  << newBtnPath << endl;
	}
}

void SampleView::close()
{
	closeFragEditor();
	getCollection()->removeView( shared_from_this() );
	orphanChildren(); // so we don't have circular shared_ptr happening causing a memory leak
}

void SampleView::draw()
{
	// loupe
	if ( mHasLoupe ) drawLoupe();
	
	// draw callout behind
	if ( mCallout.size()>0 )
	{
		gl::ScopedModelMatrix m;
		
		gl::multModelMatrix( getParentToChildMatrix() );
		
		// fill
		gl::color( 1, 1, 1, .25f );
		gl::drawSolid(mCallout);

		// frame
		if (1)
		{
//			gl::color(0,0,0,.15); // black!
			gl::color(1,1,1,.15); // white
			gl::draw(mCallout);
		}
	}	

	// shadow
	{
		Rectf sr = getBounds();
		sr += vec2(0,4);
		sr.inflate( vec2(-2,0) );
		gl::color( 0, 0, 0, getHasKeyboardFocus() ? .25f : .15f );
		gl::drawSolidRect(sr);
	}
	
	// bkgnd
	gl::color(1,1,1);
	gl::drawSolidRect( getBounds() );
	
	// parts
	drawSim();

	// focus
	if ( getHasKeyboardFocus() )
	{
//		gl::color( 1,1,.3, mIsLoupeView ? .6f : .35f );
//		gl::color( Color::hex(0xECF7F7) - Color::gray(.05f) );
		gl::color( 0, 0, 1, .1f );
		
//		float thick = mIsLoupeView ? 4.f : 1.f;
		float thick = 2.f;
		
//		gl::drawStrokedRect( getBounds().inflated(vec2(thick/2.f)), thick );
		gl::drawStrokedRect( getBounds().inflated(-vec2(thick/2.f)), thick );
	}
	
	// frame
	gl::color( Color::gray( (getHasRollover() || getHasKeyboardFocus()) ? .4f : .8f ) );
	gl::drawStrokedRect( getBounds() );	
	
	// new btn
	if ( getIsNewBtnEnabled() )
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
	return View::pick(p)
		|| pickNewBtn(p)
		|| pickLoupe(p)
		|| pickCalloutWedge(p)
		;
}

bool SampleView::pickNewBtn( glm::vec2 p ) const
{
	if ( !getIsNewBtnEnabled() ) return false;
	else
	{
		return distance( parentToChild(p), mNewBtnLoc ) <= mNewBtnRadius;
	}
}

bool SampleView::pickCalloutWedge( ci::vec2 rootLoc ) const
{
	vec2 parentLoc = rootToParent(rootLoc);
	
	return mHasLoupe && kCanPickCalloutWedge // wedge is pickable
		&& mCallout.contains(parentLoc)		 // in wedge
		&& !getFrame().contains(parentLoc)	 // not in box
		&& !pickLoupe(rootLoc)				 // not in loupe
		;
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

bool SampleView::pickLoupe( ci::vec2 rootLoc ) const
{
	return mHasLoupe && distance( rootToParent(rootLoc), mAnchor ) <= kLoupeRadius ;
}

void SampleView::drawLoupe() const
{
	vec2 p = rootToChild(mAnchor);

	bool hover = getHasRollover() && pickLoupe(getMouseLoc());
	bool focus = hover || getHasKeyboardFocus();
	
	float thickness = focus ? 1.5f : 1.1f ;
	
	// a bitmap icon might be nice
	gl::color( ColorA( Color::gray(.0f), focus ? .35f : .1f ) );
	drawThickStrokedCircle( p + vec2(0,2), kLoupeRadius, thickness );

	gl::color( ColorA( Color::gray(1.f), focus ? 1.f : .6f ) );
	drawThickStrokedCircle( p, kLoupeRadius, thickness );

//	gl::color( ColorA( Color::gray(.8f), .5f ) );
//	gl::drawStrokedCircle( p, kLoupeRadius-1.f );
}

void SampleView::selectFragment( int i )
{
	mSelection->set( mSample, i );
	mSelection->setToOrigin();

	if (!mIsLoupeView) showFragmentEditor(i);
	
	if (0) cout << "selected: " << (mSample ? mSample->mName : "(null)") << ", frag: " << i << endl;
}

void SampleView::setRolloverFragment( int i )
{
	mRollover->set(mSample,i);
	mRollover->setToOrigin();
}

void SampleView::setHighlightFragment( int i )
{
	mHighlight->set( mSample, i );
	mHighlight->setToOrigin();
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
		
		frame = snapToPixel(frame); // this is done in our local space; but whatever 
		
		mFragEditor->setFrameAndBoundsWithSize( frame );
		
		mFragEditor->setSampleView( dynamic_pointer_cast<SampleView>(shared_from_this()) );
		
		getCollection()->addView(mFragEditor);
	}
}

void SampleView::closeFragEditor()
{
	if ( mFragEditor )
	{
		mFragEditor->close();
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

		for( int m=0; m<p.mMulti.size(); ++m )
		{	
			mat4 xform = glm::inverse( p.getTransform(m) );
			vec2 ploc = vec2( xform * vec4(loc,0,1) );
			
			if ( length(ploc) <= 1.f )
			{
				return i;
			}
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
	if ( mIsLoupeView ) getCollection()->moveViewToTop( shared_from_this() );
	
	// pick fragment
	if ( !mIsLoupeView || kLoupePartsSelectable )
	{
		selectFragment( pickFragment( rootToChild(e.getPos()) ) );
	}
	
	// drag?
	if		( pickLoupe(e.getPos()) )		 mDrag = Drag::Loupe;
	else if ( pickCalloutWedge(e.getPos()) ) mDrag = Drag::LoupeAndView;
//	else if ( mSelectedFragment != -1 )      mDrag = Drag::None; // allow loupe drag to start on a part, too 
	else if ( mIsLoupeView )				 mDrag = Drag::View; 
	else mDrag = Drag::None;
}

void SampleView::mouseDrag( ci::app::MouseEvent )
{
	bool updateContent = false;
	
	// drag?
	switch ( mDrag )
	{
		case Drag::Loupe:
			setCalloutAnchor( getCalloutAnchor() + getMouseMoved() );
			updateContent = true;
			break;
			
		case Drag::View:
			setFrame( getFrame() + getMouseMoved() );
			updateCallout();
			break;
			
		case Drag::LoupeAndView:
			setFrame( getFrame() + getMouseMoved() );
			setCalloutAnchor( getCalloutAnchor() + getMouseMoved() ); // updates callout
			updateContent = true;
			break;
			
		case Drag::None: break;
	}
	
	// update content?
	if ( updateContent && mGelView )
	{
		mGelView->updateGelDetailViewContent( dynamic_pointer_cast<SampleView>(shared_from_this()) );
	}
}

void SampleView::mouseUp( ci::app::MouseEvent e )
{
	if ( getHasMouseDown() )
	{
		// new btn
		if ( pickNewBtn(e.getPos()) && pickNewBtn(getMouseDownLoc()) )
		{
			newFragment();
			selectFragment( mFragments.size()-1 );
		}
	}
}

void SampleView::keyDown( ci::app::KeyEvent e )
{
	switch( e.getCode() )
	{
		case KeyEvent::KEY_BACKSPACE:
		case KeyEvent::KEY_DELETE:
			if ( mIsLoupeView ) close();
			else if ( mSelection->isValidIn(getSample()) )
			{
				// delete fragment
				int which = mSelection->getFrag();
				deselectFragment();
				deleteFragment( which );
			}
			break;
		
		case KeyEvent::KEY_ESCAPE:
			// close view?
			if ( mIsLoupeView ) close();
			else if ( mGelView ) mGelView->selectMicrotube(-1);
			break;

		case KeyEvent::KEY_TAB:
			
			if ( mSample && mSelection->getSample()==mSample )
			{
				size_t size = mSample->mFragments.size();
				int    frag = mSelection->getFrag();
				
				// select first?
				if ( e.isShiftDown() )
				{
					// backwards
					if ( frag == -1 )
					{
						if ( size>0 ) selectFragment(size-1);
					}
					else
					{
						int n = frag - 1;
						if (n < 0) n=-1;
						selectFragment(n);
					}
				}
				else
				{
					// forwards
					if ( frag == -1 )
					{
						if ( size>0 ) selectFragment(0);
					}
					else
					{
						int n = frag + 1;
						if (n >= size) n=-1;
						selectFragment(n);
					}
				}
			}
			break;
			
		default:break;
	}
}

void SampleView::fragmentDidChange( int fragment )
{
	if ( mGelView ) mGelView->sampleDidChange(mSample);
}

int SampleView::getFocusFragment() const
{
	if      ( mHighlight->isValidIn(mSample) ) return mHighlight->getFrag();
	else if ( mRollover ->isValidIn(mSample) ) return mRollover ->getFrag();
	else if	( mSelection->isValidIn(mSample) ) return mSelection->getFrag();
	else return -1;
}

int SampleView::getSelectedFragment() const
{
	if ( mSelection->isValidIn(mSample) ) return mSelection->getFrag();
	else return -1;
}

int SampleView::getRolloverFragment ()
{
	if ( mRollover->isValidIn(mSample) ) return mRollover->getFrag();
	else return -1;
}

int SampleView::getHighlightFragment()
{
	if ( mHighlight->isValidIn(mSample) ) return mHighlight->getFrag();
	else return -1;
}

void SampleView::tick( float dt )
{
	syncToModel();

	bool slow = ( getHasRollover() || getHasMouseDown() ) && !pickNewBtn(getMouseLoc());
	
	tickSim( (slow ? .1f : 1.f) * mSimTimeScale );
	
	// rollover
	if ( getHasRollover() && ( ! mIsLoupeView || kLoupePartsSelectable ) )
	{
		setRolloverFragment( pickFragment( rootToChild(getMouseLoc()) ) );
	}
//	else setRolloverFragment(-1);
	
	// deselect?
	/*if ( (isFragment(mSelectedFragment) && !getHasKeyboardFocus()) || mIsLoupeView )
	{
		deselectFragment();
	}*/

	// fragment editor on highlight/hover/selection -- can enable/disable this feature on its own
	if ( ! mIsLoupeView )
	{
		showFragmentEditor( getFocusFragment() );
	}
}

void SampleView::syncToModel()
{
	if (mSample)
	{
		mFragments	  .resize( mSample->mFragments.size() );

		for( int i=0; i<mFragments.size(); ++i )
		{
			Frag &f = mFragments[i];
			auto  s = mSample->mFragments[i];
			
			f.mColor		= s.mColor;
			f.mTargetPop	= max( 1.f, (s.mMass/GelSim::kSampleMassHigh) * kNumPartsPerMassHigh );
			f.mAggregate	= s.mAggregate;			
			f.mAggregateWeightSum = s.calcAggregateSum();
			
			f.mSampleSizeBias = s.mSampleSizeBias;
			
			// radius
			float r = lmap( (float)s.mBases, 0.f, 14000.f, 2.f, 32.f );
			
			f.mRadiusHi.y = sqrt( (r*r) / s.mAspectRatio );
			f.mRadiusHi.x = s.mAspectRatio * f.mRadiusHi.y;
			// this calculation maintains the area for a circle in an ellipse that meets desired aspect ratio
			// math for maintaining circumfrence is wickedly harder
			
			// degraded radius				
			// do degrade (NOTE: this replicates logic in Gel::calcBandBounds)
			// just have multiple degrade params in each frag, to make this  simpler then encoding it all in 0..2?
			f.mRadiusLo = f.mRadiusHi;
			
			f.mRadiusLo *= max( 0.f, 1.f - s.mDegrade ); // as degrade goes 0..1, low end drops out--shorter base pairs, lower radii
		
			if ( s.mDegrade > 1.f ) f.mRadiusHi *= 2.f - min(2.f,s.mDegrade); // as degrade goes 1..2, upper radii moves drops out--shorter
			
			// set a lower limit on degrade...
			const vec2 kMinRadius(1,1);
			f.mRadiusLo = glm::max( f.mRadiusLo, kMinRadius );
//			f.mRadius		  = glm::max( f.mRadius,		 kMinRadius );
		}
	}
}

void SampleView::newFragment()
{
	if (mSample)
	{
		Sample::Fragment f;
		
		f.mColor = FragmentView::getRandomColorFromPalette( &mRand );
		f.mBases = lerp((float)kRandFragMinNumBases,(float)kRandFragMaxNumBases,mRand.nextFloat()*mRand.nextFloat());
		f.mMass  = mRand.nextFloat() * GelSim::kSampleMassHigh;
		f.mAspectRatio = 1.f;
		f.mDegrade = 0.f ; //mRand.nextFloat() * mRand.nextFloat() * mRand.nextFloat() * .25f;
		
		if ( mRand.nextInt() % 3 == 0 )
		{
			f.mAspectRatio = 1.f + (kRandFragMaxAspect-1.f) * mRand.nextFloat();
		}
		
		// random multimers
		{
			f.mAggregate.resize( kNewFragNumAggregateBands );
			
			if ( mRand.nextInt(5)==0 )
			{
				int r = mRand.nextInt( f.mAggregate.size() );
				for( int i=0; i<r; ++i )
				{
					f.mAggregate[i] = mRand.nextFloat();
				}
			}
			else
			{
				f.mAggregate[0] = 1.f;
			}
		}
		
		mSample->mFragments.push_back(f);
		fragmentDidChange(mSample->mFragments.size()-1);
		
		syncToModel();
	}
	else
	{
		Frag f( ci::Color(mRand.nextFloat(),mRand.nextFloat(),mRand.nextFloat()), lerp(2.f,16.f,mRand.nextFloat()*mRand.nextFloat()) );
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
		
		//	
		fragmentDidChange(-1);			
	}
}

SampleView::Part
SampleView::randomPart( int f )
{
	Part p;
		
	p.mLoc  = vec2( mRand.nextFloat(), mRand.nextFloat() )
			* vec2( getBounds().getSize() )
			+ getBounds().getUpperLeft();
			
	p.mVel  = mRand.nextVec2() * .5f;
	
	p.mAge += mRand.nextInt(kMaxAge); // stagger ages to prevent simul-fadeout-rebirth

	p.mAngle    = mRand.nextFloat() * M_PI * 2.f;
	p.mAngleVel = randFloat(-1.f,1.f) * M_PI * .002f;
	
	p.mFragment = f;
	p.mRadius = mFragments[p.mFragment].mRadiusHi ;
	p.mColor  = mFragments[p.mFragment].mColor ; 
	
	p.mRadiusScaleKey = mRand.nextFloat();
	if ( mFragments[p.mFragment].mSampleSizeBias != -1.f ) p.mRadiusScaleKey = 1.f - mFragments[p.mFragment].mSampleSizeBias;

	// multimer setup
	Part::Multi m;
	p.mMulti.push_back(m);

	int aggregate = getRandomWeightedAggregateSize(p.mFragment);
	
	while ( p.mMulti.size() < aggregate )
	{
		Part::Multi m;
	
		m.mAngle = mRand.nextFloat() * M_PI * 2.f;

		if (!p.mMulti.empty())
		{
			Part::Multi parent = p.mMulti[ mRand.nextInt() % p.mMulti.size() ];					

			m.mLoc = parent.mLoc + mRand.nextVec2();
		}
		else m.mLoc = vec2(0,0); // in case we ever get empty... (shouldn't happen!) 
		
		p.mMulti.push_back(m);
	}
	
	return p;
}

int
SampleView::getRandomWeightedAggregateSize( int fragment )
{
	const auto &frag = mFragments[fragment];
	
	// empty?
	if (frag.mAggregate.empty()) return 1; // empty means monomer
	
	// weights to use
	const vector<float>& a = frag.mAggregate; 
	const float sum = frag.mAggregateWeightSum;
	
	// choose
	float r = mRand.nextFloat() * sum;
	
	for( int i=0; i<a.size(); ++i )
	{
		if ( r <= a[i] )
		{
			return i+1;
		}
		
		r -= a[i];
	}
	
	assert( 0 && "aggregate weight sum is wrong" );
	return 1; // monomer
}

void SampleView::prerollSim()
{
	// step it a bunch so we spawn particles
	for( int i=0; i<100; ++i )
	{
		tickSim(mSimTimeScale);
	}
	
	// force fade in/out
	for ( auto &p : mParts )
	{
		if (p.mAlive) p.mFade = 1.f;
		else p.mFade = 0.f;
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
	
	// setup aggregate counters
	vector< vector<int> > aggregatePop;
	vector< vector<float> > aggregateCullChance;
	aggregatePop.resize( mFragments.size(), vector<int>() );
	aggregateCullChance.resize( mFragments.size(), vector<float>() );
	
	for( int i=0; i<mFragments.size(); ++i )
	{
		aggregatePop[i]       .resize( max( (size_t)1, mFragments[i].mAggregate.size()), 0 );
		aggregateCullChance[i].resize( max( (size_t)1, mFragments[i].mAggregate.size()), 0.f );
	}
	
	// tally
	for ( const auto &p : mParts )
	{
		const int f = p.mFragment;
		
		if ( f>=0 && f<pop.size() )
		{
			pop[f]++;
			if (p.mAlive)
			{
				alivepop[f]++;
			
				if (p.mMulti.size()>0) aggregatePop[f][p.mMulti.size()-1]++;
			}
		}
	}
	
	// update population counts
	for( int f = 0; f<mFragments.size(); ++f )
	{
		int targetPop = (float)max( 1, mFragments[f].mTargetPop ) * (float)mPopDensityScale ;
		
		// make (1 this frame)
		if ( alivepop[f] < targetPop  )
		{
			mParts.push_back( randomPart(f) );
			
			pop[f]++;
		}
		
		// cull		
		if ( alivepop[f] > targetPop )
		{
			cullChance[f] = (float)(alivepop[f] - targetPop) / (float)targetPop;
		}

		// aggregate cull?
		for( int m=0; m<mFragments[f].mAggregate.size(); ++m )
		{
			int targetMultiPop = ( mFragments[f].mAggregate[m] / mFragments[f].mAggregateWeightSum )
				* (float)targetPop;
			
			if ( aggregatePop[f][m] - kAggregateCullPopEps > targetMultiPop )
			{
				aggregateCullChance[f][m] = (float)(aggregatePop[f][m] - targetMultiPop) / (float)(aggregatePop[f][m]) ;
				aggregateCullChance[f][m] *= kAggregateCullChanceScale;
			}			
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
				|| (p.mAge > kMaxAge && kPartSimIsOldAgeDeathEnabled)
				|| mRand.nextFloat() < cullChance[p.mFragment] // ok to index bc of !frag test above
				|| (p.mAge > kMaxAgeMisfitAggregate && mRand.nextFloat() < aggregateCullChance[p.mFragment][p.mMulti.size()-1])
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
		p.mLoc += mRand.nextVec2() * mRand.nextFloat() * kJitter * dt;
		
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
			vec2 fragRadius = lerp( frag->mRadiusLo, frag->mRadiusHi, p.mRadiusScaleKey );
			
			p.mColor	= lerp( p.mColor,  frag->mColor, .5f );
			p.mRadius	= lerp( p.mRadius, fragRadius,	 .5f );
			
		} // sync
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
	gl::ScopedScissor scissor( getScissorLowerLeftForBounds(), getScissorSizeForBounds() );	
	
	// draw parts
	for ( const auto &p : mParts )
	{
		const int nsegs = 32;

		const bool selected = isFragment(p.mFragment) && mSelection->isa( mSample, p.mFragment );
		const bool rollover = isFragment(p.mFragment) &&
							 (mRollover ->isa( mSample, p.mFragment ) ||
							  mHighlight->isa( mSample, p.mFragment ) );
		 

		auto drawPart = [&]( bool outline )
		{
			if ( outline && !selected && !rollover ) return; 
			
			for( int i=0; i<p.mMulti.size(); ++i )
			{
				gl::ScopedModelMatrix modelMatrix;
				gl::multModelMatrix( p.getTransform(i) );
				
				if (!outline)
				{
					gl::color( ColorA( p.mColor, p.mFade ) );
					
					gl::drawSolidCircle( vec2(0,0), 1.f, nsegs ); // fill
					if (p.mFade==1.f)
					{
						gl::drawStrokedCircle( vec2(0,0), 1.f, nsegs ); // outline for anti-aliasing... assumes GL_LINE_SMOOTH
					}
				}
				
				if ( outline && (selected || rollover) )
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
			} // multi			
		};
		
		// outlines in 1st pass, for proper outline effect
		drawPart(true);
		drawPart(false);

	} // part
}

glm::mat4
SampleView::Part::getTransform( int multiIndex ) const
{
	mat4 xform;
	xform *= translate( vec3(mLoc,0) );
	xform *= glm::rotate( mAngle, vec3(0,0,1) );
	
	if ( multiIndex >= 0 && multiIndex < mMulti.size() )
	{
		const Multi &m = mMulti[multiIndex];
		xform *= translate( vec3( m.mLoc * min(mRadius.x,mRadius.y) * 2.f, 0) );
		xform *= glm::rotate( m.mAngle, vec3(0,0,1) );
	}
	
	xform *= scale( vec3(mRadius.x,mRadius.y,1.f) );	
	return xform;
}