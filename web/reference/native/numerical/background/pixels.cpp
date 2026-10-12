// Native RGBA8 conversion of the captured solid background color.
#define GL_SILENCE_DEPRECATION
#include <OpenGL/OpenGL.h>
#include <OpenGL/gl3.h>
#include <iostream>
#include <stdexcept>
int main(){
 CGLPixelFormatAttribute attrs[]={kCGLPFAAccelerated,kCGLPFAOpenGLProfile,(CGLPixelFormatAttribute)kCGLOGLPVersion_3_2_Core,(CGLPixelFormatAttribute)0};
 CGLPixelFormatObj pf=nullptr;GLint n=0;if(CGLChoosePixelFormat(attrs,&pf,&n)||!pf)return 2;
 CGLContextObj context=nullptr;if(CGLCreateContext(pf,nullptr,&context))return 3;CGLDestroyPixelFormat(pf);CGLSetCurrentContext(context);
 std::cerr<<glGetString(GL_VENDOR)<<" / "<<glGetString(GL_RENDERER)<<" / "<<glGetString(GL_VERSION)<<"\n";
 GLuint fbo,tex;glGenFramebuffers(1,&fbo);glBindFramebuffer(GL_FRAMEBUFFER,fbo);glGenTextures(1,&tex);glBindTexture(GL_TEXTURE_2D,tex);glTexImage2D(GL_TEXTURE_2D,0,GL_RGBA8,1,1,0,GL_RGBA,GL_UNSIGNED_BYTE,nullptr);glFramebufferTexture2D(GL_FRAMEBUFFER,GL_COLOR_ATTACHMENT0,GL_TEXTURE_2D,tex,0);if(glCheckFramebufferStatus(GL_FRAMEBUFFER)!=GL_FRAMEBUFFER_COMPLETE)return 4;
 float r,g,b;while(std::cin>>r>>g>>b){glClearColor(r,g,b,1);glClear(GL_COLOR_BUFFER_BIT);unsigned char pixel[4];glReadPixels(0,0,1,1,GL_RGBA,GL_UNSIGNED_BYTE,pixel);std::cout<<int(pixel[0])<<" "<<int(pixel[1])<<" "<<int(pixel[2])<<"\n";}
 glDeleteTextures(1,&tex);glDeleteFramebuffers(1,&fbo);CGLSetCurrentContext(nullptr);CGLDestroyContext(context);
}
