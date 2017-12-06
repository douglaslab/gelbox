#include "cinder/app/App.h"
#include "cinder/app/RendererGl.h"
#include "cinder/gl/gl.h"

#include "Gel.h"
#include "GelView.h"
#include "GelParticleSource.h"
#include "View.h"
#include "TimelineView.h"
#include "ImageView.h"

using namespace ci;
using namespace ci::app;
using namespace std;

class GelboxApp : public App {
  public:
	void setup() override;
	void mouseDown( MouseEvent event ) override;
	void mouseUp  ( MouseEvent event ) override;
	void mouseMove( MouseEvent event ) override;
	void mouseDrag( MouseEvent event ) override;
	void fileDrop ( FileDropEvent event ) override;

	void update() override;
	void draw() override;
	
	void makeGel( const GelParticleSource&, vec2 center );
	
  public:
	ViewCollection		mViews;
	
	GelParticleSource	mGelSource;
	
};

void GelboxApp::setup()
{
	// get gel source data
	try {
		mGelSource.loadXml( ci::XmlTree(loadAsset("gel.xml")) );
		makeGel( mGelSource, getWindowCenter() );
	} catch (...) {
		cout << "failed to load gel.xml" << endl;
	}
}

void GelboxApp::makeGel( const GelParticleSource& source, vec2 center )
{	
	// gel
	auto gel = make_shared<Gel>();
	gel->setLayout( 300.f, 400.f, 5 );
	
	// populate it
//	gel->insertSamples( source, 0, 10   );
	int col=0;
	gel->insertSamples( source, col++, 100  );
	gel->insertSamples( source, col++, 100  );
	gel->insertSamples( source, col++, 100  );
	gel->insertSamples( source, col++, 100  );
	gel->insertSamples( source, col++, 1000 );
	
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
		
		timelineView->setParent(gelView);
		
		mViews.addView(timelineView);
	}
}

void GelboxApp::mouseDown( MouseEvent event )
{
	mViews.mouseDown(event);
}

void GelboxApp::mouseUp( MouseEvent event )
{
	mViews.mouseUp(event);
}

void GelboxApp::mouseMove( MouseEvent event )
{
	mViews.mouseMove(event);
}

void GelboxApp::mouseDrag( MouseEvent event )
{
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
			} catch (...)
			{
				cout << "Failed to load image '" << i << "'" << endl;
			}
		}
	}
}

void GelboxApp::update()
{	
	mViews.tick(.1f);
}

void GelboxApp::draw()
{
	gl::clear( Color( 1, 1, 1 ) );
	
	mViews.draw();
}

CINDER_APP( GelboxApp, RendererGl )
