// Capture completed native framebuffer; model and drawing methods are unchanged.
if(const char* output=std::getenv("GEL_OVERLAP_CAPTURE")){
 static int frame=0;
 static SampleViewRef sample,loupe;
 static ViewRef image;
 ++frame;
 const fs::path root(output),asset(std::getenv("GEL_OVERLAP_IMAGE"));
 auto point=[&](vec2 p,bool click,int modifiers=0){
  mouseMove(MouseEvent(getWindow(),0,p.x,p.y,modifiers,0,0));
  if(click){mouseDown(MouseEvent(getWindow(),MouseEvent::LEFT_DOWN,p.x,p.y,MouseEvent::LEFT_DOWN|modifiers,0,0));mouseUp(MouseEvent(getWindow(),MouseEvent::LEFT_DOWN,p.x,p.y,modifiers,0,0));}
 };
 auto drag=[&](vec2 from,vec2 to){
  point(from,false);mouseDown(MouseEvent(getWindow(),MouseEvent::LEFT_DOWN,from.x,from.y,MouseEvent::LEFT_DOWN,0,0));
  mouseDrag(MouseEvent(getWindow(),MouseEvent::LEFT_DOWN,to.x,to.y,MouseEvent::LEFT_DOWN,0,0));
  mouseUp(MouseEvent(getWindow(),MouseEvent::LEFT_DOWN,to.x,to.y,0,0,0));point(vec2(0),false);
 };
 auto drop=[&](vec2 p){fileDrop(FileDropEvent(getWindow(),p.x,p.y,{asset}));image=mViews.getKeyboardFocusView();if(!std::dynamic_pointer_cast<ImageView>(image))throw std::runtime_error("Image drop failed");point(vec2(0),false);};
 auto resizeImage=[&](){auto r=image->getFrame();drag(r.getLowerRight()-vec2(1),r.getLowerRight()-vec2(1)+vec2(256,128));};
 auto capture=[&](std::string name){
  writeImage(root/(name+".png"),copyWindowSurface());
  Json state={{"frame",frame},{"window",{getWindowWidth(),getWindowHeight()}},{"scale",getWindowContentScale()},
   {"gel",Json::parse(mGelView->getGel()->toJson().serialize())},{"views",Json::object()}};
  auto saveView=[&](std::string key,SampleViewRef view){
   if(!view)return;
   auto& sim=view->referenceMolecularSim();auto origin=view->childToRoot(vec2(0));auto bounds=view->getBounds();auto anchor=view->getCalloutAnchor();
   Json v={{"frame",{origin.x,origin.y,bounds.getWidth(),bounds.getHeight()}},{"anchor",{anchor.x,anchor.y}},
    {"selectedFragment",view->getSelectedFragment()},{"focus",view->getHasKeyboardFocus()},{"active",bool(view->getParent())},{"parts",Json::array()}};
   for(const auto& p:sim.mParts){
    Json part={{"fragment",p.mFragment},{"loc",{{"x",p.mLoc.x},{"y",p.mLoc.y}}},{"vel",{{"x",p.mVel.x},{"y",p.mVel.y}}},
      {"radius",{{"x",p.mRadius.x},{"y",p.mRadius.y}}},{"angle",p.mAngle},{"angleVel",p.mAngleVel},
      {"color",{p.mColor.r,p.mColor.g,p.mColor.b}},{"age",p.mAge},{"fade",p.mFade},{"alive",p.mAlive},
      {"degradeKey",p.mDegradeKey},{"wholeness",p.mWholeness},{"multi",Json::array()}};
    for(const auto& m:p.mMulti)part["multi"].push_back({{"loc",{{"x",m.mLoc.x},{"y",m.mLoc.y}}},{"angle",m.mAngle}});
    v["parts"].push_back(part);
   }
   state["views"][key]=v;
  };
  saveView("sample",sample);saveView("loupe-1",loupe);
  std::ofstream(root/(name+".json"))<<state.dump(2)<<std::endl;
 };
 if(frame==30){point(vec2(236,90),true);sample=std::dynamic_pointer_cast<SampleView>(mViews.getKeyboardFocusView());if(!sample)throw std::runtime_error("Sample did not open");randSeed(310);sample->setRand(Rand(123));sample->simClearParticles();sample->simPreroll();point(vec2(0),false);}
 if(frame==60){drop(vec2(980,225));resizeImage();}
 if(frame==90){capture("image-before-species");mGelView->selectFragment(0,0);point(vec2(0),false);}
 if(frame==120){capture("species-above-image");drop(vec2(980,225));resizeImage();}
 if(frame==150){capture("image-above-species");point(vec2(236,300),true,MouseEvent::META_DOWN);loupe=std::dynamic_pointer_cast<SampleView>(mViews.getKeyboardFocusView());if(!loupe||loupe==sample)throw std::runtime_error("Loupe did not open");point(vec2(0),false);}
 if(frame==180){capture("loupe-created");drop(loupe->childToRoot(vec2(115,55)));}
 if(frame==210){capture("image-above-loupe");point(loupe->childToRoot(vec2(2,145)),true);point(vec2(0),false);}
 if(frame==240){capture("loupe-raised");quit();}
}
