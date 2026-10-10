#include "cinder/GeomIo.h"
#include <iomanip>
#include <iostream>
#include <stdexcept>
#include <vector>
namespace legacy {
using namespace ci;
using geom::Source; using geom::WireSource; using geom::Target;
using geom::Attrib; using geom::AttribSet; using geom::Primitive;
#include "legacy-rounded.inc"
}
struct Capture : ci::geom::Target {
 std::vector<float> positions;
 uint8_t getAttribDims(ci::geom::Attrib attr)const override{return attr==ci::geom::Attrib::POSITION?2:0;}
 void copyAttrib(ci::geom::Attrib attr,uint8_t dims,size_t stride,const float* data,size_t count) override {
  if(attr!=ci::geom::Attrib::POSITION)return;
  if(dims!=2)throw std::runtime_error("Expected 2D vertices");
  for(size_t i=0;i<count;i++){auto p=(const float*)((const char*)data+i*(stride?stride:2*sizeof(float)));positions.push_back(p[0]);positions.push_back(p[1]);}
 }
 void copyIndices(ci::geom::Primitive,const uint32_t*,size_t,uint8_t)override{throw std::runtime_error("Unexpected indexed geometry");}
};
void emit(const char* id,const ci::geom::Source& source){
 Capture c;source.loadInto(&c,{ci::geom::Attrib::POSITION});
 std::cout<<'"'<<id<<"\":[";
 for(size_t i=0;i<c.positions.size();i++){if(i)std::cout<<',';std::cout<<c.positions[i];}
 std::cout<<']';
}
int main(){
 std::cout<<std::setprecision(9)<<'{';
 emit("shadow",legacy::RoundedRect(ci::Rectf(77,75,157,155)).cornerRadius(4).cornerSubdivisions(0));std::cout<<',';
 emit("fill",legacy::RoundedRect(ci::Rectf(77,71,157,151)).cornerRadius(4).cornerSubdivisions(0));std::cout<<',';
 emit("stroke",legacy::WireRoundedRect(ci::Rectf(77,71,157,151),4).cornerSubdivisions(0));
 std::cout<<"}\n";
}
