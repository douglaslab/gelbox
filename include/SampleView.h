//
//  SampleView.h
//  Gelbox
//
//  Created by Chaim Gingold on 1/5/18.
//
//

#pragma once

#include "View.h"

class Sample;
typedef std::shared_ptr<Sample> SampleRef;

class SampleView;
typedef std::shared_ptr<SampleView> SampleViewRef;

class FragmentView;
typedef std::shared_ptr<FragmentView> FragmentViewRef;


class SampleView : public View, public std::enable_shared_from_this<SampleView>
{
public:

	SampleView();
	
	void setCalloutAnchor( glm::vec2 p ) { mAnchor=p; updateCallout(); }
	void setSample( SampleRef s ) { mSample=s; }
	
	void tick( float dt ) override;
	void draw() override;
	void drawFrame() override; 

	void setBounds( ci::Rectf b ) override;
	
	void mouseDown( ci::app::MouseEvent ) override;
	void keyDown( ci::app::KeyEvent ) override;
	
	bool pick( glm::vec2 ) const override;
	
	
	void deleteFragment( int i ); // fades out instances
	
private:

	bool isFragment( int i ) const { return i >=0 && i < mFragments.size() ; }
	bool pickNewBtn( glm::vec2 ) const;
	void updateCallout();
	void closeFragEditor();
	
	glm::vec2		mAnchor; // anchor for callout. in frame (parent) space
	ci::PolyLine2   mCallout;
	
	SampleRef		mSample; // source data
	int				mSelectedFragment=-1;
	int				mRolloverFragment=-1;
	
	glm::vec2		mNewBtnLoc;
	float			mNewBtnRadius;
	
	// fragment editor
	FragmentViewRef mFragEditor;
	
	// particle sim
	void tickSim( float dt ); // dt=1 for normal speed
	void drawSim();
	int  pickPart( ci::vec2 ) const;
	int  pickFragment( ci::vec2 ) const;
	
	class Frag
	{
	public:
		Frag( ci::Color c, float r ) : mColor(c), mRadius(r) {}
		
		float		mRadius;
		ci::Color	mColor;
	};
	
	class Part
	{
	public:
		int			mFragment=0;
		
		glm::vec2	mLoc;
		glm::vec2	mFace, mVel;
		float		mRadius;
		ci::Color	mColor;
		
		float		mAge=0.f;
		
		float		mFade=0.f;
		bool		mAlive=true; // fading in or out?
	};
	
	std::vector<Frag> mFragments;	
	std::vector<Part> mParts;
	
};