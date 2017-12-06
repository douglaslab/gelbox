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
	
  public:
	ViewCollection		mViews;
	
	GelParticleSource	mGelSource;
	
};

void GelboxApp::setup()
{
	// init source data
	try {
		mGelSource.loadXml( ci::XmlTree(loadAsset("gel.xml")) );
	} catch (...) {
		cout << "failed to load gel.xml" << endl;
	}
	
	// gel
	auto gel = make_shared<Gel>();
	gel->setLayout( 300.f, 400.f, 5 );
	
//	gel->insertSamples( mGelSource, 0, 10   );
	int col=0;
	gel->insertSamples( mGelSource, col++, 100  );
	gel->insertSamples( mGelSource, col++, 100  );
	gel->insertSamples( mGelSource, col++, 100  );
	gel->insertSamples( mGelSource, col++, 100  );
	gel->insertSamples( mGelSource, col++, 1000 );
	
	// gel view
	auto gelView = make_shared<GelView>( gel );
	
	{
		gelView->setFrame( gelView->getFrame().getOffset( vec2(100,10)) );
		mViews.addView(gelView);
	}
	
	// timeline
	{
		Rectf timelineRect( vec2(100,440), vec2(400,460) );
		
		auto timelineView = make_shared<TimelineView>( timelineRect );
		
		timelineView->mGetTime		= [gel](){ return gel->getTime(); };
		timelineView->mSetTime		= [gel]( float t ){ gel->setTime(t); };
		timelineView->mGetDuration	= [gel](){ return gel->getDuration(); };
		timelineView->mGetIsPlaying = [gel](){ return ! gel->getIsPaused(); };
		timelineView->mSetIsPlaying = [gel]( bool v ){ gel->setIsPaused( !v ); };
		
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
