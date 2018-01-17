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

GelView::GelView( GelRef gel )
{
	setGel(gel);
	
	//
	fs::path iconPath = "microtube1500ul.png";
	
	try
	{
		mMicrotubeIcon = gl::Texture::create( loadImage( app::getAssetPath(iconPath) ) );
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
	{
		for( int i=0; i<mGel->getNumLanes(); ++i )
		{
			Rectf r = calcMicrotubeIconRect(i);
			
			if (mSelectedMicrotube==i) gl::color(1,1,.5,1.f); 
			else gl::color(.5,.5,.5,.25f);
			
			gl::drawStrokedRect(r);
			
			if (mMicrotubeIcon && mGel->getSamples()[i])
			{
				Rectf fit(0,0,mMicrotubeIcon->getWidth(),mMicrotubeIcon->getHeight());
				fit = fit.getCenteredFit(r,true);
				
				gl::color(1,1,1);
				gl::draw( mMicrotubeIcon, fit );
			}
		}
	}
	
	// gel background
//	gl::color(0,0,0,.5f);
//	gl::draw( mGel->getOutlineAsPolyLine() );
	gl::color(.5,.5,.5);
	gl::drawSolidRect( Rectf( vec2(0,0), mGel->getSize() ) );
	
	// clip
	gl::ScopedScissor scissor( getScissorLowerLeftForBounds(), getScissorSizeForBounds() );	
	
	// aggregate bands into one batch
	auto bands = mGel->getBands();

	gl::VertBatch vb( GL_TRIANGLES );

	auto fillRect = [&vb]( ColorA c, Rectf r )
	{
		vb.color(c);

		vb.vertex(r.getUpperLeft ());
		vb.vertex(r.getUpperRight());
		vb.vertex(r.getLowerRight());

		vb.vertex(r.getLowerRight());
		vb.vertex(r.getLowerLeft ());
		vb.vertex(r.getUpperLeft ());		
	};
	
	for( auto &b : bands )
	{
		if (b.mExists)
		{
			fillRect( b.mColor, b.mBounds );
		}
	}


	// draw batch
	glEnable( GL_POLYGON_SMOOTH );

	vb.draw();
	
	glDisable( GL_POLYGON_SMOOTH );
	
	
	// focus
	if (mSampleView && mGel)
	{
		int lane = mSelectedMicrotube;
		int frag = mSampleView->getFocusFragment();
		
		if ( frag != -1 && lane != -1 )
		{
			for( auto &b : bands )
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
		}
	}
}

void GelView::closeSampleView()
{
	if ( mSampleView )
	{
		mSampleView->close();
		mSampleView=0;
	}
}

void GelView::tick( float dt )
{
	if (mGel && !mGel->getIsPaused())
	{
		mGel->stepTime(dt);
		
		if (mGel->isFinishedPlaying()) mGel->setIsPaused(true);
	}
	
	// band rollover
	if ( getHasRollover() )
	{
		Gel::Band band;
		
		if ( pickBand( rootToChild(getMouseLoc()),band) )
		{
			selectMicrotube(band.mLane);
			if (mSampleView) mSampleView->setRolloverFragment(band.mFragment);
		}
		else if (mSampleView) mSampleView->setRolloverFragment(-1);
	}
}

int GelView::pickLane ( vec2 loc ) const
{
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
			picked = b[0];
			smallest = h;
		}
	}
	
	return true;
}