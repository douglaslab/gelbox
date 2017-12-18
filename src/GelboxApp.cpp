#include "cinder/app/RendererGl.h"
#include "cinder/gl/gl.h"

#include "Gel.h"
#include "GelView.h"
#include "Sample.h"
#include "SampleView.h"
#include "View.h"
#include "TimelineView.h"
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
//	glEnable( GL_MULTISAMPLE_ARB );
//	glEnable( GL_LINE_SMOOTH );
//	glEnable( GL_POLYGON_SMOOTH );
	
	// make gel
	makeGel( getWindowCenter() );
	
	// ui assets
	mUIFont = gl::TextureFont::create( Font("Avenir",12) );
	
	// gel source palette
	bool verbosePalette = true;
	
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
	
	//
	{
		auto ov = make_shared<OperationView>("Degrade",
			[]( const Sample &s )
			{
				Sample s2;
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
	gel->setLayout( 300.f, 400.f, 5, 10.f ); // layout in points
	
	// gel view
	auto gelView = make_shared<GelView>( gel );
	
	{
		Rectf frame = gelView->getFrame();
		frame += center - frame.getCenter();
		
		gelView->setFrame( frame );
		mViews.addView(gelView);
	}
	
	// timeline
	{
		// in gelview frame coordinate space
		const float kTimelineHeight = 20.f;
		const float kTimelineGutter = 10.f;
		
		vec2 topleft( 0, gelView->getFrame().getHeight() + kTimelineGutter ); 
		vec2 size   ( gelView->getFrame().getWidth(), kTimelineHeight );
		Rectf timelineRect( topleft, topleft + size );
		
		auto timelineView = make_shared<TimelineView>( timelineRect );
		
		timelineView->mGetTime		= [gel](){ return gel->getTime(); };
		timelineView->mSetTime		= [gel]( float t ){ gel->setTime(t); };
		timelineView->mGetDuration	= [gel](){ return gel->getDuration(); };
		timelineView->mGetIsPlaying = [gel](){ return ! gel->getIsPaused(); };
		timelineView->mSetIsPlaying = [gel]( bool v ){ gel->setIsPaused( !v ); };
		// This is silly. Let's just make a TimelineModelInterface and subclass it;
		// If we want this level of runtime customization then let's just have a subclass
		// with a bunch of closures. 
		
		timelineView->setParent(gelView);
		
		mViews.addView(timelineView);
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
					SampleViewRef view	= std::make_shared<SampleView>(source);
					
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
				gl::TextureRef image = gl::Texture::create( loadImage(i) );
				
				if (image) {
					// make view
					auto imageView = make_shared<ImageView>(image);
					
					// center frame on drop loc
					Rectf frame = imageView->getFrame();
					
					frame.offsetCenterTo(pos);
					
					imageView->setFrame( frame );
					
					mViews.addView(imageView);
				}
			} catch (...) {
				cout << "Failed to load image '" << i << "'" << endl;
			}
		}
	}
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

CINDER_APP( GelboxApp, RendererGl )
