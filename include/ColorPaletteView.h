//
//  ColorPaletteView.h
//  Gelbox
//
//  Created by Chaim Gingold on 2/13/18.
//
//

#include "View.h"
#include "cinder/Rand.h"

class ColorPaletteView;
typedef std::shared_ptr<ColorPaletteView> ColorPaletteViewRef;

class ColorPaletteView : public View
{
public:

	class Palette : public std::vector<ci::Color>
	{
	public:
		Palette(){}
		Palette( const std::vector<ci::Color>& );
		ci::Color getRandomColor( ci::Rand* r=0 ) const;
	};
	
	void setPalette( Palette p ) { mColors=p; layout(mColorsRect); }
	void setCols( int c ) { mColorCols=c; layout(mColorsRect); }
	void layout( ci::Rectf );
		// rough in where colors should go
		// this is a little unclear in part b/c of how i refactored it.
		// so it would be smart to clarify layout logic

	int calcRows() const { return mColors.size()/mColorCols; }	
	
	void tick( float dt ) override;
	void draw() override;
	
	void mouseDown( ci::app::MouseEvent ) override;
	void mouseUp  ( ci::app::MouseEvent ) override;
	void mouseDrag( ci::app::MouseEvent ) override;

	std::vector<ci::Color>	mColors;
	int						mColorCols=6;
	int						mSelectedColor=-1;
	
	glm::vec2				mColorSize;
	ci::Rectf				mColorsRect;
	
	ci::Rectf				calcColorRect( int i ) const;
	int						pickColor( glm::vec2 ) const; // local coords

	
	void pushValueToSetter() const;
	void pullValueFromGetter();
	
	// getter-setters
	typedef std::function< void ( ci::Color ) > tSetter;
	typedef std::function< ci::Color() > tGetter;
	
	tSetter		mSetter;
	tGetter		mGetter;
		
};