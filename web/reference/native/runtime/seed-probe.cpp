#include "cinder/Rand.h"
#include "cinder/Color.h"
#include <vector>
#include <iostream>
using namespace ci;
struct MolecularSim { int mRandSeed; Rand mRand; MolecularSim(); };
struct ColorPaletteView { struct Palette:std::vector<Color> {Color getRandomColor(Rand* r) const;};};
MolecularSim::MolecularSim()
{
	mRandSeed = randInt();
	mRand.seed( mRandSeed ); // random random seed :-)
}
ci::Color ColorPaletteView::Palette::getRandomColor( ci::Rand* r ) const
{
	int i;
	
	if (r) i = r->nextInt();
	else i = randInt();
	
	return (*this)[ i % size() ];
}
int main(){
 std::cout << "initial-global=" << randInt() << "\n";
 for(int inspectorDraws: {0,7}) {
 Rand::randSeed(310);
 MolecularSim ordinary;
 Rand view;int viewSeed=randInt();view.seed(viewSeed);
 ColorPaletteView::Palette colors;for(int i=0;i<12;i++)colors.push_back(Color(float(i),0,0));
 std::cout << "inspector-draws="<<inspectorDraws<<" engine-seed="<<ordinary.mRandSeed<<" view-seed="<<viewSeed;
 for(int i=0;i<inspectorDraws;i++)randFloat();
 MolecularSim loupe;int loupeViewSeed=randInt();
 std::cout<<" loupe-engine-seed="<<loupe.mRandSeed<<" loupe-view-seed="<<loupeViewSeed;
 Rand peek=view;int signedValue=peek.nextInt();
 std::cout<<" first-palette-int="<<signedValue<<" palette-index="<<colors.getRandomColor(&view).r;
 std::cout<<" next-global="<<randInt()<<"\n";
 }
}
