#include "cinder/app/RendererGl.h"
#include "cinder/gl/gl.h"

#include "Gel.h"
#include "GelView.h"
#include "GelSim.h"
#include "Sample.h"
#include "ButtonView.h"
#include "AppSettingsView.h"
#include "GelSettingsView.h"
#include "SampleView.h"
#include "View.h"
#include "Slider.h"
#include "SliderView.h"
#include "ImageView.h"
#include "Interaction.h"
#include "Layout.h"
#include "Config.h"

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

ci::gl::TextureFontRef GelboxApp::getUIFont( int scale, int *oScale )
{
	if ( scale==2 )
	{
		if (oScale) *oScale = 2;
		return mUIFont2x;
	}
	else
	{
		if (oScale) *oScale = 1;
		return mUIFont;		
	}
}

void GelboxApp::setup()
{
	mOverloadedAssetPath = calcOverloadedAssetPath();

	setWindowSize( kLayout.mWindowSize );
		
//	glEnable( GL_MULTISAMPLE_ARB );
	glEnable( GL_LINE_SMOOTH );
//	glEnable( GL_POLYGON_SMOOTH );
	
	makeGel();
	makeSettingsBtn();
	makeHelpBtn();
	
	// ui assets
	mUIFont   = gl::TextureFont::create( Font(kLayout.mUIFont,kLayout.mUIFontSize) );
	mUIFont2x = gl::TextureFont::create( Font(kLayout.mUIFont,kLayout.mUIFontSize*2) );
	
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
	
	// load tuning data
	{
		mFileWatch.loadJson( mOverloadedAssetPath / "tuning" / "sim.json",
			[this]( JsonTree json )
		{
			GelSim::gTuning.load(json);
			
			// re-run simulation
			if (mGelView) {
				if (mGelView->getGel()) mGelView->getGel()->syncBandsToSamples();
				mGelView->gelDidChange();
			}
		});
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
	mGelView = make_shared<GelView>();
	
	{
		mGelView->setup(gel);
		
		mViews.addView(mGelView);

		mGelView->mLayoutFunction = [this]( GelView &g )
		{
			Rectf frame = g.getFrame();
			
			vec2 tl = kLayout.mGelTopLeft;
			
			const vec2 d = vec2(getWindowSize()) - kLayout.mWindowSize;
			
			if ( d.x > 0.f ) tl.x += d.x * .4f;
			else tl.x += d.x * .8f;
			
			tl.y += d.y * .5f; 

			tl = round(tl);			
			tl = max( tl, kLayout.mGelTopLeftMin );
			
			frame += tl - frame.getUpperLeft();
			
			g.setFrame( frame );
		};
		
		mGelView->mLayoutFunction(*mGelView);		
	}
	
	// gel timeline slider
	if ( kConfig.mTimelineBelowGel )
	{
		Slider s = GelSettingsView::getTimelineSlider(mGelView);
		
		float w = mGelView->getBounds().getWidth();

		if ( kLayout.mGelSettingsBtnRightOfGel ) {
			w -= kLayout.mBtnGutter * 2.f;
		} else {
			w -= kLayout.mFragViewSliderIconNotionalSize.x;
			w -= kLayout.mBtnGutter * 3.f;
		}
		
		s.doLayoutInWidth(
			w,
			kLayout.mFragViewSlidersIconGutter,
			kLayout.mFragViewSliderIconNotionalSize
		);
		
		auto sv = make_shared<SliderView>(s);
		sv->setParent( mGelView );
		
		sv->setFrame(
			sv->getFrame()
			+ vec2(
				kLayout.mBtnGutter, // + kLayout.mFragViewSliderIconNotionalSize.x,
//				0.f,
				mGelView->getBounds().getHeight() + kLayout.mBtnGutter )
			); 
	}
	
	// add samples
	try
	{
		fs::path ladder = getAssetPath("palette") / "1kbladder.xml";
		
		SampleRef sample;
		load( ladder, 0, &sample );
		
		mGelView->getGel()->setSample( sample, 0 );
		mGelView->gelDidChange();
	}
	catch (...) {
		cerr << "ERROR loading 1kb ladder" << endl;
	}
}

void GelboxApp::makeSettingsBtn()
{
	mSettingsBtn = make_shared<ButtonView>();
	
	int scale;
	auto img = kLayout.uiImage("settings.png",&scale);
	mSettingsBtn->setup( img, scale );
	
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

	mSettingsBtn->mLayoutFunction = [this]( ButtonView& b )
	{
		Rectf r( vec2(0.f), b.getFrame().getSize() );
		r += vec2(0.f,getWindowSize().y) + vec2(kLayout.mBtnGutter,-kLayout.mBtnGutter) - r.getLowerLeft(); 
		b.setFrame(r);
	};
	
	mSettingsBtn->mLayoutFunction(*mSettingsBtn);
}

void GelboxApp::makeHelpBtn()
{
	mHelpBtn = make_shared<ButtonView>();
	
	int scale;
	auto img = kLayout.uiImage("help.png",&scale);
	mHelpBtn->setup( img, scale );
	
	mHelpBtn->mClickFunction = [this]()
	{
		string cmd = "open '";
		cmd += kConfig.mHelpURL;
		cmd += "'";
		
		::system(cmd.c_str());
	};

	mViews.addView(mHelpBtn);

	mHelpBtn->mLayoutFunction = [this]( ButtonView& b )
	{
		Rectf r( vec2(0.f), b.getFrame().getSize() );
		r += vec2(getWindowSize()) + vec2(-kLayout.mBtnGutter,-kLayout.mBtnGutter) - r.getLowerRight(); 
		b.setFrame(r);
	};
	
	mHelpBtn->mLayoutFunction(*mHelpBtn);
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
	
	for( auto i : files )
	{
		load( i, &pos );
	}
}

void GelboxApp::load( ci::fs::path i, const vec2 *dropLoc, SampleRef *sampleOut )
{
	const vector<string>	imgExtensions = {".jpg",".png",".gif"};

	auto doSample = [=]( SampleRef source )
	{
		if ( !source ) return;
		
		if ( sampleOut )
		{
			*sampleOut = source;
		}
		else if ( mGelView && mGelView->getGel() )
		{
			int lane = -1;
			
			if (dropLoc) lane = pickLaneForDroppedSample( *dropLoc );
			
			if (lane==-1) lane = mGelView->getGel()->getFirstEmptyLane();
			
			if (lane!=-1)
			{
				mGelView->setSample(lane,source);
			}
			else
			{
				makeIconForSample( source, dropLoc );
			}
		}		
	};
	
	auto doGel = [=]( GelRef gel )
	{
		if (gel && mGelView) mGelView->setGel(gel);		
	};
	
	std::string ext = i.extension().string();
	
	// xml?
	if ( ext == ".xml" )
	{
		try
		{
			XmlTree xml( loadFile(i) );
			
			doSample( tryXmlToSample(xml) );
			doGel   ( tryXmlToGel   (xml) );			
		}
		catch (...) {
			cout << "Failed to load .xml '" << i << "'" << endl;
		}
	}

	// json?
	if ( ext == ".json" )
	{
		try
		{
			JsonTree json( loadFile(i) );
			
			string ftype = getJsonSaveFileType(json);
			
			if ( ftype == "sample" )
			{
				doSample( tryJsonToSample(json) );
			}
			else if ( ftype == "gel" )
			{
				doGel( tryJsonToGel(json) );
			}
			else cerr << "Unknown json file type '" << ftype << "'" << endl; 
		}
		catch (...) {
			cerr << "Failed to load .json '" << i << "'" << endl;
		}
	}
			
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
				
				if (dropLoc) frame.offsetCenterTo(*dropLoc);
				
				imageView->setFrame( frame );
				
				mViews.addView(imageView);
				
				mViews.setKeyboardFocusView(imageView);
			}
		} catch (...) {
			cout << "Failed to load image '" << i << "'" << endl;
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

int GelboxApp::pickLaneForDroppedSample( vec2 dropPos ) const
{
	int lane = -1;
	
	// try picking
	lane = mGelView->pickLane( mGelView->rootToParent(dropPos) );

	if (lane==-1) lane = mGelView->pickMicrotube( mGelView->rootToChild(dropPos) );
	
	// already full?
	if ( lane != -1 && mGelView->getSample(lane) ) {
		lane = -1;
	}

	return lane;
}

void GelboxApp::makeIconForDroppedSample( SampleRef, vec2 dropPos )
{
	// TODO
}

void GelboxApp::makeIconForSample( SampleRef s, const vec2 *dropLoc )
{
	vec2 pos;
	
	if (dropLoc) pos = *dropLoc;
	else
	{
		// TODO find a pos; random? good place? offset from last?
		pos.x = randFloat( 0.f, getWindowSize().x );
		pos.y = randFloat( 0.f, getWindowSize().y );
	}
	
	makeIconForDroppedSample(s,pos);
}

SampleRef GelboxApp::tryXmlToSample ( ci::XmlTree xml ) const
{
	if ( xml.hasChild(Sample::kRootXMLNodeName) )
	{
		return std::make_shared<Sample>(xml);
	}
	else return 0;
}

GelRef GelboxApp::tryXmlToGel ( ci::XmlTree ) const
{
	// not supported; we don't even save it.
	return 0;
}

SampleRef GelboxApp::tryJsonToSample( ci::JsonTree j ) const
{
	SampleRef s;
	
	if ( getJsonSaveFileType(j) == "sample"
	  && j.hasChild("Sample") )
	{
		s = Sample::fromJson( j.getChild("Sample") );
	}
	
	return s;
}

GelRef GelboxApp::tryJsonToGel ( ci::JsonTree ) const
{
	// TODO
	return 0;
}

std::string GelboxApp::getJsonSaveFileType( ci::JsonTree j ) const
{
	if ( j.hasChild("Gelbox")
	  && j.hasChild("Gelbox.version")
	  && j.hasChild("Gelbox.type")
	   )
	{
		string version = j.getValueForKey("Gelbox.version");
		string ftype   = j.getValueForKey("Gelbox.type");
		cout << "Verified json save file, version '" << version << "', type '" << ftype << "'" << endl;
		return ftype;		
	}
	else return "";
}

ci::JsonTree GelboxApp::wrapJsonToSaveInFile( ci::JsonTree t, std::string ftype ) const
{
	JsonTree j = JsonTree::makeObject();
	
	JsonTree g = JsonTree::makeObject("Gelbox");
	g.addChild( JsonTree( "version", kConfig.mAppFileVersion ) );
	g.addChild( JsonTree( "type",    ftype ) );
	j.addChild(g);
	
	j.addChild(t);
	
	return j;
}

void GelboxApp::promptUserToSaveSample( SampleRef s )
{
	if (!s) return;
	
	fs::path p = getSaveFilePath( fs::path(), std::vector<string>{"json"} );
	
	if ( !p.empty() )
	{
		JsonTree j = wrapJsonToSaveInFile( s->toJson(), "sample" );
		j.write(p);
	}
}

void GelboxApp::promptUserToSaveGel( GelRef g )
{
	if (!g) return;
	
	fs::path p = getSaveFilePath( fs::path(), std::vector<string>{"json"} );

	if ( !p.empty() )
	{
		JsonTree j = wrapJsonToSaveInFile( g->toJson(), "gel" );
		j.write(p);
	}		
}

void GelboxApp::promptUserToOpenFile()
{
	fs::path p = getOpenFilePath( fs::path(), std::vector<string>{"json","xml"} );

	if ( !p.empty() )
	{
		load(p);
	}
}

void GelboxApp::keyDown  ( ci::app::KeyEvent event )
{
	mModifierKeys = getModifierKeys(event);
	
	if ( event.isMetaDown() )
	{
		switch(event.getCode())
		{
			case KeyEvent::KEY_s:
				if (mGelView)
				{
					if ( event.isAltDown() )
					{
						// save sample (if one is selected)
						if ( mGelView->getSelectedMicrotube() != -1 ) {
							promptUserToSaveSample( mGelView->getSample(mGelView->getSelectedMicrotube()) );
						}
					}
					else
					{
						// save whole gel
						if (mGelView->getGel()) {
							promptUserToSaveGel( mGelView->getGel() );
						}
					}
				}
				break;

			case KeyEvent::KEY_o:
				promptUserToOpenFile();
				break;
			
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

void GelboxApp::resize()
{
	mViews.resize();
}

void GelboxApp::update()
{
	mFileWatch.update();
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

void GelboxApp::prepareSettings( Settings *settings )
{
	settings->setResizable( kConfig.mEnableWindowResize );
	settings->setHighDensityDisplayEnabled( kConfig.mEnableHDDisplay );
}

ci::fs::path GelboxApp::calcOverloadedAssetPath() const
{
	// env vars for hotloading assets
	{
		const char* srcroot = getenv("GELBOXSRCROOT");
		if (srcroot) {
			return (fs::path(srcroot) / ".." / "assets"); // assuming "assets" directory is ../assets relative to xcode proj file
		}
	}
	
	auto d = getAssetDirectories();
	
	if (d.empty()) {
		cerr << "Failed to find any asset directories" << endl;
		return fs::path(); // !?!
	}
	else return d[0];
}

#if defined( CINDER_MSW ) && ! defined( CINDER_GL_ANGLE )
auto options = RendererGl::Options().version( 3, 3 ); // instancing functions are technically only in GL 3.3
#else
auto options = RendererGl::Options().msaa(4); // implemented as extensions in Mac OS 10.7+
#endif

CINDER_APP( GelboxApp, RendererGl(options), GelboxApp::prepareSettings )
