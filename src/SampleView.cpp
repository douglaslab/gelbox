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
#include "BufferView.h"
#include "GelView.h"
#include "GelSim.h"
#include "Layout.h"
#include "Config.h"
#include "ButtonView.h"
#include "SampleSettingsView.h"

using namespace std;
using namespace ci;
using namespace ci::app;


const int kRandFragMinNumBases = 1;
const int kRandFragMaxNumBases = 14000;
const float kRandFragMaxAspect = 8.f;

const int kNewFragNumAggregateBands = 7;
	// magic number we are copying from # notches in sample view...
	// !! TODO: pull out into a const !!

// ui
const float kLoupeRadius = 16.f * .65f;
const bool  kCanPickCalloutWedge = true;
const bool  kLoupePartsSelectable = true;



void SampleView::setup()
{
	mSelection = make_shared<SampleFragRef>();
	mRollover  = make_shared<SampleFragRef>();
	
	mRand.seed( randInt() ); // random random seed :-)
	
	mMicrotubeIcon = kLayout.uiImage("microtube1500ul.png");

	mHeadingScale = ci::app::getWindowContentScale();
	mHeadingTex = kLayout.renderHead(kLayout.mSampleViewHeaderStr,mHeadingScale);

	// new btn
	mNewBtn = make_shared<ButtonView>();
	
	int scale;
	auto img = kLayout.uiImage("new-btn.png",&scale);
	mNewBtn->setup( img, scale );
	
	mNewBtn->mClickFunction = [this]()
	{
		newFragment();
		if (mSample) {
			selectFragment( (int)mSample->mFragments.size() - 1 );
		}
	};

	mNewBtn->setParent( shared_from_this() );
}

void SampleView::close()
{
	closeFragEditor();
	openSettingsView(false);
	
	if (mIsLoupeView) {
		mIsClosing=true;
		setTargetFrame( Rectf(mAnchor,mAnchor) );
	} else {
		setParent(0);
	}
}

void SampleView::draw()
{
	// loupe
	if ( mHasLoupe ) drawLoupe();
	
	// header
	if ( !mIsLoupeView ) drawHeader();
	
	// draw callout behind
	if ( mCallout.size()>0 && mShowCalloutAnchor )
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
	
	// molecular sim
	int bkgndHoverState=0;
	if ( -1 == mMolecularSim.pickFragment( rootToChild(getMouseLoc()) ) )
	{
		if ( getHasMouseDown() ) bkgndHoverState=2;
		else if ( getHasRollover() ) bkgndHoverState=1;
	}
	mMolecularSim.drawBackground(bkgndHoverState);	
	{
		gl::ScopedScissor scissor( getScissorLowerLeftForBounds(), getScissorSizeForBounds() );	
		mMolecularSim.draw(mSelection,mRollover);
	}
	
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
}

void SampleView::drawHeader()
{
	// circle
	{
		const float r = kLayout.mSampleViewMicrotubeBkgndRadius;
		const vec2  c = getBounds().getUpperLeft() + vec2( r, -r -kLayout.mSampleViewMicrotubeBkgndGutter );
		
		gl::color( kLayout.mGelMicrotubeBkgndColorSelected );
		gl::drawSolidCircle(c,r);
//		gl::drawStrokedCircle(c,r); // anti-alias it!
	}
	
	// icon
	if (mMicrotubeIcon)
	{						
		gl::color(1,1,1);
		gl::draw(mMicrotubeIcon,mMicrotubeIconRect);
	}

	// text	
	if (mHeadingTex)
	{
		gl::color(1,1,1);
		gl::draw(mHeadingTex,mHeadingRect);
	}
}

void SampleView::setBounds( ci::Rectf r )
{
	View::setBounds(r);
	layout();
}

void SampleView::layout()
{
	if (mSettingsView)
	{
		Rectf frame( vec2(0.f), kLayout.mSampleSettingsSize );  		
		frame += getBounds().getUpperRight() + vec2(kLayout.mSampleToBraceGutter,0.f);
		mSettingsView->setFrameAndBoundsWithSize( frame );
	}	
	
	if (mNewBtn)
	{
		Rectf r( vec2(0.f), mNewBtn->getFrame().getSize() );
		r += ( getBounds().getLowerRight() + vec2(0,kLayout.mBtnGutter)) - r.getUpperRight(); 
		mNewBtn->setFrame(r);
	}

	if (mMicrotubeIcon)
	{
		float s = (float)kLayout.mSampleViewMicrotubeWidth / mMicrotubeIcon->getSize().x;
		
		mMicrotubeIconRect = Rectf( vec2(0.f), vec2(mMicrotubeIcon->getSize()) * s );
		
		mMicrotubeIconRect += vec2( 0.f, -mMicrotubeIconRect.getSize().y );
		mMicrotubeIconRect +=
			vec2(	 kLayout.mSampleViewMicrotubeBkgndRadius - mMicrotubeIconRect.getWidth()/2.f,
					-kLayout.mSampleViewMicrotubeGutter );
	}

	if (mHeadingTex) {
		mHeadingRect = kLayout.layoutHeadingText( mHeadingTex, kLayout.mSampleViewHeaderBaselinePos, mHeadingScale );
	}
	
	mMolecularSim.setBounds( getBounds() );		
}

bool SampleView::pick( glm::vec2 p ) const
{
	if (mIsClosing) return false;
	
	return View::pick(p)
		|| pickLoupe(p)
		|| pickCalloutWedge(p)
		;
}

bool SampleView::pickCalloutWedge( ci::vec2 frameSpace ) const
{
	vec2 parentLoc = frameSpace; //rootToParent(rootLoc);
	
	return mHasLoupe && kCanPickCalloutWedge // wedge is pickable
		&& mCallout.contains(parentLoc)		 // in wedge
		&& !getFrame().contains(parentLoc)	 // not in box
		&& !pickLoupe(frameSpace)			 // not in loupe
		;
}

void SampleView::openSettingsView( bool v )
{
	// toggle
	if ( !v && mSettingsView )
	{
		mSettingsView->close();
		mSettingsView=0;
	}
	else if ( v && !mSettingsView )
	{
		closeFragEditor();

		mSettingsView = make_shared<SampleSettingsView>();
		mSettingsView->setup( dynamic_pointer_cast<SampleView>(shared_from_this()) );
		mSettingsView->setParent( shared_from_this() );
		
		layout();

		// put view right after GelView
		getCollection()->moveViewAbove( mSettingsView, shared_from_this() ); 
	}
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

bool SampleView::pickLoupe( ci::vec2 frameSpace ) const
{
	return mHasLoupe && distance( frameSpace, mAnchor ) <= kLoupeRadius ;
}

void SampleView::drawLoupe() const
{
	vec2 p = parentToChild(mAnchor);

	bool hover = getHasRollover() && pickLoupe(getMouseLoc());
	bool focus = hover || getHasKeyboardFocus();
	
	float thickness = focus ? 1.5f : 1.1f ;

	auto drawThickStrokedCircle = []( vec2 p, float r, float thickness )
	{
		gl::drawStrokedCircle( p, r, thickness );
		
		/*
		if (thickness > 1.f)
		{
			gl::drawStrokedCircle( p, r - thickness/2 ); // use this call, has anti-aliasing
			gl::drawStrokedCircle( p, r + thickness/2 ); // use this call, has anti-aliasing
		}*/
	};
	
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
	if (i!=-1) openSettingsView(false);
	
	mSelection->set( mSample, i );
	mSelection->setToOrigin();

	if ( !mIsLoupeView ) showFragmentEditor(i);
	
	if ((0)) cout << "selected: " << (mSample ? mSample->mName : "(null)") << ", frag: " << i << endl;
}

void SampleView::setRolloverFragment( int i )
{
	mRollover->set(mSample,i);
	mRollover->setToOrigin();
}

void SampleView::showFragmentEditor( int i )
{
	if ( mMolecularSim.isFragment(i) )
	{
		if ( mSample->mFragments[i].isDye() )
		{
			closeFragEditor();
			openSettingsView();
		}
		else
		{
			openFragEditor();
			mFragEditor->setFragment( mSample, i );
		}
	}
	else closeFragEditor();
}

void SampleView::openFragEditor()
{
	if ( !mFragEditor )
	{
		mFragEditor = make_shared<FragmentView>();
		
		Rectf frame( vec2(0.f), kLayout.mFragViewSize );  		
		frame += getBounds().getUpperRight() + vec2(kLayout.mSampleToBraceGutter,0.f);
		mFragEditor->setFrameAndBoundsWithSize( frame );
		
		mFragEditor->setSampleView( dynamic_pointer_cast<SampleView>(shared_from_this()) );
		
		mFragEditor->setParent( shared_from_this() );
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

void SampleView::mouseDown( ci::app::MouseEvent e )
{
	// take keyboard focus
	getCollection()->setKeyboardFocusView( shared_from_this() );
	if ( mIsLoupeView ) getCollection()->moveViewToTop( shared_from_this() );
	
	// pick inside
	if ( !mIsLoupeView || kLoupePartsSelectable )
	{
		// try fragment
		int frag = mMolecularSim.pickFragment( rootToChild(e.getPos()) );
		selectFragment(frag);
		
		// hit background?
		if ( frag==-1 && !mIsLoupeView )
		{
			// open/toggle settings (e.g. buffer)
			mBackgroundHasSelection = ! mBackgroundHasSelection;
			openSettingsView( mBackgroundHasSelection );
		}
	}
	
	
	// drag?
	vec2 mouseParent = rootToParent(e.getPos());
	
	if		( pickLoupe(mouseParent) )		 mDrag = Drag::Loupe;
	else if ( pickCalloutWedge(mouseParent) )mDrag = Drag::LoupeAndView;
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
			setTargetFrame( getTargetFrame() + getMouseMoved() );
			updateCallout();
			break;
			
		case Drag::LoupeAndView:
			setTargetFrame( getTargetFrame() + getMouseMoved() );
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
				int size = (int)mSample->mFragments.size();
				int frag = mSelection->getFrag();
				
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
	if		( mRollover ->isValidIn(mSample) ) return mRollover ->getFrag();
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

void SampleView::setIsLoupeView ( bool l )
{
	mIsLoupeView=l;
	
	if (mNewBtn) mNewBtn->setIsVisible( !mIsLoupeView );
}

void SampleView::tick( float dt )
{
	mMolecularSim.syncToSample();

	mMolecularSim.tick( getHasRollover() || getHasMouseDown() );
	
	// rollover
	if ( getHasRollover() && ( ! mIsLoupeView || kLoupePartsSelectable ) )
	{
		setRolloverFragment( mMolecularSim.pickFragment( rootToChild(getMouseLoc()) ) );
	}
	
	// deselect?
	/*if ( (isFragment(mSelectedFragment) && !getHasKeyboardFocus()) || mIsLoupeView )
	{
		deselectFragment();
	}*/

	// fragment/dye editor on highlight/hover/selection
	if ( ! mIsLoupeView )
	{
		showFragmentEditor( getFocusFragment() );

		// deselect background
		// -- if we have a valid seletion, and it isn't a (our) dye
		if (    mSelection->isValid()
		  && !( mSelection->getSample() == getSample() && isFragmentADye(mSelection->getFrag()) )
		   )
		{
			mBackgroundHasSelection=false;
		}

		// fade in/out settings view with hover fragment detail
		// we want them to both be able to be active (hovering a particle shouldn't
		// change choice to select background), but we don't want to draw them both
		// at the same time.
		if ( mSettingsView ) 
		{
			bool isDye = isFragmentADye(getFocusFragment());
			bool isNil = getFocusFragment()==-1;

			mSettingsView->setIsVisible( isNil || isDye );
		}
	}
	
	// animate frame
	{
//		View::setFrame( lerp( getFrame(), mTargetFrame, .35f ) );
		setFrame( mTargetFrame );
		updateCallout();
	}
	
	// close?
	if ( mIsClosing )
	{
		if ( getFrame().calcArea() < 10.f ) {
			getCollection()->removeView( shared_from_this() );
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
		f.mMass  = mRand.nextFloat() * GelSim::kTuning.mSampleMassHigh;
		f.mAspectRatio = 1.f;
		f.mDegrade = 0.f ; //mRand.nextFloat() * mRand.nextFloat() * mRand.nextFloat() * .25f;
		
		if ( mRand.nextFloat() < kConfig.mNewFragChanceNonUniformAspectRatio )
		{
			f.mAspectRatio = 1.f + (kRandFragMaxAspect-1.f) * mRand.nextFloat();
		}
		
		// random multimers
		{
			f.mAggregate.resize( kNewFragNumAggregateBands );
			
			if ( mRand.nextFloat() < kConfig.mNewFragChanceMultimer )
			{
				int r = mRand.nextInt( (int)f.mAggregate.size() );
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
		fragmentDidChange((int)mSample->mFragments.size()-1);
		
		mMolecularSim.setSample( getSample() );
	}
}

void SampleView::deleteFragment( int i )
{
	mMolecularSim.deleteFragment(i);
	fragmentDidChange(-1);			
}
