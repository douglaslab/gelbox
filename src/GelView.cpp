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

using namespace ci;
using namespace std;

const bool kEnableDrag = false;
const bool kBandRolloverOpensSampleView = false;

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
}

void GelView::drawMicrotubes() const
{
	if (!mGel) return;

	for( int i=0; i<mGel->getNumLanes(); ++i )
	{
		const Rectf r = calcMicrotubeIconRect(i);
		const bool  laneHasSample = mGel->getSamples()[i] != nullptr;
		
		if (mSelectedMicrotube==i)
		{
			gl::color(1,1,.5,1.f);
			
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
	
	auto fillRect = [&mesh]( ColorA c, Rectf r )
	{
		mesh.appendColorRgba(c);
		mesh.appendColorRgba(c);
		mesh.appendColorRgba(c);
		mesh.appendColorRgba(c);

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
			fillRect( b.mColor, b.mBounds );
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
		int frag = mSampleView->getFocusFragment();
		
		if ( frag != -1 && lane != -1 )
		{
			for( auto &b : mGel->getBands() )
			{
				if ( b.mExists && b.mLane == lane && b.mFragment == frag )
				{
					gl::color( b.mFocusColor );
					gl::drawStrokedRect( b.mBounds );
				}
			}			
		}
	}	
}

void GelView::mouseDown( ci::app::MouseEvent e )
{
	vec2 localPos = rootToChild(e.getPos());
	Gel::Band band;
	
	// pick tube icon	
	mMouseDownMicrotube = pickMicrotube( localPos );
	
	if ( mMouseDownMicrotube != -1 )
	{	
		// select (w/ toggle)
		if (mMouseDownMicrotube==mSelectedMicrotube) selectMicrotube(-1);
		else selectMicrotube( mMouseDownMicrotube );		
	}
	// else pick band
	else if ( pickBand(localPos,band) )
	{
		mMouseDownMicrotube = band.mLane;
		selectMicrotube(band.mLane);
		
		if (mSampleView)
		{
			mSampleView->selectFragment(band.mFragment);
			getCollection()->setKeyboardFocusView(mSampleView); // for consistency; also, it will auto-deselect otherwise
		}
	}
	// else pick lane
	else
	{
		int lane = pickLane(e.getPos());
		
		if ( lane != -1 && mGel && mGel->getSamples()[lane] )
		{
			mMouseDownMicrotube = lane;
			selectMicrotube(mMouseDownMicrotube); // select
		}
	}
}

void GelView::mouseUp( ci::app::MouseEvent e )
{
	if ( mGel && distance( vec2(e.getPos()), getCollection()->getMouseDownLoc() ) < 1.f )
	{
		mGel->setIsPaused( ! mGel->getIsPaused() );
	}
}

void GelView::mouseDrag( ci::app::MouseEvent )
{
	if ( mMouseDownMicrotube == -1 && kEnableDrag )
	{
		setFrame( getFrame() + getCollection()->getMouseMoved() );
	}
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
	  && mSampleView->getSample() != mGel->getSamples()[mSelectedMicrotube]
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
			if ( ! mGel->getSamples()[tube] )
			{
				mGel->getSamples()[tube] = make_shared<Sample>();
			}
			mSampleView->setSample( mGel->getSamples()[tube] );
			
			// preroll
			// -- disabled; i like the fade in!
			// -- reasons to disable: fade is too distracting with everything else going on
//			mSampleView->prerollSim();
		}
	}
	
	// make sure detail is on top
	if ( mGelDetailView ) getCollection()->moveViewToTop( mGelDetailView ); 
}

void GelView::closeSampleView()
{
	if ( mSampleView )
	{
		mSampleView->close();
		mSampleView=0;
	}
}

void GelView::openGelDetailView()
{
	// make new
	if ( !mGelDetailView )
	{
		// make view
		mGelDetailView = make_shared<SampleView>();
		mGelDetailView->setGelView( shared_from_this() );
		
		// set size; updateGelDetailView will position it
		Rectf frame(0.f,0.f,150.f,150.f);
		
		mGelDetailView->setFrameAndBoundsWithSize(frame);
		
		// misc
		mGelDetailView->setIsNewBtnEnabled(false);
		mGelDetailView->setPopDensityScale(.25f); // since we are 1/4 area of other one
		mGelDetailView->setSimTimeScale(0.f); // paused
		
		// add
		getCollection()->addView(mGelDetailView);
	}
}

void GelView::closeGelDetailView()
{
	if ( mGelDetailView )
	{
		mGelDetailView->close();
		mGelDetailView=0;
	}
}

void GelView::updateGelDetailView( vec2 withSampleAtPos )
{
	if (!mGel) return;
	
	// open it?
	if (!mGelDetailView) openGelDetailView();
	
	// layout
	vec2 rootSamplePos = childToRoot( withSampleAtPos );
	
	Rectf frame = mGelDetailView->getFrame();
	
	frame.offsetCenterTo( rootSamplePos + vec2(frame.getWidth(),0) );
	
	mGelDetailView->setFrame(frame);
	
	mGelDetailView->setCalloutAnchor( rootSamplePos );
	
	// content
	SampleRef s = mGelDetailView->getSample();
	
	int lane = pickLane( childToParent(withSampleAtPos) );
	
	if ( ((!s || s->mID != lane) || withSampleAtPos != mGelDetailViewAtPos) && lane != -1 )
	{
		mGelDetailViewAtPos = withSampleAtPos;
		
		// reset view particles
		mGelDetailView->clearParticles();
		mGelDetailView->setRand( ci::Rand( withSampleAtPos.x*19 + withSampleAtPos.y*1723 ) );

		// make new sample
		s = makeSampleFromGelPos( withSampleAtPos );
		
		s->mID = lane;				
		
		mGelDetailView->setSample(s);
		
		// insure fully spawned
		mGelDetailView->prerollSim();
	}
}

SampleRef GelView::makeSampleFromGelPos( vec2 pos ) const
{
	SampleRef s = make_shared<Sample>();

	auto bands = pickBands(pos);
	
	
	for( auto b : bands )
	{
		// get band's source fragment
		Sample::Fragment f = mGel->getSamples()[b.mLane]->mFragments[b.mFragment];

		// speed bias
		f.mSampleSizeBias = (pos.y - b.mBounds.getY1()) / b.mBounds.getHeight() ;
		
		// aggregates
		f.mAggregate = b.mAggregate;
		
		// push
		s->mFragments.push_back(f);
	}
		
	
	return s;
}

void GelView::tick( float dt )
{
	if (mGel && !mGel->getIsPaused())
	{
		mGel->stepTime(dt);
		
		if (mGel->isFinishedPlaying()) mGel->setIsPaused(true);
	}
	
	
	vec2 localMouseLoc  = rootToChild(getMouseLoc()); 
	vec2 parentMouseLoc = childToParent(localMouseLoc);
	
	// band rollover
	{
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
	
	// gel detail rollover
	{
		if ( getHasRollover() && pickLane(getMouseLoc()) != -1 )
		{
			updateGelDetailView( localMouseLoc ); // implicitly opens it
		}
		else
		{
			closeGelDetailView();
		}
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