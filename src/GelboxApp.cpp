#include "cinder/app/RendererGl.h"
#include "cinder/gl/gl.h"

#include "Gel.h"
#include "GelView.h"
#include "Sample.h"
#include "SampleTubeView.h"
#include "SampleView.h"
#include "View.h"
#include "Slider.h"
#include "SliderView.h"
#include "ImageView.h"
#include "Interaction.h"
#include "OperationView.h"

#include "GelboxApp.h"

using namespace ci;
using namespace ci::app;
using namespace std;

GelboxApp* GelboxApp::mInstance = 0;

GelboxApp::GelboxApp()
{
	assert( !mInstance );
	mInstance = this;
}

GelboxApp::~GelboxApp()
{
	assert( mInstance==this );
	mInstance=0;
}

void GelboxApp::setup()
{
	setWindowSize( 1324, 768 );
	
//	glEnable( GL_MULTISAMPLE_ARB );
	glEnable( GL_LINE_SMOOTH );
//	glEnable( GL_POLYGON_SMOOTH );
	
	// make gel
	makeGel( ivec2( getWindowWidth()/4 - 64, getWindowHeight()/2 ) );
	
	// ui assets
	mUIFont = gl::TextureFont::create( Font("Avenir",12) );
	
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
	
	// deprecated
	if (0)
	{
		auto ov = make_shared<OperationView>("Degrade",
			[]( const Sample &s )
			{
				Sample s2=s;
				s2.degrade(.1f);
				return s2;
			}
		);
		
		Rectf r( 0, 0, 64, 64 );
		r.offsetCenterTo( vec2(500,64) );
		
		ov->setFrameAndBoundsWithSize(r);
		
		mViews.addView(ov);
	}
}

void GelboxApp::makeGel( vec2 center )
{	
	// layout in cm;
	// this messes up our Timeline view, which is parented to us.
	// i think there is a bug in View that prevents me from putting it right;
	// but in any event, doing the timeline layout in cm doesn't feel right (though maybe it is)
/*
	// gel
	auto gel = make_shared<Gel>();
	gel->setLayout( 12.f, 14.f, 5, 1.f );
	
	// gel view
	auto gelView = make_shared<GelView>( gel );
	
	{
		Rectf frame( vec2(0,0), gel->getSize() );
		frame.scale( 300.f / frame.getWidth() ); // make gelview 300pts wide (it's only 12cm wide internally) 
		frame.offsetCenterTo(center);
		
		gelView->setFrame( frame );
		mViews.addView(gelView);
	}
*/

	// gel
	auto gel = make_shared<Gel>();
	gel->setLayout( 300.f, 400.f, 7, 20.f ); // layout in points
	
	// gel view
	auto gelView = make_shared<GelView>( gel );
	
	{
		Rectf frame = gelView->getFrame();
		frame += center - frame.getCenter();
		
		gelView->setFrame( frame );
		mViews.addView(gelView);
	}
	
	// timeline slider
	{
		const float kMaxMinutes = 60 * 3; // 3 hrs 
		const float kGelGutter  = 20;
		const float kIconGutter = 16.f;
		
		Slider s;

		s.mValueMappedLo = 0;
		s.mValueMappedHi = 1.f;
		s.mSetter = [gel,gelView]( float v ) {
			gel->setTime(v);
			gelView->timeDidChange();
		};
		s.mGetter = [gel]() {
			return gel->getTime();
		};
		s.mMappedValueToStr = [kMaxMinutes]( float v )
		{
			v *= kMaxMinutes;
			
			int m = roundf(v); // we get fractional values, so fix that.
			
			int mins = m % 60;
			int hrs  = m / 60;
			
			string minstr = toString(mins);
			if (minstr.size()==1) minstr = string("0") + minstr;
			
			return toString(hrs) + ":" + minstr ;
		};
		
		fs::path iconPathBase = getAssetPath("slider-icons");
		s.loadIcons(
			iconPathBase / "clock-lo.png",
			iconPathBase / "clock-hi.png"
			); 
		
		s.doLayoutInWidth( gelView->getFrame().getWidth(), kIconGutter );
		s.pullValueFromGetter();
		
		auto sv = make_shared<SliderView>(s);
		
		sv->setFrame( sv->getFrame() + gelView->getFrame().getLowerLeft() + vec2(0,kGelGutter) );
		
		mViews.addView(sv);
	}
	
	// add samples
	try
	{
		fs::path ladder = getAssetPath("palette") / "1kbladder.xml";
		
		SampleRef sample = loadSample( ladder );
		
		gel->setSample( sample, 0 );
	}
	catch (...) {
		cerr << "ERROR loading 1kb ladder" << endl;
	}
}

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
}

void GelboxApp::mouseDown( MouseEvent event )
{
	if ( Interaction::get() ) Interaction::get()->mouseDown(event);
	mViews.mouseDown(event);
	
	if ( !mViews.getMouseDownView() ) mViews.setKeyboardFocusView(0);
}

void GelboxApp::mouseUp( MouseEvent event )
{
	if ( Interaction::get() ) Interaction::get()->mouseUp(event);
	mViews.mouseUp(event);
}

void GelboxApp::mouseMove( MouseEvent event )
{
	if ( Interaction::get() ) Interaction::get()->mouseMove(event);
	mViews.mouseMove(event);
}

void GelboxApp::mouseDrag( MouseEvent event )
{
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
		if ( ext == ".xml" )
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

void GelboxApp::keyDown  ( ci::app::KeyEvent event )
{
	if ( mViews.getKeyboardFocusView() ) mViews.getKeyboardFocusView()->keyDown(event);
}

void GelboxApp::keyUp    ( ci::app::KeyEvent event )
{
	if ( mViews.getKeyboardFocusView() ) mViews.getKeyboardFocusView()->keyUp(event);
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
	if (0)
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

#if defined( CINDER_MSW ) && ! defined( CINDER_GL_ANGLE )
auto options = RendererGl::Options().version( 3, 3 ); // instancing functions are technically only in GL 3.3
#else
auto options = RendererGl::Options().msaa(4); // implemented as extensions in Mac OS 10.7+
#endif

CINDER_APP( GelboxApp, RendererGl )