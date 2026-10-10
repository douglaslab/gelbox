// Capture completed native frames; all UI transitions use real mouse events.
if(const char* output=std::getenv("GEL_CONTROLS_CAPTURE")){
 static int frame=0;
 ++frame;
 const fs::path root(output);
 auto point=[&](vec2 p,bool click){
  mouseMove(MouseEvent(getWindow(),0,p.x,p.y,0,0,0));
  if(click){mouseDown(MouseEvent(getWindow(),MouseEvent::LEFT_DOWN,p.x,p.y,MouseEvent::LEFT_DOWN,0,0));mouseUp(MouseEvent(getWindow(),MouseEvent::LEFT_DOWN,p.x,p.y,0,0,0));}
 };
 auto click=[&](ViewRef v){if(!v)throw std::runtime_error("Missing native control");point(v->childToRoot(v->getBounds().getCenter()),true);point(vec2(0),false);};
 auto gear=[&](){for(auto v:mGelView->getChildren())if(std::dynamic_pointer_cast<ButtonView>(v)){click(v);return;}throw std::runtime_error("Missing gel settings button");};
 auto capture=[&](std::string name){
  writeImage(root/(name+".png"),copyWindowSurface());
  Json state={{"frame",frame},{"window",{getWindowWidth(),getWindowHeight()}},{"scale",getWindowContentScale()},
   {"gel",Json::parse(mGelView->getGel()->toJson().serialize())},{"render",mGelView->isGelRenderEnabled()},
   {"menu",bool(mSettingsView)}};
  std::ofstream(root/(name+".json"))<<state.dump(2)<<std::endl;
 };
 if(frame==30){capture("startup");gear();}
 if(frame==60){capture("settings-effects");click(mSettingsBtn);}
 if(frame==90){capture("settings-menu-effects");if(!mSettingsView)throw std::runtime_error("Menu did not open");click(mSettingsView->getChildren().at(0));}
 if(frame==120){capture("settings-menu-direct");gear();}
 if(frame==135){click(mSettingsBtn);}
 if(frame==150){capture("menu-direct");if(!mSettingsView)throw std::runtime_error("Menu did not reopen");click(mSettingsView->getChildren().at(0));}
 if(frame==180){capture("menu-effects");quit();}
}
