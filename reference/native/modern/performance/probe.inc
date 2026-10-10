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
  const fs::path root(output);
  auto point=[&](vec2 p,bool click,int modifiers=0){
   mouseMove(MouseEvent(getWindow(),0,p.x,p.y,modifiers,0,0));
   if(click){mouseDown(MouseEvent(getWindow(),MouseEvent::LEFT_DOWN,p.x,p.y,MouseEvent::LEFT_DOWN|modifiers,0,0));mouseUp(MouseEvent(getWindow(),MouseEvent::LEFT_DOWN,p.x,p.y,modifiers,0,0));}
  };
  auto snapshot=[&](){
   Json counts=Json::array();
   auto count=[&](SampleViewRef v){if(!v||!v->getParent())throw std::runtime_error("Missing workload view");int alive=0;for(const auto& p:v->referenceMolecularSim().mParts)if(p.mAlive)++alive;if(!alive)throw std::runtime_error("Empty particle view");counts.push_back(alive);};
   count(sample);for(auto v:loupes)count(v);
   if(loupes.size()!=3||mGelView->getGel()->getBands().size()!=50||!mGelView->isGelRenderEnabled())throw std::runtime_error("Wrong workload");
   return Json{{"update",gPerfTicks},{"particles",counts}};
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
    snapshots.push_back(snapshot());
    Json report={{"viewport",{1365,768}},{"dpr",2},{"bands",50},{"loupes",3},{"render",true},{"rows",rows},{"snapshots",snapshots},{"renderer",reinterpret_cast<const char*>(glGetString(GL_RENDERER))},{"version",reinterpret_cast<const char*>(glGetString(GL_VERSION))},{"scope","Modern compatibility native build. Update/draw CPU elapsed and callback intervals, not GPU or input-to-photon latency. Particle counts observed; RNG and timestep unchanged."}};
    std::ofstream(root/"performance.json")<<report.dump(2)<<std::endl;recording=false;quit();
   }
  }
 }
}
