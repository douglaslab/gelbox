// Runs after the normal draw. No simulation time, seed or draw behavior is changed.
if(const char* output=std::getenv("GEL_PERF_OUTPUT")){
 static int previousTick=-1;
 if(gPerfTicks!=previousTick){
  previousTick=gPerfTicks;
  static SampleViewRef sample;
  static std::vector<SampleViewRef> loupes;
  static PerfClock::time_point started,previous;
  static Json rows=Json::array(),snapshots=Json::array();
  static bool recording=false;
  static int gestureStep=-1,settle=0;
  static Json interaction=Json::array();
  
  const fs::path root(output);
  auto point=[&](vec2 p,bool click,int modifiers=0){
   mouseMove(MouseEvent(getWindow(),0,p.x,p.y,modifiers,0,0));
   if(click){mouseDown(MouseEvent(getWindow(),MouseEvent::LEFT_DOWN,p.x,p.y,MouseEvent::LEFT_DOWN|modifiers,0,0));mouseUp(MouseEvent(getWindow(),MouseEvent::LEFT_DOWN,p.x,p.y,modifiers,0,0));}
  };
  auto snapshot=[&](){
   Json counts=Json::array();
   auto count=[&](SampleViewRef v){if(!v||!v->getParent()){writeImage(root/"failed-workload.png",copyWindowSurface());std::ofstream(root/"failed-interaction.json")<<interaction.dump(2);std::cerr<<"Missing view index "<<counts.size()<<" tick "<<gPerfTicks<<std::endl;throw std::runtime_error("Missing workload view");}int alive=0;for(const auto& p:v->referenceMolecularSim().mParts)if(p.mAlive)++alive;if(!alive)throw std::runtime_error("Empty particle view");counts.push_back(alive);};
   count(sample);for(auto v:loupes)count(v);
   if(loupes.size()!=3||mGelView->getGel()->getBands().size()!=50||!mGelView->isGelRenderEnabled())throw std::runtime_error("Wrong workload");
   auto ctx=gl::context();if(ctx->getLiveTextures().empty()||ctx->getLiveBuffers().empty())throw std::runtime_error("Resource tracking inactive");
   return Json{{"update",gPerfTicks},{"particles",counts},{"resources",{{"textures",ctx->getLiveTextures().size()},{"buffers",ctx->getLiveBuffers().size()},{"programs",ctx->getLiveGlslProgs().size()},{"vaos",ctx->getLiveVaos().size()},{"fbos",ctx->getLiveFbos().size()}}}};
  };
  if(gPerfTicks==30){
   if(getWindowWidth()!=1365||getWindowHeight()!=768||getWindowContentScale()!=2)throw std::runtime_error("Wrong viewport or scale");
   const char* fixture=std::getenv("GEL_PERF_FIXTURE");if(!fixture)throw std::runtime_error("Missing fixture");load(fs::path(fixture));
   if(mGelView->getGel()->getBands().size()!=50)throw std::runtime_error("Expected fifty bands");
   auto bandPoint=[&](int fragment){for(const auto& b:mGelView->getGel()->getBands())if(b.mLane==0 && b.mFragment==fragment)return mGelView->childToRoot(b.mRect.getCenter());throw std::runtime_error("Missing first-lane band");};
   point(bandPoint(0),true);sample=std::dynamic_pointer_cast<SampleView>(mViews.getKeyboardFocusView());
   if(!sample)throw std::runtime_error("Sample did not open");
   for(int index:{0,5,9}){auto target=bandPoint(index);point(target,true,MouseEvent::META_DOWN);auto v=std::dynamic_pointer_cast<SampleView>(mViews.getKeyboardFocusView());if(!v||v==sample||std::find(loupes.begin(),loupes.end(),v)!=loupes.end())throw std::runtime_error("Distinct loupe did not open");auto expected=mGelView->rootToChild(vec2(int(target.x),int(target.y)));if(glm::distance(v->getCalloutAnchor(),expected)>0.01f)throw std::runtime_error("Wrong loupe anchor");loupes.push_back(v);point(vec2(1300,50),false);}
   std::ofstream(root/"loaded.gel.json")<<mGelView->getGel()->toJson().serialize();
  }
  if(gPerfTicks==210){snapshots.push_back(snapshot());writeImage(root/"workload.png",copyWindowSurface());started=previous=PerfClock::now();recording=true;}
  else if(recording){
   auto now=PerfClock::now();double elapsed=std::chrono::duration<double>(now-started).count();
   rows.push_back({{"elapsedSeconds",elapsed},{"intervalMs",std::chrono::duration<double,std::milli>(now-previous).count()},{"updateMs",gPerfUpdateMs},{"drawMs",std::chrono::duration<double,std::milli>(now-perfDrawStart).count()}});previous=now;
   if(rows.size()%300==0)snapshots.push_back(snapshot());
   if(elapsed>=20){
    recording=false;gestureStep=0;previous=PerfClock::now();
    vec2 p(gPerfTimeline[2],gPerfTimeline[3]);point(p,false);mouseDown(MouseEvent(getWindow(),MouseEvent::LEFT_DOWN,p.x,p.y,MouseEvent::LEFT_DOWN,0,0));
   }
  }else if(gestureStep>=0){
   auto now=PerfClock::now();
   interaction.push_back({{"step",gestureStep},{"time",mGelView->getGel()->getTime()},{"intervalMs",std::chrono::duration<double,std::milli>(now-previous).count()},{"updateMs",gPerfUpdateMs},{"drawMs",std::chrono::duration<double,std::milli>(now-perfDrawStart).count()}});previous=now;
   if(gestureStep==30 && std::abs(mGelView->getGel()->getTime()-0.1f)>0.005f)throw std::runtime_error("Timeline midpoint not reached");
   if(gestureStep<60){
    float f=gestureStep<30 ? 1.f-.9f*float(gestureStep+1)/30.f : .1f+.9f*float(gestureStep-29)/30.f;
    vec2 p(gPerfTimeline[0]+f*(gPerfTimeline[2]-gPerfTimeline[0]),gPerfTimeline[1]);
    auto handlerStart=PerfClock::now();mouseDrag(MouseEvent(getWindow(),MouseEvent::LEFT_DOWN,p.x,p.y,MouseEvent::LEFT_DOWN,0,0));interaction.back()["handlerMs"]=std::chrono::duration<double,std::milli>(PerfClock::now()-handlerStart).count();
   }else if(gestureStep==60){vec2 p(gPerfTimeline[2],gPerfTimeline[3]);mouseUp(MouseEvent(getWindow(),MouseEvent::LEFT_DOWN,p.x,p.y,0,0,0));point(vec2(1300,50),false);}
   if(++gestureStep==63){if(std::abs(mGelView->getGel()->getTime()-1.f)>0.0001f)throw std::runtime_error("Timeline end not restored");gestureStep=-1;settle=gPerfTicks+180;}
  }else if(settle && gPerfTicks>=settle){
    snapshots.push_back(snapshot());
    for(const auto& s:snapshots)if(s["resources"]!=snapshots[0]["resources"])throw std::runtime_error("Live resources did not remain stable");
    Json report={{"viewport",{1365,768}},{"dpr",2},{"bands",50},{"loupes",3},{"render",true},{"rows",rows},{"interaction",interaction},{"snapshots",snapshots},{"renderer",reinterpret_cast<const char*>(glGetString(GL_RENDERER))},{"version",reinterpret_cast<const char*>(glGetString(GL_VERSION))},{"scope","Modern compatibility native build. Update/draw CPU elapsed and callback intervals, not GPU or input-to-photon latency. Particle counts observed; RNG and timestep unchanged."}};
    std::ofstream(root/"performance.json")<<report.dump(2)<<std::endl;recording=false;quit();
  }
 }
}
