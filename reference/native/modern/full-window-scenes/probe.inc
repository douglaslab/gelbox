// Isolated capture instrumentation, called after the unmodified application draw.
if (const char* output = std::getenv("GEL_COMPOSED_CAPTURE")) {
 static int frame=0;
 static SampleViewRef sample;
 ++frame;
 const fs::path root(output);
 auto pointer=[&](int x,int y,bool click){
  mouseMove(MouseEvent(getWindow(),0,x,y,0,0,0));
  if(click){mouseDown(MouseEvent(getWindow(),MouseEvent::LEFT_DOWN,x,y,MouseEvent::LEFT_DOWN,0,0));mouseUp(MouseEvent(getWindow(),MouseEvent::LEFT_DOWN,x,y,0,0,0));}
 };
 auto capture=[&](const std::string& name){
  writeImage(root/(name+".png"),copyWindowSurface());
  if(name=="sample"||name=="species"){
   GLint read=0,draw=0,samples=0;glGetIntegerv(GL_READ_FRAMEBUFFER_BINDING,&read);glGetIntegerv(GL_DRAW_FRAMEBUFFER_BINDING,&draw);glGetIntegerv(GL_SAMPLES,&samples);
   const int w=getWindowWidth()*getWindowContentScale(),h=getWindowHeight()*getWindowContentScale();
   GLuint ms=0,fb=0;glGenTextures(1,&ms);glGenFramebuffers(1,&fb);
   {gl::ScopedTextureBind bind(GL_TEXTURE_2D_MULTISAMPLE,ms);
    glTexImage2DMultisample(GL_TEXTURE_2D_MULTISAMPLE,samples,GL_RGBA8,w,h,GL_TRUE);
   }
   glBindFramebuffer(GL_DRAW_FRAMEBUFFER,fb);glFramebufferTexture2D(GL_DRAW_FRAMEBUFFER,GL_COLOR_ATTACHMENT0,GL_TEXTURE_2D_MULTISAMPLE,ms,0);
   const int complete=glCheckFramebufferStatus(GL_DRAW_FRAMEBUFFER);
   glBlitFramebuffer(0,0,w,h,0,0,w,h,GL_COLOR_BUFFER_BIT,GL_NEAREST);
   const int copyError=glGetError();
   glBindFramebuffer(GL_READ_FRAMEBUFFER,read);glBindFramebuffer(GL_DRAW_FRAMEBUFFER,draw);
   vector<ivec2> points={{439,347},{439,348},{440,349},{450,355},{495,355},{438,347},{440,340},{450,340}};
   auto target=gl::Fbo::create(points.size(),samples,gl::Fbo::Format().disableDepth().colorTexture(gl::Texture2d::Format().internalFormat(GL_RGBA32F)));
   auto shader=gl::GlslProg::create(gl::GlslProg::Format().vertex("#version 150\n void main(){vec2 p[4]=vec2[4](vec2(-1,-1),vec2(1,-1),vec2(-1,1),vec2(1,1));gl_Position=vec4(p[gl_VertexID],0,1);}").fragment("#version 150\n uniform sampler2DMS source;uniform ivec2 points[8];out vec4 color;void main(){color=texelFetch(source,points[int(gl_FragCoord.x)],int(gl_FragCoord.y));}"));
   vector<float> colors(points.size()*samples*4);
   {gl::ScopedFramebuffer fbo(target);gl::ScopedViewport viewport(ivec2(points.size(),samples));gl::ScopedGlslProg program(shader);gl::ScopedBlend blend(false);gl::ScopedTextureBind bind(GL_TEXTURE_2D_MULTISAMPLE,ms,0);
    shader->uniform("source",0);for(int i=0;i<points.size();i++)shader->uniform("points["+to_string(i)+"]",ivec2(points[i].x,h-1-points[i].y));
    gl::drawSolidRect(Rectf(0,0,points.size(),samples));glReadPixels(0,0,points.size(),samples,GL_RGBA,GL_FLOAT,colors.data());
   }
   Json data={{"samples",samples},{"readFramebuffer",read},{"drawFramebuffer",draw},{"framebufferStatus",complete},{"copyError",copyError},{"values",Json::array()}};
   for(int i=0;i<points.size();i++){Json v={{"point",{points[i].x,points[i].y}},{"samples",Json::array()}};for(int s=0;s<samples;s++){int at=(s*points.size()+i)*4;v["samples"].push_back({colors[at],colors[at+1],colors[at+2],colors[at+3]});}data["values"].push_back(v);}
   std::ofstream(root/(name+"-samples.json"))<<data.dump(2)<<std::endl;glDeleteFramebuffers(1,&fb);glDeleteTextures(1,&ms);
  }
  Json state=Json::object();
  state["frame"]=frame;state["scale"]=getWindowContentScale();
  state["window"]={getWindowWidth(),getWindowHeight()};
  state["gel"]=Json::parse(mGelView->getGel()->toJson().serialize());
  state["parts"]=Json::array();
  if(sample){
   auto& sim=sample->referenceMolecularSim();
   auto matrix=[](const mat4& m){Json a=Json::array();for(int c=0;c<4;c++)for(int r=0;r<4;r++)a.push_back(m[c][r]);return a;};
   Json matrices={{"projection",matrix(gl::getProjectionMatrix())},{"rootView",matrix(gl::getViewMatrix())},{"model",matrix(gl::getModelMatrix())},{"sample",matrix(sample->getChildToRootMatrix())},
    {"mvp",matrix(gl::getProjectionMatrix()*gl::getViewMatrix()*sample->getChildToRootMatrix()*gl::getModelMatrix())}};
   std::ofstream(root/(name+"-matrices.json"))<<matrices.dump(2)<<std::endl;
   auto mesh=sim.makeMoleculesMesh(sample->getSelectionStateData(),sample->getRolloverStateData());
   Json vertices=Json::array();
   for(auto i:mesh->getIndices()) {auto v=mesh->getPositions<2>()[i];auto c=mesh->getColors<4>()[i];vertices.push_back({v.x,v.y,c.r,c.g,c.b,c.a});}
   std::ofstream(root/(name+"-mesh.json"))<<vertices.dump()<<std::endl;
   auto origin=sample->childToRoot(vec2(0));auto bounds=sample->getBounds();
   state["sampleFrame"]={origin.x,origin.y,bounds.getWidth(),bounds.getHeight()};
   state["selectedFragment"]=sample->getSelectedFragment();state["randSeed"]=sim.mRandSeed;
   for(const auto& p:sim.mParts){
    Json part={{"fragment",p.mFragment},{"loc",{{"x",p.mLoc.x},{"y",p.mLoc.y}}},{"vel",{{"x",p.mVel.x},{"y",p.mVel.y}}},
      {"radius",{{"x",p.mRadius.x},{"y",p.mRadius.y}}},{"angle",p.mAngle},{"angleVel",p.mAngleVel},
      {"color",{p.mColor.r,p.mColor.g,p.mColor.b}},{"age",p.mAge},{"fade",p.mFade},{"alive",p.mAlive},
      {"degradeKey",p.mDegradeKey},{"wholeness",p.mWholeness},{"multi",Json::array()}};
    for(const auto& m:p.mMulti)part["multi"].push_back({{"loc",{{"x",m.mLoc.x},{"y",m.mLoc.y}}},{"angle",m.mAngle}});
    state["parts"].push_back(part);
   }
  }
  std::ofstream(root/(name+".json"))<<state.dump(2)<<std::endl;
 };
 if(frame==30){
  capture("startup");pointer(236,90,true);
  sample=std::dynamic_pointer_cast<SampleView>(mViews.getKeyboardFocusView());
  if(!sample)throw std::runtime_error("Native tube event did not open SampleView");
  randSeed(310);sample->setRand(Rand(123));sample->simClearParticles();sample->simPreroll();
  pointer(0,0,false);
 }
 if(frame==60){capture("sample");mGelView->selectFragment(0,0);pointer(0,0,false);}
 if(frame==90){capture("species");quit();}
}
