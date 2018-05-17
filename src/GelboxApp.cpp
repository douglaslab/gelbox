#include "cinder/app/RendererGl.h"
#include "cinder/gl/gl.h"

#include "Gel.h"
#include "GelView.h"
#include "GelSim.h"
#include "Sample.h"
#include "ButtonView.h"
#include "AppSettingsView.h"
//#include "SampleTubeView.h"
#include "SampleView.h"
#include "View.h"
#include "Slider.h"
#include "SliderView.h"
#include "ImageView.h"
#include "Interaction.h"
#include "Layout.h"
//#include "OperationView.h"

#include "GelboxApp.h"

using namespace ci;
using namespace ci::app;
using namespace std;

const bool kVerboseMoveDragEvents = false; // to demonstrate libcinder bug, if first mouse down is r-click then we don't get move OR drag events. 
const bool kPrintFontNames = false;

GelboxApp* GelboxApp::mInstance = 0;

GelboxApp::GelboxApp()
{
	assert( !mInstance );
	mInstance = this;
	
	// test fonts
	if (kPrintFontNames)
	{
		cout << "Fonts:" << endl;
		auto fnames = Font::getNames();
		for ( auto n : fnames )
		{
			cout << "\t" << n << endl;
		}
	}
}

GelboxApp::~GelboxApp()
{
	assert( mInstance==this );
	mInstance=0;
}

void GelboxApp::setup()
{
	setWindowSize( kLayout.mWindowSize );
	
		
//	glEnable( GL_MULTISAMPLE_ARB );
	glEnable( GL_LINE_SMOOTH );
//	glEnable( GL_POLYGON_SMOOTH );
	
	makeGel();
	makeSettingsBtn();
	makeHelpBtn();
	
	// ui assets
	mUIFont = gl::TextureFont::create( Font(kLayout.mUIFont,kLayout.mUIFontSize) );
	
	// gel source palette
	bool verbosePalette = true;
	bool loadPalette = false;
	
	if (loadPalette)
	{
		try
		{
			vec2 pos(64,64), posDelta(0,128);
			
			if (verbosePalette) cout << "Palette path: " << getAssetPath("palette") << endl;
			
			for( auto& p : fs::directory_iterator(getAssetPath("palette")) )
			{
				if (verbosePalette) cout << "\t" << p << '\n';
				fileDrop( FileDropEvent( getWindow(), pos.x, pos.y, {p.path()} ));
				pos += posDelta;
			}
		}
		catch (...)
		{
			cout << "Could not find palette" << endl;
		}
	}	
}

void GelboxApp::makeGel()
{	
	// layout in cm;
	// this messes up our Timeline view, which is parented to us.
	// i think there is a bug in View that prevents me from putting it right;
	// but in any event, doing the timeline layout in cm doesn't feel right (though maybe it is)
	// -- maybe it should just track it as a sibling attachment?

	// gel
	auto gel = make_shared<Gel>();
	gel->setLayout(
		kLayout.mGelSize.x, 
		kLayout.mGelSize.y,
		kLayout.mGelDefaultLanes,
		kLayout.mGelWellGutter ); // layout in points
	
	// gel view
	auto gelView = make_shared<GelView>();
	mGelView = gelView;
	
	{
		gelView->setup(gel);
		
		Rectf frame = gelView->getFrame();
		frame += kLayout.mGelTopLeft - frame.getUpperLeft();
		
		gelView->setFrame( frame );
		mViews.addView(gelView);
	}
	
	// add samples
	try
	{
		fs::path ladder = getAssetPath("palette") / "1kbladder.xml";
		
		SampleRef sample = loadSample( ladder );
		
		gel->setSample( sample, 0 );
		gelView->gelDidChange();
	}
	catch (...) {
		cerr << "ERROR loading 1kb ladder" << endl;
	}
}

void GelboxApp::makeSettingsBtn()
{
	mSettingsBtn = make_shared<ButtonView>();
	
	mSettingsBtn->setup( kLayout.uiImage("settings.png"), 1 );
	
	mSettingsBtn->mClickFunction = [this]()
	{
		if (mSettingsView)
		{
			mSettingsView->close();
			mSettingsView=0;
		}
		else
		{
			mSettingsView = make_shared<AppSettingsView>();
			mSettingsView->setup( mGelView );
			mSettingsView->setParent(mSettingsBtn);
		}
	};

	mViews.addView(mSettingsBtn);

	Rectf r( vec2(0.f), mSettingsBtn->getFrame().getSize() );
	r += vec2(0.f,getWindowSize().y) + vec2(kLayout.mBtnGutter,-kLayout.mBtnGutter) - r.getLowerLeft(); 
	mSettingsBtn->setFrame(r);
}

void GelboxApp::makeHelpBtn()
{
	mHelpBtn = make_shared<ButtonView>();
	
	mHelpBtn->setup( kLayout.uiImage("help.png"), 1 );
	
	mHelpBtn->mClickFunction = [this]()
	{
		string cmd = "open '";
		cmd += kLayout.mHelpURL;
		cmd += "'";
		
		system(cmd.c_str());
	};

	mViews.addView(mHelpBtn);

	Rectf r( vec2(0.f), mHelpBtn->getFrame().getSize() );
	r += vec2(getWindowSize()) + vec2(-kLayout.mBtnGutter,-kLayout.mBtnGutter) - r.getLowerRight(); 
	mHelpBtn->setFrame(r);
}

/*
DropTargetRef GelboxApp::pickDropTarget( ci::vec2 loc ) const
{
	DropTargetRef target;
	
	mViews.pickView( loc, [&target]( ViewRef view, vec2 inFrameLoc ) -> bool
	{
		DropTargetSourceRef source = dynamic_pointer_cast<DropTargetSource>(view);
		
		if ( source )
		{
			DropTargetRef t = source->getDropTarget(inFrameLoc);
			if (t)
			{
				target=t;
				return true;
			}
		}
		
		return false;
	});
	
	return target;
}*/

void GelboxApp::mouseDown( MouseEvent event )
{
	if ( Interaction::get() ) Interaction::get()->mouseDown(event);
	mViews.mouseDown(event);
	
	if ( !mViews.getMouseDownView() ) {
		mViews.setKeyboardFocusView(0);
	}

	// implicitly close things...
	bool hitSettings =    mViews.getMouseDownView() == mSettingsBtn
					  || (mViews.getMouseDownView() && mViews.getMouseDownView()->hasAncestor(mSettingsBtn)); 
	
	if ( mSettingsView && !hitSettings )
	{
		mSettingsView->close();
		mSettingsView=0;
	}
}

void GelboxApp::mouseUp( MouseEvent event )
{
	if ( Interaction::get() ) Interaction::get()->mouseUp(event);
	mViews.mouseUp(event);
}

void GelboxApp::mouseMove( MouseEvent event )
{
	if (kVerboseMoveDragEvents) cout << "move " << getElapsedFrames() << endl;
	
	if ( Interaction::get() ) Interaction::get()->mouseMove(event);
	
	mViews.mouseMove(event);
}

void GelboxApp::mouseDrag( MouseEvent event )
{
	if (kVerboseMoveDragEvents) cout << "drag " << getElapsedFrames() << endl;

	if ( Interaction::get() ) Interaction::get()->mouseDrag(event);
	mViews.mouseDrag(event);
}

void GelboxApp::fileDrop ( FileDropEvent event )
{
	auto					files		  = event.getFiles();
	const vec2				pos			  = vec2( event.getPos() );
	const vector<string>	imgExtensions = {".jpg",".png",".gif"};
	
	for( auto i : files )
	{
		std::string ext = i.extension().string();
		
		// xml?
/*		if ( ext == ".xml" )
		{
			try
			{
				XmlTree xml( loadFile(i) );
				
				// Sample?
				if ( xml.hasChild(Sample::kRootXMLNodeName) )
				{
					SampleRef	 source = std::make_shared<Sample>(xml);
					SampleTubeViewRef view	= std::make_shared<SampleTubeView>(source);
					
					view->setFrame( view->getFrame() + (pos - view->getFrame().getCenter()) );
					
					mViews.addView(view);
				}
			}
			catch (...) {
				cout << "Failed to load .xml '" << i << "'" << endl;
			}
		}*/
		
		// image?
		if ( find( imgExtensions.begin(), imgExtensions.end(), ext ) != imgExtensions.end() )
		{
			try {
				gl::TextureRef image = gl::Texture::create( loadImage(i), gl::Texture2d::Format().mipmap() );
				
				if (image) {
					// make view
					auto imageView = make_shared<ImageView>(image);
					
					// center frame on drop loc
					Rectf frame = imageView->getFrame();
					
					frame.offsetCenterTo(pos);
					
					imageView->setFrame( frame );
					
					mViews.addView(imageView);
					
					mViews.setKeyboardFocusView(imageView);
				}
			} catch (...) {
				cout << "Failed to load image '" << i << "'" << endl;
			}
		}
	}
}

int	GelboxApp::getModifierKeys( ci::app::KeyEvent e ) const
{
	int m=0;
	
	if (e.isShiftDown())	m |= app::KeyEvent::SHIFT_DOWN;
	if (e.isAltDown())		m |= app::KeyEvent::ALT_DOWN;
	if (e.isControlDown())	m |= app::KeyEvent::CTRL_DOWN;
	if (e.isMetaDown())		m |= app::KeyEvent::META_DOWN;
	
	return m;
}

void GelboxApp::keyDown  ( ci::app::KeyEvent event )
{
	mModifierKeys = getModifierKeys(event);
	
	if ( event.isMetaDown() )
	{
		switch(event.getCode())
		{
			case KeyEvent::KEY_r:
				if (mGelView) mGelView->enableGelRender( !mGelView->isGelRenderEnabled()  );
				break;
				
			case KeyEvent::KEY_l:
				if (mGelView) mGelView->enableLoupeOnHover( !mGelView->isLoupeOnHoverEnabled() );
				break;
			
			default:break;
		}
	}
	
	if ( mViews.getKeyboardFocusView() ) mViews.getKeyboardFocusView()->keyDown(event);
	
	// HACK to let it pickup any changes to meta key for hover
	if (mGelView) mGelView->keyDown(event);
}

void GelboxApp::keyUp    ( ci::app::KeyEvent event )
{
	mModifierKeys = getModifierKeys(event);

	if ( mViews.getKeyboardFocusView() ) mViews.getKeyboardFocusView()->keyUp(event);

	// HACK to let it pickup any changes to meta key for hover
	if (mGelView) mGelView->keyUp(event);
}

void GelboxApp::update()
{	
	mViews.tick(.1f);
	if ( Interaction::get() ) Interaction::get()->update();
}

void GelboxApp::draw()
{
	gl::clear( Color( 1, 1, 1 ) );
	
	mViews.draw();

	// anti-aliasing/smoothing test
	if ((0))
	{
		Rectf r(0,0,10,10);	
		gl::color( 0,0,0 );
		for( int i=0; i<4; ++i )
		{
			gl::drawSolidRect(r);
			r += vec2( r.getWidth() * 2.f, .25f );
		}
		
		gl::drawLine( vec2(0, 0), vec2(50, 200) );
	}
	
	//
	if ( Interaction::get() ) Interaction::get()->draw();
}

SampleRef GelboxApp::loadSample( ci::fs::path path ) const
{
	std::string ext = path.extension().string();
	SampleRef source;
	
	// xml?
	if ( ext == ".xml" )
	{
		try
		{
			XmlTree xml( loadFile(path) );
			
			// Sample?
			if ( xml.hasChild(Sample::kRootXMLNodeName) )
			{
				source = std::make_shared<Sample>(xml);
			}
			else
			{
				cerr << "ERROR xml for sample " << path << " has no root '"
					 << Sample::kRootXMLNodeName << "'" << endl;
			}
		}
		catch(...)
		{
			cerr << "ERROR could not parse xml for sample " << path << endl; 
		}
	}
	else cerr << "ERROR sample " << path << " is not .xml file" << endl;
	
	return source;
}	

void GelboxApp::prepareSettings( Settings *settings )
{
	settings->setResizable(false);
}

#if defined( CINDER_MSW ) && ! defined( CINDER_GL_ANGLE )
auto options = RendererGl::Options().version( 3, 3 ); // instancing functions are technically only in GL 3.3
#else
auto options = RendererGl::Options().msaa(4); // implemented as extensions in Mac OS 10.7+
#endif

CINDER_APP( GelboxApp, RendererGl, GelboxApp::prepareSettings )
