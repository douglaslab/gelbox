#pragma once
#include "Gel.h"
#include "cinder/gl/gl.h"
#include "cinder/ImageIo.h"
#include "cinder/app/App.h"
#include <fstream>
inline void captureWellScenes() {
 std::ofstream report("/tmp/gel-native-lossless-probe/well-scenes/cases.json");
 report << "["; bool first=true;
 for(int lanes : {2,7,12,20}) for(int scale : {1,2}) for(float offset : {0.f,.25f}) {
  Gel gel; gel.setLayout(390,520,lanes,20);
  const std::string id=std::to_string(lanes)+"-"+std::to_string(scale)+"-"+(offset==0?"0":"quarter");
  const auto pixels=ci::app::toPixels(ci::app::getWindowSize());
  {
   ci::gl::ScopedViewport viewport(ci::ivec2(0),pixels);
   ci::gl::ScopedMatrices matrices;
   ci::gl::setMatricesWindow(pixels);
   ci::gl::scale(ci::vec2(scale,scale));
   ci::gl::ScopedGlslProg shader(ci::gl::getStockShader(ci::gl::ShaderDef().color()));
   ci::gl::ScopedBlendAlpha blend;
   ci::gl::clear(ci::ColorA(0,0,0,1));
   ci::gl::color(ci::ColorA(.8f,.8f,.8f,.8f));
   for(int i=0;i<lanes;i++) { auto r=gel.getWellBounds(i);r.offset(ci::vec2(offset,offset));ci::gl::drawStrokedRect(r); }
  }
  ci::writeImage(ci::fs::path("/tmp/gel-native-lossless-probe/well-scenes/"+id+".png"),ci::app::copyWindowSurface());
  if(!first)report<<",";first=false;
  report<<"{\"id\":\""<<id<<"\",\"lanes\":"<<lanes<<",\"scale\":"<<scale<<",\"offset\":"<<offset<<",\"rects\":[";
  for(int i=0;i<lanes;i++){if(i)report<<",";auto r=gel.getWellBounds(i);r.offset(ci::vec2(offset,offset));report<<"["<<std::setprecision(17)<<r.x1<<","<<r.y1<<","<<r.x2<<","<<r.y2<<"]";}
  report<<"]}";
 }
 report<<"]\n";
}
