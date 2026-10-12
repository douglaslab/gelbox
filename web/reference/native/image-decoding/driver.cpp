#include "cinder/ImageIo.h"
#include "cinder/ImageSourceFileQuartz.h"
#include "cinder/Surface.h"
#include <fstream>
#include <iostream>
#include <typeinfo>
int main(int argc,char**argv){
 if(argc!=3)return 2;
 ci::ImageSourceFileQuartz::registerSelf(); // Same registration as PlatformCocoa.
 try{
  auto source=ci::loadImage(ci::fs::path(argv[1]));if(!source)throw std::runtime_error("No decoder");ci::Surface8u surface(source);
  std::ofstream out(argv[2],std::ios::binary);if(!out)throw std::runtime_error("Cannot write output");
  auto* decoder=source.get();
  for(int y=0;y<surface.getHeight();++y)for(int x=0;x<surface.getWidth();++x){
   auto c=surface.getPixel(ci::ivec2(x,y));unsigned char rgba[]={c.r,c.g,c.b,c.a};out.write((char*)rgba,4);
  }
  std::cout<<"{\"width\":"<<surface.getWidth()<<",\"height\":"<<surface.getHeight()<<",\"decoder\":\""<<typeid(*decoder).name()<<"\"}\n";
 }catch(const std::exception&e){std::cerr<<e.what()<<'\n';return 1;}
}
