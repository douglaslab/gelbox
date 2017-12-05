#include "cinder/app/App.h"
#include "cinder/app/RendererGl.h"
#include "cinder/gl/gl.h"

#include "Gel.h"
#include "GelView.h"
#include "GelParticleSource.h"

using namespace ci;
using namespace ci::app;
using namespace std;

class GelboxApp : public App {
  public:
	void setup() override;
	void mouseDown( MouseEvent event ) override;
	void update() override;
	void draw() override;
	
  public:
	GelParticleSource	mGelSource;
	GelRef				mGel;
	GelViewRef			mGelView;
	
};

void GelboxApp::setup()
{
	// init source data
	{
		GelParticleSource::Kind k[3];
		k[0].mSpeed = 1.f;
		k[1].mSpeed = .5f;
		k[2].mSpeed = .8f;
		
		mGelSource.mKinds.push_back(k[0]);
		mGelSource.mKinds.push_back(k[1]);
		mGelSource.mKinds.push_back(k[2]);
	}
	
	// gel
	mGel = make_shared<Gel>();
	mGel->setLayout(
	 vec2(100,20),
	 vec2(0,1),
	 300.f,
	 400.f,
	 5
	 );
	
	mGel->insertSamples( mGelSource, 0, 10   );
	mGel->insertSamples( mGelSource, 1, 100  );
	mGel->insertSamples( mGelSource, 2, 1000 );
	
	// gel view
	mGelView = make_shared<GelView>( mGel );
}

void GelboxApp::mouseDown( MouseEvent event )
{
}

void GelboxApp::update()
{
	mGel->tick(.1f);
}

void GelboxApp::draw()
{
	gl::clear( Color( 1, 1, 1 ) );
	
	if (mGelView) mGelView->draw();
}

CINDER_APP( GelboxApp, RendererGl )
