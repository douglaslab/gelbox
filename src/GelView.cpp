//
//  GelView.cpp
//  Gelbox
//
//  Created by Chaim Gingold on 12/5/17.
//
//

#include "GelboxApp.h" // for modifier key
#include "GelView.h"
#include "SampleView.h"
#include "FragmentView.h" // for FragmentView::getColorPalette()
#include "GelSim.h"
#include "GelRender.h"
#include "Layout.h"
#include "Config.h"
#include "ButtonView.h"
#include "GelSettingsView.h"

using namespace ci;
using namespace std;

GelView::GelView()
{
	if (kConfig.mEnableGelRenderByDefault) mGelRender = make_shared<GelRender>();
	mIsLoupeOnHoverEnabled = kConfig.mEnableLoupeOnHoverByDefault;
	
	mMicrotubeIcon = kLayout.uiImage("microtube1500ul.png");
	
	mSelectedState = make_shared<SampleFragRef>();
	mRolloverState = make_shared<SampleFragRef>();
}

void GelView::setup( GelRef gel )
{
	setGel(gel);
	
	mSettingsBtn = make_shared<ButtonView>();
	
	int scale;
	auto img = kLayout.uiImage("settings.png",&scale);
	mSettingsBtn->setup( img, scale );
	
	mSettingsBtn->mClickFunction = [this]()
	{
		if (mSettingsView)
		{
			mSettingsView->close();
			mSettingsView = 0;
		}
		else
		{
			deselectFragment();
			selectMicrotube(-1);
			
			mSettingsView = make_shared<GelSettingsView>();
			mSettingsView->setup( dynamic_pointer_cast<GelView>(shared_from_this()) );
			if (getCollection()) getCollection()->addView( mSettingsView );
			
			layout();

			// put view right after GelView
			getCollection()->moveViewAbove( mSettingsView, shared_from_this() ); 
		}
	};

	mSettingsBtn->setParent( shared_from_this() );
	
	layout();		
}

void GelView::setGel( GelRef gel )
{
	// close some views, clear out some old state
	closeHoverGelDetailView();
	closeLoupes();
	deselectFragment();
	selectMicrotube(-1);
	closeSampleView();

	// update	
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

		if (mGelRender) mGelRender->setup( mGel->getSize(), getGelRenderPixelsPerUnit() );
		gelDidChange();
	}
}

void GelView::setBounds( ci::Rectf r )
{
	View::setBounds(r);
	layout();
}

void GelView::setFrame( ci::Rectf r )
{
	View::setFrame(r);
	layout();
	
	// a little silly; would be simpler to make us the parent for mSettingsView
}

void GelView::layout()
{
	if (mSettingsBtn)
	{
		Rectf r( vec2(0.f), mSettingsBtn->getFrame().getSize() );
		
		if ( kLayout.mGelSettingsBtnRightOfGel )
		{
			// upper right
//			r += ( getBounds().getUpperRight() + vec2(kLayout.mBtnGutter,0)) - r.getUpperLeft();
			// lower right
			r += ( getBounds().getLowerRight() + vec2(kLayout.mBtnGutter/2.f,0)) - r.getLowerLeft();
		}
		else
		{
			r += ( getBounds().getLowerRight() + vec2(0,kLayout.mBtnGutter)) - r.getUpperRight();
		}
		 
		mSettingsBtn->setFrame(r);
	}
	
	if (mSettingsView)
	{
		Rectf frame( vec2(0.f), kLayout.mGelSettingsSize );  		
		frame += getFrame().getUpperRight() + vec2(kLayout.mGelToBraceGutter,0.f);
		mSettingsView->setFrameAndBoundsWithSize( frame );
	}
}

bool GelView::pick( vec2 p ) const
{
	return View::pick(p) || -1 != pickMicrotube( rootToChild(p) );
}

void GelView::enableGelRender( bool v )
{
	if ( v == isGelRenderEnabled() ) return;
	
	if (v) {
		mGelRender = make_shared<GelRender>();
		if (mGel) mGelRender->setup( mGel->getSize(), getGelRenderPixelsPerUnit() );
		updateGelRender();
	}
	else mGelRender=0;
}

void GelView::updateGelRender()
{
	assert(mGel);
	
	if ( !mGelRender ) return;
	
	mGelRender->setBands( mGel->getBands() );
	
	{
		auto wl = mGel->getBufferWarpForLanes();
		float w = 0.f;
		for ( float v : wl ) w = max(w,v);
		mGelRender->setGlobalWarp( w, 0 );
	}
	
	mGelRender->render();
}

float GelView::getGelRenderPixelsPerUnit() const
{
	if ( kConfig.mEnableHDGelRender )
	{
		return ci::app::getWindowContentScale();
	}
	else return 1;
}

void GelView::draw()
{
	if (!mGel) return;

	// microtubes
	drawMicrotubes();
	
	// gel background
	gl::color(0,0,0);
	gl::drawSolidRect( Rectf( vec2(0,0), mGel->getSize() ) );
	
	// clip
	{
		gl::ScopedScissor scissor( getScissorLowerLeftForBounds(), getScissorSizeForBounds() );	

		// interior content
		if (mGelRender)
		{
// Doing this in tick(), since it doesn't work right in draw() loop :P
//			if (mGelRender->getIsDirty()) {
//				mGelRender->render();
//			}
			
			if (mGelRender->getOutput()) {
				gl::color(1,1,1,1);
				vec2 size = vec2(mGelRender->getOutput()->getSize()) / mGelRender->getPixelsPerUnit();
				gl::draw( mGelRender->getOutput(), Rectf( vec2(0), size ) );
			}
		}
		else
		{
			drawBands();
		}

		drawWells();
		drawBandFocus();
	}
	
	drawDragMicrotube();
		
	// test solver
	if (kConfig.mShowReverseSolverDebugTest) drawReverseSolverTest();
}

void GelView::drawMicrotubes() const
{
	if (!mGel) return;

	for( int i=0; i<mGel->getNumLanes(); ++i )
	{
		float cornerRadius;
		const bool  laneHasSample = getSample(i) != nullptr;
		const Rectf wellRect = calcMicrotubeWellRect(i,&cornerRadius);
		
		// r will be round rect that is tube background
		Rectf r = wellRect;
		r.y1 += min( kLayout.mGelMicrotubeBkgndTopInsetFromIcon, wellRect.getHeight() * .5f );
		r.y2 = getBounds().y2;
		
		gl::color( mSelectedMicrotube==i
			? kLayout.mGelMicrotubeBkgndColorSelected
			: kLayout.mGelMicrotubeBkgndColor );

		gl::drawSolidRoundedRect( r, cornerRadius );
//		gl::drawStrokedRoundedRect( r, cornerRadius ); // anti-alias
		
		Rectf iconRect = calcMicrotubeIconRect(wellRect); 
		
		if ( mMicrotubeIcon && laneHasSample )
		{
			gl::color(1,1,1);
			gl::draw( mMicrotubeIcon, iconRect );
		}
		
		if ( kLayout.mDebugDrawLayoutGuides )
		{
			gl::color(kLayout.mDebugDrawLayoutGuideColor);
			gl::drawStrokedRect(wellRect);
			gl::drawStrokedRect(iconRect);
		}
	}	
}

void GelView::drawDragMicrotube() const
{
	// in it?
	if (mDrag != Drag::Sample) return;
	
	// draw it
//	mMouseDownMicrotube

	if ( pickMicrotube( rootToChild(getMouseLoc()) ) == -1 )
	{
		Rectf iconRect = calcMicrotubeIconRect( calcMicrotubeWellRect(mMouseDownMicrotube) );
		iconRect += getMouseLoc() - getMouseDownLoc();
		
		if ( mMicrotubeIcon )
		{
			gl::color(1,1,1);
			gl::draw( mMicrotubeIcon, iconRect );
		}	
	}
}

void GelView::drawBands() const
{
	if (!mGel) return;
	
	// aggregate bands into one mesh
	auto bands = mGel->getBands();

	TriMesh mesh( TriMesh::Format().positions(2).colors(4) );

	auto fillRect2 = [&mesh]( Rectf r, ColorA c1, ColorA c2 )
	{
		mesh.appendColorRgba(c1);
		mesh.appendColorRgba(c1);
		mesh.appendColorRgba(c2);
		mesh.appendColorRgba(c2);

		mesh.appendPosition(r.getUpperLeft());
		mesh.appendPosition(r.getUpperRight());
		mesh.appendPosition(r.getLowerRight());
		mesh.appendPosition(r.getLowerLeft());
		
		const int i = (int)mesh.getNumVertices() - 4; 
		
		mesh.appendTriangle( i+0, i+1, i+2 );
		mesh.appendTriangle( i+2, i+3, i+0 );
	};
		
	auto fillRect = [&mesh,fillRect2]( Rectf r, ColorA c )
	{
		fillRect2( r, c, c );
	};
	
	for( auto &b : bands )
	{
		float fadeBelow = b.mSmearBelow;
		float fadeAbove = max( b.mFlameHeight, b.mSmearAbove );
		
		if ( b.mBlur )
		{
			ColorA bc = b.getColorA();
			bc.a *= .2f;
			
			Rectf r = b.mRect;
			r.y1 -= fadeAbove;
			r.y2 += fadeBelow;
			r.inflate( vec2(b.mBlur) );
			
			fillRect( r, bc );
		}
		
		fillRect( b.mRect, b.getColorA() );

		if ( fadeBelow > 0.f )
		{
			Rectf r = b.mRect;
			r.y1 = r.y2;
			r.y2 += fadeBelow;
			
			fillRect2( r,
				ColorA::gray(b.mSmearBrightnessBelow[0]),
				ColorA::gray(b.mSmearBrightnessBelow[1]) );
		}

		if ( fadeAbove )
		{
			Rectf r = b.mRect;
			r.y2 = r.y1;
			r.y1 -= fadeAbove;
			
			if ( b.mSmearAbove > b.mFlameHeight ) {
				// smear colors
				fillRect2( r,
					ColorA::gray(b.mSmearBrightnessBelow[0]),
					ColorA::gray(b.mSmearBrightnessBelow[1])
				);
			} else {
				// flame colors
				fillRect2( r, ColorA(b.mColor,0.f), ColorA(b.mColor,b.mBrightness) );
			}
		
			
		}
	}


	// draw mesh
	gl::ScopedBlend blendScp( GL_SRC_ALPHA, GL_ONE );
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
	if (mGel)
	{
		for( auto &b : mGel->getBands() )
		{
			SampleFragRef fr( getSample(b.mLane), b.mFragment );
			
			bool s = (*mSelectedState == fr);
			bool r = (*mRolloverState == fr);
			
			if (s||r)
			{
				float a=0.f;
				if (s) a += .65f;
				if (r) a += .35f;
				a = min( a, 1.f );
				
				gl::color( ColorA( b.mFocusColor, a ) );
				gl::drawStrokedRect( b.mUIRect.inflated(vec2(1)), 2.f );
			}
		}			
	}	
}

void GelView::mouseDown( ci::app::MouseEvent e )
{
	vec2 localPos = rootToChild(e.getPos());
	
	mMouseDownBand = Band(); // clear it
	mMouseDownMadeLoupe.reset();
	mMouseDragMadeSampleInLane = -1;
	mMouseDownSelectedMicrotube = mSelectedMicrotube;
	
	// add loupe?
	if ( e.isMetaDown() )
	{
		closeHoverGelDetailView(); // if we animate, we might want to transform one into the other so transition is less weird
		
		// start dragging it
		mMouseDownMadeLoupe = addLoupe( rootToChild(e.getPos()) );
		if (mMouseDownMadeLoupe)
		{
//			mMouseDownMadeLoupe->mouseDown(e);
				// logically, yes, but given how we are re-routing events, don't do it, as it deselects the active selection
				// SO really we just need to do a better job figuring out how to reroute the events... like this.
			mMouseDownMadeLoupe->setDragMode( SampleView::Drag::LoupeAndView );
			mDrag = Drag::Loupe;
		}
	}
	// add band?
	else if ( e.isRight() )
	{
		if ( newFragmentAtPos(e.getPos()) ) // can fail if user misses the lane
		{
			assert( mGel );
			assert( mSampleView );
		  	assert( mSampleView->getSelectedFragment() != -1 );
		  	
			// start dragging it
			const Band* b = mGel->getSlowestBandInFragment( mSelectedMicrotube, mSampleView->getSelectedFragment() );
			assert(b);
			mMouseDownBand = mMouseDragBand = *b;
			
			// did we just make the sample?
			if ( getSample(mSelectedMicrotube)->mFragments.size() == 1 )
			{
				mMouseDragMadeSampleInLane = mSelectedMicrotube;
			}
			
			mDrag = Drag::Band;
		}
	}
	else // normal mouse down
	{
		Band band;
		
		// pick tube icon
		mMouseDownMicrotube = pickMicrotube( localPos );
		mMouseDownSample = getSample(mMouseDownMicrotube);
		
		if ( mMouseDownMicrotube != -1 )
		{	
			// select
			selectMicrotube( mMouseDownMicrotube );
			
			// adjust selection, so we don't auto-change back
			if ( mSelectedState->getSample() != getSample(mMouseDownMicrotube) )
			{
				mSelectedState->clear();
			}
			
			mMouseDragMadeSampleInLane = mMouseDownMicrotube;
			mDrag = Drag::Sample;
			
			// clone sample drag?
			if ( e.isAltDown() && mMouseDownSample )
			{
				mMouseDragMadeSampleInLane = -1; // don't let drag clear it
				mMouseDownSample = make_shared<Sample>(*mMouseDownSample);
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
				const Band *newpick = mGel->getSlowestBandInFragment( band.mLane, newfrag );
				assert(newpick); // verify cloneing, and band updating worked as expected
				band = *newpick;
			}
			
			mMouseDownBand = band;
			mMouseDragBand = band;
			mDrag = Drag::Band;
			
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
			else if ( kConfig.mEnableGelViewDrag )
			{
				mDrag = Drag::View;
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
	switch( mDrag )
	{
		case Drag::Sample:
			// toggle tube selection off
			if ( mMouseDownSelectedMicrotube == mSelectedMicrotube
			  && mMouseDownMicrotube		 == mSelectedMicrotube
			  && distance( getMouseDownLoc(), getMouseLoc() ) < 3.f )
			{
				selectMicrotube(-1);
			}
			break;
	
		case Drag::Band:
			// reconcile duplicate dyes moved into the same lane...
			if ( mMouseDragBand.mLane != -1 )
			{
				auto s = getSample(mMouseDragBand.mLane);
				if (s) {
					s->mergeDuplicateDyes();
					sampleDidChange(s);
				}
			}
			break;
			
		default:break;
	}
	
	mMouseDownMadeLoupe = 0;
	mDrag = Drag::None;
}

void GelView::mouseDrag( ci::app::MouseEvent e )
{
	if ( length(getMouseMoved()) > 0.f )
	{
		switch(mDrag)
		{
			case Drag::Loupe:
				// drag loupe we made on mouse down
				mMouseDownMadeLoupe->mouseDrag(e);
				break;
				
			case Drag::Band:
				mouseDragBand(e);
				break;
			
			case Drag::Sample:
				mouseDragSample(e);
				break;
			
			case Drag::View:
				// drag this view
				setFrame( getFrame() + getCollection()->getMouseMoved() );
				break;
				
			default:break;
		}
	}
}

void GelView::mouseMove( ci::app::MouseEvent e )
{
	updateBandRollover( e.getPos() );
	updateHoverGelDetailView();
}

bool GelView::newFragmentAtPos( ci::vec2 pos )
{
	const int lane = pickLane( rootToParent(pos) );
	
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
		
		int  fragi = (int)sample->mFragments.size() - 1;
		auto &frag = sample->mFragments[fragi];
		
		frag.mAspectRatio = 1.f; // lock aspect ratio
		
		// lock aggregate to 1
		int aggregate=1;
		frag.mAggregate.set( aggregate-1, 1.f ); // mAggregate is this state by default.
		
		frag.mBases = solveBasePairForY(
			rootToChild(pos).y,
			*sample,
			fragi,
			lane,
			aggregate,
			mGel->getSimContext(*getSample(lane)) );
		
		// update, since we moved it
		sampleDidChange( sample );

		// keyboard focus sample view, select new fragment 
		selectFragment( lane, (int)sample->mFragments.size()-1 );
		getCollection()->setKeyboardFocusView( mSampleView );
	}
	
	return lane != -1;
} 

SampleRef GelView::getSample( int lane ) const
{
	if (mGel && lane >= 0 && lane < mGel->getSamples().size() )
	{
		return mGel->getSamples()[lane];
	}
	else return 0;
}

void GelView::setSample( int lane, SampleRef s )
{
	assert(mGel);

	if (mGel && lane >= 0 && lane < mGel->getSamples().size() )
	{
		mGel->setSample( s, lane );
		sampleDidChange(s);
	}
	else assert(0&&"invalid lane");
}

void GelView::selectFragment( int lane, int frag )
{
	assert( lane != -1 && frag != -1 ); // use deselect!
	
	selectMicrotube(lane);
	
	assert(mSampleView);
	
	mSampleView->selectFragment(frag);
}

void GelView::deselectFragment()
{
	mSelectedState->clear();
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
	// no settings view!
	if (mSettingsView)
	{
		mSettingsView->close();
		mSettingsView=0;
	}
	
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
			mSampleView->setup();
			mSampleView->setGelView( dynamic_pointer_cast<GelView>(shared_from_this()) );
			mSampleView->setShowCalloutAnchor(false);
		
			// shared state
			mSampleView->setSelectionStateData(mSelectedState);
			mSampleView->setRolloverStateData (mRolloverState);
						
			// layout + add
			mSampleView->setBounds( Rectf( vec2(0,0), kLayout.mSampleSize ) );
			
			Rectf frame = mSampleView->getBounds();
			
			frame += getBounds().getUpperRight() + vec2(kLayout.mGelToSampleGutter,0.f)
				     - frame.getUpperLeft();
			
			mSampleView->setFrame( frame );
			
			mSampleView->setCalloutAnchor( calcMicrotubeWellRect(tube).getCenter() ); // not that we show this anymore

			mSampleView->setParent( shared_from_this() );
			
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
	
	// make sure detail views stay on top
	getCollection()->moveViewAbove( mSampleView, shared_from_this() ); // put sample view right after GelView 
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
	
	// update views
	gelDidChange();
}

void GelView::samplesChanged()
{
	// update gel
	if ( mGel ) mGel->syncBandsToSamples();
	
	// update views
	gelDidChange();	
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

void GelView::closeLoupes()
{
	for( auto i : mLoupeViews )
	{
		auto l = i.lock();
		
		if (l) l->close();
	}	
}

void GelView::gelDidChange()
{
	// tell our sample views... (this doesn't update hover, but isn't an issue yet)
	updateLoupes();	
	updateHoverGelDetailView();

	// some state problem w deferring until draw()
	updateGelRender();
}

SampleViewRef GelView::addLoupe( vec2 withSampleAtGelPos )
{
	SampleViewRef view = updateGelDetailView( 0, withSampleAtGelPos, true, true );
	
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
	view->setup();
	view->setGelView( dynamic_pointer_cast<GelView>(shared_from_this()) );
	
	// set size; updateGelDetailView will position it
	Rectf frame( vec2(0.f), kLayout.mLoupeSize );
	
	view->setFrameAndBoundsWithSize(frame);
	
	// misc
	view->simPause();
	view->setIsLoupeView(true);
	
	// shared state
	view->setSelectionStateData(mSelectedState);
	view->setRolloverStateData (mRolloverState);
	
	// add
	view->setParent( shared_from_this() );
	
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

SampleViewRef GelView::updateGelDetailView( SampleViewRef view, vec2 withSampleAtGelPos, bool forceUpdate, bool doLayout )
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
		Rectf frame = view->getTargetFrame();
		
		frame.offsetCenterTo( withSampleAtGelPos + vec2(frame.getWidth(),0) );
		
		view->setTargetFrame(frame);
	}
	
	vec2 oldSampleAtGelPos = view->getCalloutAnchor();
	
	view->setCalloutAnchor( withSampleAtGelPos );
	
	// animate opening
	if (isNewView)
	{
		Rectf tframe = view->getTargetFrame();
		vec2 start = withSampleAtGelPos;
		view->setFrame( Rectf(start,start) );
		view->setTargetFrame(tframe);
	}
		
	// content
	SampleRef s = view->getSample();

	int lane = pickLane( childToParent(withSampleAtGelPos) );	
	
	if (   forceUpdate
		|| (!s || s->mID != lane)
		|| withSampleAtGelPos != oldSampleAtGelPos
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
	
	vec2 withSampleAtRootPos = view->parentToRoot( view->getCalloutAnchor() );
	
	vec2 withSampleAtPos = rootToChild(withSampleAtRootPos);
	
	// reset view particles
	view->simClearParticles();
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
	view->simPreroll();
}

SampleRef GelView::makeSampleFromGelPos( vec2 pos ) const
{
	assert(mGel);

	const bool verbose = false;
	
	SampleRef s = make_shared<Sample>();

	auto bands = pickBands(pos);
	
	
	for( auto b : bands )
	{
		// get band's source fragment
		Sample::Fragment f = getSample(b.mLane)->mFragments[b.mFragment];
		f.mOriginSample = getSample(b.mLane);
		f.mOriginSampleFrag = b.mFragment;

		assert( b.mFragment >= 0 && b.mFragment < getSample(b.mLane)->mFragments.size() );
		
		// where do we hit?
		float massScale = 1.f;

		const float smearPickAbove = b.pickSmearAbove(pos);
		const float smearPickBelow = b.pickSmearBelow(pos);
		const float smearPick = max( smearPickAbove, smearPickBelow );
		
		auto calcBases = [=]()
		{
			if ( b.mSmearBelow == 0.f ) return f.mBases;
			else
			{
				// use reverse solver to get us to exactly right size
				return solveBasePairForY(
					pos.y,
					*f.mOriginSample,
					f.mOriginSampleFrag,
					b.mLane,
					b.mAggregate,
					mGel->getSimContext(*f.mOriginSample)
				);
			}
		};
		
		if ( b.mRect.contains(pos) )
		{
			if (verbose) cout << "center" << endl;

			// center
			massScale = 1.f;
		}
		else if ( smearPick > 0.f )
		{
			if (verbose) cout << "smear" << endl;

			// smear
			massScale = smearPick;
			
			// adjust bp to where we are in degrade smear
			if (smearPickBelow > 0.f)
			{
				f.mBases = calcBases();
				
				// make sure we aren't degrading anymore				
				f.mDegrade = 0.f; 
			}
		}
		else
		{
			if (verbose) cout << "blur" << endl;
			
			// assume blur
			float d = b.mRect.distance(pos);
			d = 1.f - min( 1.f, (d / (float)b.mBlur) );
			d = powf(d,3.f);
			massScale = d;
			
			f.mBases = calcBases();			
		}
		
		//
		f.mMass = b.mMass * massScale;
		
		// aggregates
		f.mAggregate.zeroAll();
		f.mAggregate.set(
			b.mAggregate-1,
			1.f );
		
		// push
		s->mFragments.push_back(f);
	}
	
	if ((0)) cout << "makeSampleFromGelPos " << endl << s->toXml() << endl; 
	
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
	
	// clear shared rollover state
	if ( ! getCollection()->getRolloverView() )
	{
		mRolloverState->clear();
	}
	
	// re-render?
	if ( mGelRender && mGelRender->getIsDirty() )
	{
		mGelRender->render();
	}
}

void GelView::updateBandRollover( ci::vec2 rootPos )
{
	vec2 localMouseLoc  = rootToChild(getMouseLoc()); 
	
	// band rollover
	Band band;
	
	if ( getHasRollover() && pickBand( localMouseLoc, band ) )
	{
		if (kConfig.mBandRolloverOpensSampleView) selectMicrotube(band.mLane);

		mRolloverState->set( getSample(band.mLane), band.mFragment );
	}
	else mRolloverState->clear();
}

void GelView::enableLoupeOnHover( bool v )
{
	mIsLoupeOnHoverEnabled = v;
	updateHoverGelDetailView();
}

void GelView::updateHoverGelDetailView()
{
	if ( (    getHasRollover()
		  || (getHasMouseDown() && kConfig.mHoverGelDetailViewOnBandDrag) )
	    && (mIsLoupeOnHoverEnabled || GelboxApp::instance()->getModifierKeys() & app::KeyEvent::META_DOWN )
	    && pickLane(getMouseLoc()) != -1
	   )
	{
		mHoverGelDetailView = updateGelDetailView( mHoverGelDetailView, rootToChild(getMouseLoc()), true, true ); // implicitly opens it
		getCollection()->moveViewToTop(mHoverGelDetailView); // ensure it's on top
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
/*
DropTargetRef GelView::getDropTarget( glm::vec2 locInFrame )
{
	if ( pick(locInFrame) )
	{
		return make_shared<DropTargetGelView>(
			dynamic_pointer_cast<GelView>( shared_from_this() ),
			pickLane(locInFrame) );
	}
	else return 0;
}*/

ci::Rectf GelView::calcMicrotubeWellRect( int lane, float* cornerRadius ) const
{
	assert( mGel->getNumLanes() >=0 );
	
	const float w = getBounds().getWidth() / mGel->getNumLanes();
	const float h = w;
	
	vec2 c = getBounds().getUpperLeft() + vec2(w/2,-h/2);
	c.x += (float)lane * w; 
	
	vec2 size = vec2(w,h) - vec2(kLayout.mGelMicrotubeWellPadding);
	Rectf r( c - size/2.f, c + size/2.f );
	
	float gelGutter = kLayout.mGelMicrotubeIconToGelGutter;
	gelGutter = min( gelGutter, h * .25f );
	r += vec2( 0, -gelGutter );
	
	float cr = kLayout.mGelMicrotubeBkgndCornerRadius;
	cr = min( cr, w * .4f );
	
	r.x1 = c.x - cr;
	r.x2 = c.x + cr;
	
	if (cornerRadius) *cornerRadius = cr;
	return r;
}

ci::Rectf GelView::calcMicrotubeIconRect( ci::Rectf wellRect ) const
{
	vec2 iconSize = mMicrotubeIcon ? vec2(mMicrotubeIcon->getSize()) : vec2(32.f);
	
	Rectf iconRect( vec2(0.f), iconSize );
	Rectf iconFitIntoRect = wellRect;
	float insetx = min( kLayout.mGelMicrotubeIconPadding, wellRect.getWidth() * .25f );
	iconFitIntoRect.x1 = wellRect.x1 + insetx;
	iconFitIntoRect.x2 = wellRect.x2 - insetx;
	iconRect = iconRect.getCenteredFit(iconFitIntoRect,true);			
	iconRect = snapToPixel(iconRect);
		
	return iconRect;
}

int GelView::pickMicrotube( vec2 p ) const
{
	for( int i=0; i<mGel->getNumLanes(); ++i )
	{
		Rectf r = calcMicrotubeWellRect(i);
		r.y2 = getBounds().y1; // extend pick area to extend all the way down to gel
		
		if ( r.contains(p) ) return i;
	}
	return -1;
}

std::vector<Band> GelView::pickBands( vec2 loc ) const
{
	std::vector<Band> r;
	
	if (mGel)
	{
		for( auto b : mGel->getBands() )
		{
			if (b.mUIRect.contains(loc)) r.push_back(b);
		}
	}
	
	return r;
}

bool GelView::pickBand( vec2 loc, Band& picked ) const
{
	auto b = pickBands(loc);
	
	if (b.empty()) return false;
	
	// pick smallest
	float smallest = MAXFLOAT; 
	
	for( auto x : b )
	{
		float h = x.mUIRect.getHeight();
		
		if ( h < smallest )
		{
			picked   = x;
			smallest = h;
		}
	}
	
	return true;
}

void GelView::mouseDragBand( ci::app::MouseEvent e )
{
	// get sample, frag
	int lane  = mMouseDragBand.mLane; 
	int fragi = mMouseDragBand.mFragment;
	
	assert( mGel );
	assert( lane  >= 0 && lane  < mGel->getSamples().size() );
	assert( fragi >= 0 && fragi < mGel->getSamples()[lane]->mFragments.size() );
	
	SampleRef		sample = getSample(lane);
	Sample::Fragment &frag = sample->mFragments[fragi];
	
	// solve for bp (respond to y)
	if ( ! frag.isDye() )
	{
		// calculate dragDelta
		//		since by default we would put top of band at mouse,
		//		simply compute delta from
		//		band top to mouse down loc
		float dragDeltaY = getDragBandYReference(mMouseDownBand) - rootToChild(getMouseDownLoc()).y ;
		
		frag.mBases = solveBasePairForY(
			rootToChild(e.getPos()).y + dragDeltaY,
			*sample,
			fragi,
			lane,
			mMouseDownBand.mAggregate,
			mGel->getSimContext(*sample)
			);		
	}
	
	// constrain y?
	if ( e.isShiftDown() )
	{
		frag.mBases = mMouseDownBand.mBases;
	}
	
	// pick new lane?
	int newlane = pickLane( rootToParent(e.getPos()) );
	
	Rectf tightPickLaneRect = getLaneRect(newlane);
	float inset = (mGel->getLaneWidth() - mGel->getWellSize().x)/2.f;
	tightPickLaneRect.inflate( vec2( -inset, 0.f ) );
	
	if ( ! tightPickLaneRect.contains(rootToChild(e.getPos())) )
	{
		// put a gutter between lanes to prevent spurious switching
		newlane = lane;
	}
	
	// change lanes?
	if ( newlane != -1 && newlane != lane
	  && ( kConfig.mDragBandMakesNewSamples || getSample(newlane)) )
	{
		// clear old temp sample?
		if ( mMouseDragMadeSampleInLane != -1 )
		{
			mGel->setSample( 0, mMouseDragMadeSampleInLane );
			mMouseDragMadeSampleInLane=-1;
			sample=0;
		}

		// where are we going to?
		SampleRef toSample = getSample(newlane); 
		
		if ( ! toSample )
		{			
			// make it if needed
			toSample = make_shared<Sample>();
			mGel->setSample( toSample, newlane );
			mMouseDragMadeSampleInLane = newlane;
		}

		// remove, add		
		toSample->mFragments.push_back( frag );
		if (sample) sample->removeFragment(fragi); // INVALIDATES frag!!!
		
		mMouseDragBand.mLane = newlane;
		mMouseDragBand.mFragment = (int)toSample->mFragments.size()-1;
		
		// color change?
		if ((0))
		{
			Color& color = toSample->mFragments.back().mColor;
			
			if ( newlane == mMouseDownBand.mLane ) {
				color = FragmentView::getRandomColorFromPalette(); // random
			}
			// original
			else color = mMouseDownBand.mFocusColor; // should be original color! (unless we change how we do it) 
		}
		
		// update selection
		selectFragment( mMouseDragBand.mLane, mMouseDragBand.mFragment );
	}
	
	// update
	samplesChanged(); // sample, toSample may have changed; updates gel, rendering, and loupe views
}

void GelView::mouseDragSample( ci::app::MouseEvent event )
{
	const bool kVerbose = false;
	
	int newlane = pickMicrotube( rootToChild(getMouseLoc()) );
	int &_lane  = mMouseDragMadeSampleInLane;
		
	if ( newlane != _lane )
	{
		if (kVerbose) cout << _lane << " -> " << newlane << endl;

		// remove from old place
		if (_lane != -1) {
			setSample(_lane,0);
			if (kVerbose) cout << "clear " << _lane << endl;
			_lane = -1;
		}
	
		// put in new place?
		if ( newlane != -1 )
		{
			// if moving to full slot, move to nothing
			if ( getSample(newlane)!=0 ) {
				newlane = -1;
			}
			
			// move
			if (newlane!=-1)
			{
				setSample(newlane,mMouseDownSample);
				if (kVerbose) cout << "set " << newlane << endl;
				_lane = newlane;
			}
		}

		// select
		selectMicrotube(newlane);

		// update
		gelDidChange();		
	}
}

void GelView::drawReverseSolverTest()
{
	if ( getHasRollover() && mGel )
	{
		int lane = pickLane(getMouseLoc());
		
		if (lane != -1)
		{
			vec2 mouseLocal = rootToChild( getMouseLoc() );
			
			tReverseGelSolverCache cache;
			
			int aggregate = 1;
			if ( !getSample(lane) ) return;
			GelSim::Context simContext = mGel->getSimContext(*getSample(lane));
			
			Sample sample;
			sample.mFragments.push_back( Sample::Fragment() );
			int fragi=0;
			
			int bp = solveBasePairForY(
				mouseLocal.y,

				sample,
				fragi,
				lane,
				aggregate,
				
				simContext,
				&cache );
			
			// make a rect
			sample.mFragments[0].mBases = bp;

			vector<Band> bands = GelSim::fragToBands(
				sample,
				fragi,
				mGel->getWellBounds(lane),
				lane,
				simContext );

			int bandi = findBandByAggregate( bands, aggregate );
			
			// fail?
			if ( bandi != -1 )
			{
				Rectf r = bands[bandi].mRect;				
	//			Rectf r = mGel->getWellBounds(lane);			
				//float d = GelSim::calcDeltaY( bp, aggregate, aspectRatio, simContext ) * ySpaceScale; 			
				//r += vec2( 0.f, d );
				
				gl::color(1, 0, 0);
				gl::drawSolidRect(r);
				
				gl::drawString( toString(bp), r.getLowerRight() + vec2(16,0) );
				gl::drawString( toString(mouseLocal.y), r.getLowerRight() + vec2(16,16) );
				
				gl::color(0,0,1);
				for( auto i : cache )
				{
					const float k = 10;
					
					int y = i.first;
					
					gl::drawLine( vec2(r.x1-k,y), vec2(r.x2+k,y) );
				}
			} // bandi
		} // lane
	} // rollover
}

int GelView::solveBasePairForY(
		int			  			findy,
		Sample 					sample,
		int						fragi,
		int						lane,
		int			  			aggregate, // select which aggregate you want (1 for monomer)
		GelSim::Context			context,
		tReverseGelSolverCache* cache ) const
{
	assert( fragi >= 0 && fragi < sample.mFragments.size() );
	
	if ( cache && cache->find(findy) != cache->end() ) return (*cache)[findy];
	
	// bp search location, direction, speed
	int bp = 1;
	int stepsize = 1000;
	int stepdir  = 1;
	
	int iterationsLeft = kConfig.mSolverMaxIterations; // in case there is no solution
	
	do
	{		
		// simulate
		sample.mFragments[fragi].mBases = bp;
		
		vector<Band> bands = GelSim::fragToBands(
			sample,
			fragi,
			mGel->getWellBounds(lane),
			lane,
			context );
		
		// find proper aggregate
		int bandi = findBandByAggregate( bands, aggregate );
		
		// fail?
		if ( bandi == -1 ) break;
		
		// get y
		int y = getDragBandYReference( bands[bandi] );
		
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
	bp = constrain( bp, 1, GelSim::kTuning.mBaseCountHigh );
	
	return bp;
}
