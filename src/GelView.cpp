//
//  GelView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 12/5/17.
//
//

#include "GelView.h"
#include "DropTarget.h" 
#include "SampleView.h"
#include "FragmentView.h" // for FragmentView::getColorPalette()
#include "GelSim.h"

using namespace ci;
using namespace std;

const bool kEnableDrag = false;
const bool kBandRolloverOpensSampleView = false;
const bool kHoverGelDetailViewOnBandDrag= true;

const bool kShowReverseSolverDebugTest = false;
const int  kSolverMaxIterations = 50; // this number is totally fine; maybe could even be smaller

GelView::GelView( GelRef gel )
{
	setGel(gel);
	
	//
	fs::path iconPath = "microtube1500ul.png";
	
	try
	{
		mMicrotubeIcon = gl::Texture::create( loadImage( app::getAssetPath(iconPath) ), gl::Texture2d::Format().mipmap() );
	}
	catch (...)
	{
		cerr << "ERROR loading icon " << iconPath << endl;
	}
	
	mSelectedState  = make_shared<SampleFragRef>();
	mRolloverState  = make_shared<SampleFragRef>();
	mHighlightState = make_shared<SampleFragRef>();
}


void GelView::setGel( GelRef gel )
{
	auto oldGel = mGel;
	
	mGel = gel;
	
	if (mGel)
	{
		vec2 size = mGel->getSize();

		Rectf bounds( vec2(0,0), size );
		setBounds(bounds);
		
		Rectf frame = bounds;
		if (oldGel) frame.offsetCenterTo( getFrame().getCenter() ); // center on old
		setFrame(frame);
	}
}

bool GelView::pick( vec2 p ) const
{
	return View::pick(p) || -1 != pickMicrotube( rootToChild(p) );
}

void GelView::draw()
{
	if (!mGel) return;

	// microtubes
	drawMicrotubes();
	
	// gel background
	gl::color(.5,.5,.5);
	gl::drawSolidRect( Rectf( vec2(0,0), mGel->getSize() ) );
	
	// clip
	gl::ScopedScissor scissor( getScissorLowerLeftForBounds(), getScissorSizeForBounds() );	

	// interior content
	drawBands();
	drawWells();
	drawBandFocus();
	
	// test solver
	if (kShowReverseSolverDebugTest) drawReverseSolverTest();
}

void GelView::drawMicrotubes() const
{
	if (!mGel) return;

	for( int i=0; i<mGel->getNumLanes(); ++i )
	{
		const Rectf r = calcMicrotubeIconRect(i);
		const bool  laneHasSample = getSample(i) != nullptr;
		
		if (mSelectedMicrotube==i)
		{
//			gl::color(1,1,.5,1.f);
			gl::color( Color::hex(0xECF7F7) - Color::gray(.05f) );
			
			Rectf r2 = r;
			
			r2.y2 = getBounds().y2 + ( getBounds().y1 - r2.y2 )/2.f ;
			
			gl::drawSolidRect(r2);
		}
		else if ( ! laneHasSample )
		{
			gl::color(.5,.5,.5,.25f);
			gl::drawStrokedRect(r);
		}
		
		if ( mMicrotubeIcon && laneHasSample )
		{
			Rectf fit(0,0,mMicrotubeIcon->getWidth(),mMicrotubeIcon->getHeight());
			fit = fit.getCenteredFit(r,true);
			
			gl::color(1,1,1);
			gl::draw( mMicrotubeIcon, fit );
		}
	}	
}

void GelView::drawBands() const
{
	if (!mGel) return;
	
	// aggregate bands into one mesh
	auto bands = mGel->getBands();

	TriMesh mesh( TriMesh::Format().positions(2).colors(4) );
	
	auto fillRect = [&mesh]( Rectf r, ColorA c[2] )
	{
		mesh.appendColorRgba(c[0]);
		mesh.appendColorRgba(c[0]);
		mesh.appendColorRgba(c[1]);
		mesh.appendColorRgba(c[1]);

		mesh.appendPosition(r.getUpperLeft());
		mesh.appendPosition(r.getUpperRight());
		mesh.appendPosition(r.getLowerRight());
		mesh.appendPosition(r.getLowerLeft());
		
		const int i = mesh.getNumVertices() - 4; 
		
		mesh.appendTriangle( i+0, i+1, i+2 );
		mesh.appendTriangle( i+2, i+3, i+0 );
	};
	
	for( auto &b : bands )
	{
		if (b.mExists)
		{
			ColorA c[2] =
			{
				ColorA( b.mColor, b.mAlpha[0] ),
				ColorA( b.mColor, b.mAlpha[1] )
			};
			
			fillRect( b.mBounds, c );
		}
	}


	// draw mesh
	gl::draw(mesh);
}

void GelView::drawWells() const
{
	if (!mGel) return;
	
	const float kGray = .8f;
	
	gl::color(kGray,kGray,kGray,.8f);
	
	for( int i=0; i<mGel->getNumLanes(); ++i )
	{
		gl::drawStrokedRect(mGel->getWellBounds(i));
	}
}

void GelView::drawBandFocus() const
{
	if (mSampleView && mGel)
	{
		int lane = mSelectedMicrotube;
		int selected  = mSampleView->getSelectedFragment();
		int focus	  = mSampleView->getFocusFragment();
		
		if ( lane != -1 )
		{
			for( auto &b : mGel->getBands() )
			{
				if ( b.mExists && b.mLane == lane )
				{
					bool s = b.mFragment == selected;
					bool r = b.mFragment == focus;
					
					if (s||r)
					{
						float a;
						if (s) a += .65f;
						if (r) a += .35f;
						a = min( a, 1.f );
						
						gl::color( ColorA( b.mFocusColor, a ) );
						gl::drawStrokedRect( b.mBounds.inflated(vec2(1)), 2.f );
					}
				}
			}			
		}
	}	
}

void GelView::mouseDown( ci::app::MouseEvent e )
{
	vec2 localPos = rootToChild(e.getPos());
	
	mMouseDownBand = Gel::Band(); // clear it
	mMouseDownMadeLoupe = 0;
	
	// add loupe?
	if ( e.isMetaDown() )
	{
		closeHoverGelDetailView(); // if we animate, we might want to transform one into the other so transition is less weird
		
		// start dragging it
		mMouseDownMadeLoupe = addLoupe( e.getPos() );
		if (mMouseDownMadeLoupe)
		{
//			mMouseDownMadeLoupe->mouseDown(e);
				// logically, yes, but given how we are re-routing events, don't do it, as it deselects the active selection
				// SO really we just need to do a better job figuring out how to reroute the events... like this.
			mMouseDownMadeLoupe->setDragMode( SampleView::Drag::LoupeAndView );
		}
	}
	// add band?
	else if ( e.isRight() )
	{
		newFragmentAtPos(e.getPos());
		
		// start dragging it
		assert(mGel);
		assert(mSampleView);
		const Gel::Band* b = mGel->getSlowestBandInFragment( mSelectedMicrotube, mSampleView->getSelectedFragment() );
		assert(b);
		mMouseDownBand = mMouseDragBand = *b;
	}
	else // normal mouse down
	{
		Gel::Band band;
		
		// pick tube icon
		mMouseDownMicrotube = pickMicrotube( localPos );
		
		if ( mMouseDownMicrotube != -1 )
		{	
			// select (w/ toggle)
			if (mMouseDownMicrotube==mSelectedMicrotube) selectMicrotube(-1);
			else selectMicrotube( mMouseDownMicrotube );
			
			// adjust selection, so we don't auto-change back
			if ( mSelectedState->getSample() != getSample(mMouseDownMicrotube) )
			{
				mSelectedState->clear();
			}
		}
		// else pick band
		else if ( pickBand(localPos,band) )
		{
			// clone band?
			if ( e.isAltDown() )
			{
				SampleRef sample = getSample(band.mLane); 
				assert(sample);
				
				int newfrag = sample->cloneFragment(band.mFragment);
				
				sample->mFragments[newfrag].mColor = FragmentView::getRandomColorFromPalette();
				
				sampleDidChange( sample );
				
				// change what we picked (band)
				const Gel::Band *newpick = mGel->getSlowestBandInFragment( band.mLane, newfrag );
				assert(newpick); // verify cloneing, and band updating worked as expected
				band = *newpick;
			}
			
			// use biggest band in mouse down fragment for mouse down
			// (this is better than just mMouseDownBand = band, as it solves some multi-multimer issues)
			mMouseDownBand = mGel->getSlowestBandInFragment(band);
			mMouseDragBand = mMouseDownBand;
			
			mMouseDownMicrotube = band.mLane;

			selectFragment (band.mLane, band.mFragment);
		}
		// else pick lane
		else
		{
			int lane = pickLane(e.getPos());
			
			if ( lane != -1 && getSample(lane) )
			{
				mMouseDownMicrotube = lane;
				selectMicrotube(mMouseDownMicrotube); // select
			}
			
			// deselect fragment
			deselectFragment();
		}
		
		// give it keyboard focus
		if (mSampleView) getCollection()->setKeyboardFocusView(mSampleView);
	}
}

void GelView::mouseUp( ci::app::MouseEvent e )
{
}

void GelView::mouseDrag( ci::app::MouseEvent e )
{
	// drag loupe we made on mouse down
	if ( mMouseDownMadeLoupe )
	{
		mMouseDownMadeLoupe->mouseDrag(e);
	}
	// drag band
	else if ( mMouseDownBand.mLane != -1 && mMouseDownBand.mFragment != -1 )
	{
		// get sample, frag
		int lane  = mMouseDragBand.mLane; 
		int fragi = mMouseDragBand.mFragment;
		
		assert( mGel );
		assert( lane  >= 0 && lane  < mGel->getSamples().size() );
		assert( fragi >= 0 && fragi < mGel->getSamples()[lane]->mFragments.size() );
		
		SampleRef		sample = getSample(lane);
		Sample::Fragment &frag = sample->mFragments[fragi];
		
		// calculate dragDelta
		//		since by default we would put top of band at mouse,
		//		simply compute delta from
		//		band top to mouse down loc
		float dragDeltaY = mMouseDownBand.mBounds.y1 - rootToChild(getMouseDownLoc()).y ;
		
		// use minimum aggregate in band
		// (this part behaves pretty weird with multimers)
		int aggregate=1;
		for ( int i=0; i<frag.mAggregate.size(); ++i )
		{
			if ( frag.mAggregate[i] > 0.f )
			{
				aggregate = i+1;
				// convert from index to aggregate count (e.g. monomer (aggregate=1) is at index=0)
			}
		} 
		
		// solve
		frag.mBases = solveBasePairForY(
			rootToChild(e.getPos()).y + dragDeltaY,
			aggregate,
			frag.mAspectRatio,
			mGel->getTime(),
			mGel->getWellBounds(lane).y1, //getCenter().y,
			mGel->getSampleDeltaYSpaceScale() );		
		
		// change lanes?
		int newlane = pickLane( rootToParent(e.getPos()) );
		
		if ( newlane != -1 && newlane != lane
		  && getSample(newlane) ) // only in existing samples for now
		{
			// remove, add
			SampleRef toSample = getSample(newlane); 
			
			toSample->mFragments.push_back( frag );
			sample->removeFragment(fragi); // INVALIDATES frag!!!
			
			mMouseDragBand.mLane = newlane;
			mMouseDragBand.mFragment = toSample->mFragments.size()-1;
			
			// color change?
			if (0)
			{
				Color& color = toSample->mFragments.back().mColor;
				
				if ( newlane == mMouseDownBand.mLane ) {
					color = FragmentView::getRandomColorFromPalette(); // random
				}
				// original
				else color = mMouseDownBand.mFocusColor; // should be original color! (unless we change how we do it) 
			}
			
			// update sample
			sampleDidChange( toSample );
			
			// update selection
			selectFragment( mMouseDragBand.mLane, mMouseDragBand.mFragment );
		}
		
		// update
		sampleDidChange(sample);
		
		// do 
		if (kHoverGelDetailViewOnBandDrag) updateHoverGelDetailView();
	}
	
	// drag this view
	else if ( mMouseDownMicrotube == -1 && kEnableDrag )
	{
		setFrame( getFrame() + getCollection()->getMouseMoved() );
	}
}

void GelView::mouseMove( ci::app::MouseEvent e )
{
	updateBandRollover( e.getPos() );
	updateHoverGelDetailView();
}

void GelView::newFragmentAtPos( ci::vec2 pos )
{
	int lane = pickLane( rootToParent(pos) );
	
	if ( lane != -1 )
	{
		// get sample
		selectMicrotube(lane);
			// should auto-create sample if absent
			// should also open sample view

		SampleRef sample = getSample(lane);

		assert( sample );
		assert( mSampleView );
		assert( mSampleView->getSample()==sample );
		
		// new fragment
		mSampleView->newFragment(); // let sampleview generate it 
		
		auto &frag = sample->mFragments.back();
		
		frag.mAspectRatio = 1.f; // lock aspect ratio
		
		// lock aggregate to 1
		for( float & v : frag.mAggregate ) v=0.f;
		frag.mAggregate[0] = 1.f;
		
		frag.mBases = solveBasePairForY(
			rootToChild(pos).y,
			1, // aggregate
			frag.mAspectRatio, // aspect
			mGel->getTime(),
			mGel->getWellBounds(lane).getCenter().y,
			mGel->getSampleDeltaYSpaceScale() );
		
		// update, since we moved it
		sampleDidChange( sample );

		// keyboard focus sample view, select new fragment 
		selectFragment( lane, sample->mFragments.size()-1 );
		getCollection()->setKeyboardFocusView( mSampleView );
	}	
} 

void GelView::selectFragment( int lane, int frag )
{
	selectMicrotube(lane);
	
	assert(mSampleView);
	
	mSampleView->selectFragment(frag);
}

void GelView::deselectFragment()
{
	if (mSampleView) mSampleView->deselectFragment();
}

void GelView::selectMicrotube( int i )
{
	if ( mSelectedMicrotube != i )
	{
		mSelectedMicrotube = i;
		
		closeSampleView();
		
		if (mSelectedMicrotube != -1) openSampleView();
	}	
}

void GelView::openSampleView()
{
	// close old?
	if ( mSampleView
	  && mGel
	  && mSelectedMicrotube != -1 
	  && mSampleView->getSample() != getSample(mSelectedMicrotube)
	  )
	{
		closeSampleView();
	}

	// make new
	if ( !mSampleView )
	{
		int tube = mSelectedMicrotube;

		if ( tube != -1 )
		{
			// make view
			mSampleView = make_shared<SampleView>();
			mSampleView->setGelView( shared_from_this() );

			// shared state
			mSampleView->setSelectionStateData(mSelectedState);
			mSampleView->setRolloverStateData (mRolloverState);
			mSampleView->setHighlightStateData(mHighlightState);
						
			// layout + add
			vec2 size(400.f,400.f);
			
			mSampleView->setBounds( Rectf( vec2(0,0), size ) );
			
			Rectf frame = mSampleView->getBounds();
			frame.offsetCenterTo(
				vec2( getFrame().getX2(),getFrame().getCenter().y )
				+ vec2(size.x/2 + 32.f,0.f) );
			
			mSampleView->setFrame( frame );
			
			mSampleView->setCalloutAnchor( childToRoot( calcMicrotubeIconRect(tube).getCenter() ) );

			getCollection()->addView(mSampleView);
			
			// make + set sample
			if ( ! getSample(tube) )
			{
				setSample( tube, make_shared<Sample>() );
			}
			mSampleView->setSample( getSample(tube) );
			
			// preroll
			// -- disabled; i like the fade in!
			// -- reasons to disable: fade is too distracting with everything else going on
			// -- reasons to enable: it calls attention to what is now an important, explicit user initiated, selection state change
//			mSampleView->prerollSim();
		}
	}
	
	// make sure detail is on top
	if ( mHoverGelDetailView ) getCollection()->moveViewToTop( mHoverGelDetailView ); 
}

void GelView::closeSampleView()
{
	if ( mSampleView )
	{
		mSampleView->close();
		mSampleView=0;
	}
}

void GelView::sampleDidChange( SampleRef s )
{
	// update gel
	if ( mGel ) mGel->syncBandsToSample(s);
	
	// loupes
	updateLoupes();
	
	// hover
	updateHoverGelDetailView();
}

void GelView::updateLoupes()
{
	// update loupes (and remove ones that are gone)
	auto lv = mLoupeViews;
	mLoupeViews.clear();
	
	for( auto li : lv )
	{
		auto l = li.lock();
		
		if (l)
		{
			l = updateGelDetailView( l, l->getCalloutAnchor(), true, false );
			
			mLoupeViews.push_back(l);
		}
	}
}

void GelView::timeDidChange()
{
	updateLoupes();
}

SampleViewRef GelView::addLoupe( vec2 withSampleAtRootPos )
{
	SampleViewRef view = updateGelDetailView( 0, withSampleAtRootPos, true, true );
	
	if (view)
	{
		view->setHasLoupe(true);
		
		getCollection()->setKeyboardFocusView(view);
		
		mLoupeViews.push_back(view);
	}
	
	return view;
}

SampleViewRef GelView::openGelDetailView()
{
	// make view
	SampleViewRef view = make_shared<SampleView>();
	view->setGelView( shared_from_this() );
	
	// set size; updateGelDetailView will position it
	Rectf frame(0.f,0.f,150.f,150.f);
	
	view->setFrameAndBoundsWithSize(frame);
	
	// misc
	view->setPopDensityScale(.25f); // since we are 1/4 area of other one
	view->setSimTimeScale(0.f); // paused
	view->setIsLoupeView(true);
	
	// shared state
	view->setSelectionStateData(mSelectedState);
	view->setRolloverStateData (mRolloverState);
	view->setHighlightStateData(mHighlightState);
	
	// add
	getCollection()->addView(view);
	
	return view;
}

void GelView::closeHoverGelDetailView()
{
	if ( mHoverGelDetailView )
	{
		mHoverGelDetailView->close();
		mHoverGelDetailView=0;
	}
}

SampleViewRef GelView::updateGelDetailView( SampleViewRef view, vec2 withSampleAtRootPos, bool forceUpdate, bool doLayout )
{
	if (!mGel) return view;
	
	// open it?
	bool isNewView = false;
	
	if ( !view )
	{
		view = openGelDetailView();
		isNewView = true;
	}
	
	if ( doLayout || isNewView )
	{
		// layout
		Rectf frame = view->getFrame();
		
		frame.offsetCenterTo( withSampleAtRootPos + vec2(frame.getWidth(),0) );
		
		view->setFrame(frame);
	}
	
	vec2 oldSampleAtRootPos = view->getCalloutAnchor();
	
	view->setCalloutAnchor( withSampleAtRootPos );
	
	// content
	SampleRef s = view->getSample();

	int lane = pickLane( rootToParent(withSampleAtRootPos) );	
	
	if (   forceUpdate
		|| (!s || s->mID != lane)
		|| withSampleAtRootPos != oldSampleAtRootPos
	   )
	{
		updateGelDetailViewContent(view);
	}
	
	//
	return view;
}

void GelView::updateGelDetailViewContent( SampleViewRef view ) const
{	
	// move this function to SampleView?
	
	assert(view);
	
	SampleRef s = view->getSample();
	
	vec2 withSampleAtRootPos = view->getCalloutAnchor();
	
	vec2 withSampleAtPos = rootToChild(withSampleAtRootPos);
	
	// reset view particles
	view->clearParticles();
	view->setRand( ci::Rand(
		withSampleAtPos.x*19
	  + withSampleAtPos.y*1723
	  + (int)(mGel->getTime()*2393.f)
	  ) );

	// make new sample
	s = makeSampleFromGelPos( withSampleAtPos );
	
	s->mID = pickLane( rootToParent(withSampleAtRootPos) );				
	
	view->setSample(s);
	
	// insure fully spawned
	view->prerollSim();
}

SampleRef GelView::makeSampleFromGelPos( vec2 pos ) const
{
	assert(mGel);
	
	SampleRef s = make_shared<Sample>();

	auto bands = pickBands(pos);
	
	
	for( auto b : bands )
	{
		// get band's source fragment
		Sample::Fragment f = getSample(b.mLane)->mFragments[b.mFragment];
		f.mOriginSample = getSample(b.mLane);
		f.mOriginSampleFrag = b.mFragment;
		
		// speed bias
		f.mSampleSizeBias = (pos.y - b.mBounds.getY1()) / b.mBounds.getHeight() ;
		
		//
		f.mMass = b.mMass;
		
		// aggregates
		f.mAggregate = b.mAggregate;
		
		// if we are an aggregate smeary band, (num non-zero multimers >1)
		// then bias aggregation with sample size bias
		// NOTE: This technique works OK when numNonZeroMultimers <= 2,
		//		 but gives bad results (because interpolation isn't linear) when > 2
		if ( ! f.mAggregate.empty() )
		{
			int hi, lo;
			int numNonZeroMultimers = f.calcAggregateRange(lo,hi);
			
			if ( numNonZeroMultimers > 1 )
			{
				assert( numNonZeroMultimers == 2 && "bands can't have >2 multimers in them; throws off our interpolation logic" );
				// see NOTE above...
				
				for( int m=lo; m<=hi; ++m )
				{
					float mf = 1.f - (float)(m - lo) / (float)(hi - lo);
					// 0 at hi (0 means big and slow)
					// 1 at lo (1 means small and fast)
					
					float scale = 1.f - fabs( mf - f.mSampleSizeBias );
					// near goal means scale 100%
					// far from it means scale 0%
					
					scale = powf( scale, 2.f );
					
					f.mAggregate[m] *= scale;
				}
			}
		}
		
		// push
		s->mFragments.push_back(f);
	}
		
	
	return s;
}

void GelView::tick( float dt )
{
	// sim
	if (mGel && !mGel->getIsPaused())
	{
		mGel->stepTime(dt);
		
		if (mGel->isFinishedPlaying()) mGel->setIsPaused(true);
	}
	
	
	// shuffle views
	// (this doesn't work quite right; for some reason i give it to loupe, but it's lost)
	if ( ! getCollection()->getKeyboardFocusView() )
	{
		bool done=false;
		
		while ( ! mLoupeViews.empty() && ! done )
		{
			SampleViewRef loupe = mLoupeViews.back().lock();
			
			if (loupe)
			{
				getCollection()->setKeyboardFocusView(loupe);
				getCollection()->moveViewToTop(loupe);
				done=true;
			}
			else mLoupeViews.pop_back();
		}
		
		if (!done && mSampleView)
		{
			getCollection()->setKeyboardFocusView(mSampleView);
			done=true;
		}
	}
	
	// adjust selection focus
	if ( mSelectedState->getSample() && ( !mSampleView || mSampleView->getSample() != mSelectedState->getSample() ) )
	{
		assert( mGel );
		selectMicrotube( mGel->getLaneForSample(mSelectedState->getSample()) );
	}
}

void GelView::updateBandRollover( ci::vec2 rootPos )
{
	vec2 localMouseLoc  = rootToChild(getMouseLoc()); 
	vec2 parentMouseLoc = childToParent(localMouseLoc);
	
	// band rollover
	int pickedLane = pickLane(parentMouseLoc);
	Gel::Band band;
	
	if ( getHasRollover() && pickBand( localMouseLoc, band ) )
	{
		if (kBandRolloverOpensSampleView) selectMicrotube(band.mLane);
		
		if (mSampleView && mSelectedMicrotube == pickedLane) 
		{
			mSampleView->setHighlightFragment(band.mFragment);
		}
	}
	else if (mSampleView) mSampleView->setHighlightFragment(-1);
}

void GelView::updateHoverGelDetailView()
{
	// gel detail rollover
	if ( (getHasRollover() || (getHasMouseDown() && kHoverGelDetailViewOnBandDrag) ) && pickLane(getMouseLoc()) != -1 )
	{
		mHoverGelDetailView = updateGelDetailView( mHoverGelDetailView, getMouseLoc(), true, true ); // implicitly opens it
	}
	else
	{
		closeHoverGelDetailView();
	}
}

int GelView::pickLane ( vec2 loc ) const
{
	if ( !getFrame().contains(loc) ) return -1;
	
	// move to bounds space
	loc = parentToChild(loc);
	
	int lane = loc.x / (float)mGel->getLaneWidth();
	
	lane = constrain( lane, 0, mGel->getNumLanes()-1 );
	
	return lane;
}

ci::Rectf GelView::getLaneRect( int lane ) const
{
	Rectf r(0,0,mGel->getLaneWidth(),mGel->getSize().y);
	
	r.offset( vec2( (float)lane * mGel->getLaneWidth(), 0 ) );
	
	return r;
}

DropTargetRef GelView::getDropTarget( glm::vec2 locInFrame )
{
	if ( pick(locInFrame) )
	{
		return make_shared<DropTargetGelView>( shared_from_this(), pickLane(locInFrame) );
	}
	else return 0;
}

ci::Rectf GelView::calcMicrotubeIconRect( int lane ) const
{
	assert( mGel->getNumLanes() >=0 );
	
	const float kVGutter = 12.f;
	const float kPad = 4.f;
	
	const float w = getBounds().getWidth() / mGel->getNumLanes();
	const float h = w;
	
	vec2 c = getBounds().getUpperLeft() + vec2(w/2,-h/2);
	c.x += (float)lane * w; 
	
	vec2 size = vec2(w,h) - vec2(kPad);
	Rectf r( c - size/2.f, c + size/2.f );
	
	r += vec2( 0, -kVGutter );
	
	return r;
}

int GelView::pickMicrotube( vec2 p ) const
{
	for( int i=0; i<mGel->getNumLanes(); ++i )
	{
		Rectf r = calcMicrotubeIconRect(i);
		
		if ( r.contains(p) ) return i;
	}
	return -1;
}

std::vector<Gel::Band> GelView::pickBands( vec2 loc ) const
{
	std::vector<Gel::Band> r;
	
	if (mGel)
	{
		for( auto b : mGel->getBands() )
		{
			if (b.mBounds.contains(loc)) r.push_back(b);
		}
	}
	
	return r;
}

bool GelView::pickBand( vec2 loc, Gel::Band& picked ) const
{
	auto b = pickBands(loc);
	
	if (b.empty()) return false;
	
	// pick smallest
	float smallest = MAXFLOAT; 
	
	for( auto x : b )
	{
		float h = x.mBounds.getHeight();
		
		if ( h < smallest )
		{
			picked   = x;
			smallest = h;
		}
	}
	
	return true;
}

void GelView::drawReverseSolverTest()
{
	if ( getHasRollover() && mGel )
	{
		int lane = pickLane(getMouseLoc());
		
		if (lane != -1)
		{
			vec2 mouseLocal = rootToChild( getMouseLoc() );
			
			int   aggregate = 1;
			float aspect = 1.f;
			float time = mGel->getTime();
			
			tReverseGelSolverCache cache;
			
			int bp = solveBasePairForY(
				mouseLocal.y,
				aggregate,
				aspect,
				time,
				mGel->getWellBounds(lane).getCenter().y,
				mGel->getSampleDeltaYSpaceScale(),
				&cache );
			
			Rectf r = mGel->getWellBounds(lane);

			const float ySpaceScale = mGel->getSampleDeltaYSpaceScale();
			
			r.y1 += GelSim::calcDeltaY( bp, aggregate, aspect, time ) * ySpaceScale;
			r.y2 += GelSim::calcDeltaY( bp, aggregate, aspect, time ) * ySpaceScale;
			
			gl::color(1, 0, 0);
			gl::drawSolidRect(r);
			
			gl::drawString( toString(bp), r.getLowerRight() + vec2(16,0) );
			
			gl::color(0,0,1);
			for( auto i : cache )
			{
				const float k = 10;
				
				int y = i.first;
				
				gl::drawLine( vec2(r.x1-k,y), vec2(r.x2+k,y) );
			}
		}
	}
}

int GelView::solveBasePairForY(
		int		findy,
		int		aggregate,
		float	aspectRatio,
		float	time,
		float	ystart,
		float	yscale,
		tReverseGelSolverCache* cache ) const
{
	if ( cache && cache->find(findy) != cache->end() ) return (*cache)[findy];
	
	// bp search location, direction, speed
	int bp = 1;
	int stepsize = 1000;
	int stepdir  = 1;
	
	int iterationsLeft = kSolverMaxIterations; // in case there is no solution
	
	do
	{
		int y = ystart + GelSim::calcDeltaY( bp, aggregate, aspectRatio, time ) * yscale
					   - GelSim::calcDiffusionInflation( bp, aggregate, aspectRatio, time ) * yscale;
			// use cache here for small perf. gain?
		
		if (cache) (*cache)[y] = bp;
		
		// found it?
		if ( y == findy ) return bp;
		
		// tack?
		else if ( ( y > findy && stepdir !=  1 )   // if we landed below, make sure bp is growing
			   || ( y < findy && stepdir != -1 ) ) // if we landed above, make sure bp is shrinking
		{
			// reverse direction, cut step size
			stepdir  *= -1;
			stepsize /=  4;
			
			// FAILED!
			if (stepsize <= 1) break;  // bp contains best guess
		}
		
		bp += stepsize * stepdir;
	}
	while ( iterationsLeft-- > 0 );
	
	// no solution? just return our closest guess
	
	// sanity check
	bp = constrain( bp, 1, GelSim::kBaseCountHigh );
	
	return bp;
}