import {LAYOUT} from '../layout/layout';
import {solveBasesForY} from '../sim/solver';
import {makeSampleFromGel} from '../sim/sampleFromGel';
import type {Sample} from '../sim/sample';
import {MolecularRuntime,type MolecularView} from './molecularRuntime';
import {deriveGelScene} from './gelScene';
import {gelReducer,initialGelState,getVisibleSampleLane,getFocusedFragmentIndex,selectionViewTarget,
  type GelState,type Action,type InspectorView} from './gelState';
import {sameSample,fragmentIndexIn} from './sampleFragRef';
import {hoverLoupeReducer,initialHoverLoupe,type HoverLoupeEvent,type HoverLoupeState} from './hoverLoupe';
import {insertView,removeView,raiseView} from './viewOrder';

type Point={x:number;y:number};
type Content=ReturnType<typeof makeSampleFromGel>;
interface OwnedView {
  key:string;
  layer:string;
  kind:'ordinary'|'persistent'|'hover';
  view:MolecularView;
  lane?:number;
  anchor?:Point;
  content?:Content;
  closing:boolean;
  syncedSample:Sample|null;
  pointer:Point|null;
  hovered:boolean;
  down:boolean;
}
export interface GelSnapshot {gel:GelState;hover:HoverLoupeState;order:string[]}

function modelChanged(a:GelState,b:GelState):boolean {
  return a.numLanes!==b.numLanes||a.wellRects!==b.wellRects||a.samples.length!==b.samples.length||
    a.samples.some((s,i)=>s!==b.samples[i])||a.ctx.time!==b.ctx.time||a.ctx.voltage!==b.ctx.voltage||
    a.ctx.wellDamage!==b.ctx.wellDamage||a.ctx.ySpaceScale!==b.ctx.ySpaceScale||a.ctx.gelBuffer!==b.ctx.gelBuffer;
}

/** Synchronous native commands; React observes published snapshots only. */
export class GelStore {
  readonly molecular=new MolecularRuntime();
  private gel:GelState;
  private hover=initialHoverLoupe();
  private order=['gel','app-button','help-button'];
  private snapshot:GelSnapshot;
  private listeners=new Set<()=>void>();
  private frameListeners=new Set<()=>void>();
  private active=new Map<string,OwnedView>();
  private owned=new Map<MolecularView,OwnedView>();
  private persistent:OwnedView[]=[];
  private instance=0;
  private depth=0;
  private inspector:InspectorView='none';
  private pointerDown=false;
  private downWindow:{point:Point|null}|null=null;
  private pendingRelease:{point:Point|null}|null=null;

  constructor(initial=initialGelState()) {
    this.gel=initial;
    this.hover={...this.hover,enabled:initial.hoverLoupeEnabled};
    this.snapshot={gel:this.gel,hover:this.hover,order:this.order};
    this.syncOrdinary();
    this.publish();
  }
  getSnapshot=():GelSnapshot=>this.snapshot;
  subscribe=(listener:()=>void):(()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
  subscribeFrame=(listener:()=>void):(()=>void)=>{this.frameListeners.add(listener);return()=>{this.frameListeners.delete(listener);};};
  getMolecularView=(key:string):MolecularView|undefined=>this.active.get(key)?.view;
  getLoupeContent=(key:string):Content|undefined=>this.active.get(key)?.content;
  private transact<T>(work:()=>T):T {
    this.depth++;
    try{return work();}finally{if(--this.depth===0)this.publish();}
  }
  private publish():void {
    if(this.snapshot.gel===this.gel&&this.snapshot.hover===this.hover&&this.snapshot.order===this.order)return;
    this.snapshot={gel:this.gel,hover:this.hover,order:this.order};
    for(const listener of [...this.listeners])listener();
  }
  private addLayer(key:string,above?:string):void {this.order=insertView(this.order,key,above);}
  private removeLayer(key:string):void {this.order=removeView(this.order,key);}
  private managedLayer(key:string):boolean {
    return key==='sample'||key.startsWith('loupe-')||key.startsWith('hover-')||key.startsWith('inspector-');
  }
  registerLayer=(key:string,above?:string):void=>{if(!this.managedLayer(key))this.transact(()=>this.addLayer(key,above));};
  unregisterLayer=(key:string):void=>{if(!this.managedLayer(key))this.transact(()=>this.removeLayer(key));};
  raiseLayer=(key:string):void=>this.transact(()=>{
    this.order=raiseView(this.order,key);
    const meta=[...this.active.values()].find(v=>v.layer===key);
    if(meta)this.molecular.raiseView(meta.view.id);
  });
  private createView(key:string,kind:OwnedView['kind'],sample:Sample|null):OwnedView {
    const size=kind==='ordinary'?LAYOUT.sampleSize:LAYOUT.loupeSize;
    const view=this.molecular.createView(`view-${++this.instance}`,{
      bounds:{x1:0,y1:0,x2:size.x,y2:size.y},sample,timeScale:kind==='ordinary'?1:0,
    });
    const meta:OwnedView={key,layer:key==='hover'?`hover-${this.gel.documentRevision}`:key,kind,view,
      closing:false,syncedSample:sample,pointer:null,hovered:false,down:false};
    this.active.set(key,meta);this.owned.set(view,meta);
    this.addLayer(meta.layer,kind==='ordinary'?'gel':undefined);
    if(kind==='ordinary')this.molecular.moveViewAbove(view.id,null);
    view.beforeTick=()=>{
      if(meta.kind==='ordinary'&&meta.syncedSample!==view.sample) {
        view.setSample(view.sample);meta.syncedSample=view.sample;
      }
      view.bulletTime=meta.hovered||meta.down;
    };
    view.afterTick=()=>this.afterViewTick(meta);
    return meta;
  }
  private dispose(meta:OwnedView):void {
    if(this.active.get(meta.key)===meta){this.active.delete(meta.key);this.removeLayer(meta.layer);}
    this.molecular.removeView(meta.view.id);
    this.owned.delete(meta.view);
    this.persistent=this.persistent.filter(v=>v!==meta);
  }
  private close(meta:OwnedView|undefined):void {
    if(!meta||meta.closing)return;
    this.active.delete(meta.key);this.removeLayer(meta.layer);
    if(meta.kind==='ordinary') {
      this.setInspector('none');this.dispose(meta);
    } else meta.closing=true;
  }
  private syncOrdinary():void {
    const lane=getVisibleSampleLane(this.gel),sample=lane===null?null:this.gel.samples[lane];
    let meta=this.active.get('sample');
    if(meta&&(lane!==meta.lane||!sameSample(meta.view.sample,sample))) {this.close(meta);meta=undefined;}
    if(lane===null||!sample)return;
    if(!meta){meta=this.createView('sample','ordinary',sample);meta.lane=lane;}
    else meta.view.sample=sample; // native sample pointer changes in-place; engine sync is next tick
  }
  private reviseOpenSample():void {
    const meta=this.active.get('sample');
    if(!meta)return;
    const sample=this.gel.samples.find(s=>sameSample(s,meta.view.sample));
    if(sample)meta.view.sample=sample;
  }
  private setInspector(kind:InspectorView):void {
    const view=this.active.get('sample')?.view;
    view?.setInspectorOpen(kind==='fragment');
    if(this.inspector===kind)return;
    this.removeLayer(`inspector-${this.inspector}`);
    this.inspector=kind;
    if(kind!=='none')this.addLayer(`inspector-${kind}`,kind==='gel-settings'?'gel':kind==='sample-settings'?'sample':undefined);
  }
  private selectInspector(index:number|null):void {
    const meta=this.active.get('sample');
    if(!meta){this.setInspector(this.gel.inspectorMode==='gel-settings'?'gel-settings':'none');return;}
    const fragment=index===null||index>=meta.view.sim.fragments.length?undefined:meta.view.sample?.fragments[index];
    this.setInspector(fragment?(fragment.dye>=0?'sample-settings':'fragment'):
      this.gel.inspectorMode==='sample-settings'?'sample-settings':'none');
  }
  private refresh(meta:OwnedView,state:GelState,scene=deriveGelScene(state)):void {
    if(!meta.anchor)return;
    const content=makeSampleFromGel(meta.anchor,scene.bands,scene.bandToLaneFragment,state.samples,state.wellRects,state.ctx);
    meta.content=content;
    meta.view.refreshDetail(meta.anchor,state.ctx.time,content.sample,content.degradeFilter);
    meta.syncedSample=content.sample;
  }
  private applyHover(next:HoverLoupeState,state=this.gel):void {
    const previous=this.hover;this.hover=next;
    let meta=this.active.get('hover');
    if(!next.preview){this.close(meta);return;}
    if(!meta||next.preview!==previous.preview) {
      if(!meta)meta=this.createView('hover','hover',null);
      meta.anchor=next.preview.anchor;
      this.refresh(meta,state);
      this.order=raiseView(this.order,meta.layer);this.molecular.raiseView(meta.view.id);
    }
  }
  private refreshAll(state=this.gel):void {
    const scene=deriveGelScene(state);
    for(const meta of [...this.persistent])if(meta.view.alive)this.refresh(meta,state,scene);
    this.applyHover(hoverLoupeReducer(this.hover,this.downWindow?
      {type:'refreshDuringDown',point:this.downWindow.point}:{type:'refresh'}),state);
  }
  hoverEvent=(event:HoverLoupeEvent):void=>this.transact(()=>{
    const next=hoverLoupeReducer(this.hover,event);
    if(next.enabled!==this.gel.hoverLoupeEnabled)this.gel=gelReducer(this.gel,{type:'SET_HOVER_LOUPE_ENABLED',value:next.enabled});
    this.applyHover(next);
  });
  beginPointerDown=(point:Point|null,persistent:boolean):void=>this.transact(()=>{
    this.pointerDown=true;
    for(const meta of this.owned.values())meta.hovered=false;
    this.downWindow=persistent?null:{point};
    this.applyHover(hoverLoupeReducer(this.hover,{type:'down',persistent}));
  });
  endPointerDown=():void=>{this.downWindow=null;};
  isPointerDown=():boolean=>this.pointerDown;
  releasePointer=(point:Point|null):void=>this.transact(()=>{
    this.pointerDown=false;
    this.downWindow=null;
    for(const meta of this.owned.values()){meta.down=false;meta.hovered=false;}
    if(this.gel.drag)this.pendingRelease={point};
    else this.applyHover(hoverLoupeReducer(this.hover,{type:'up',point}));
  });
  setViewPointer=(key:string,point:Point|null,hovered:boolean,down?:boolean):void=>{
    const meta=this.active.get(key);if(!meta)return;
    meta.pointer=point;meta.hovered=hovered&&!this.pointerDown;if(down!==undefined)meta.down=down;
  };
  private afterViewTick(meta:OwnedView):void {
    if(meta.closing){this.dispose(meta);return;}
    if(meta.hovered&&meta.pointer) {
      const index=meta.view.sim.pickFragment(meta.pointer.x,meta.pointer.y);
      const ref=index<0?null:meta.kind==='ordinary'?
        {sample:meta.view.sample!,fragmentIndex:index}:meta.content?.sourceRefs[index]??null;
      this.gel=gelReducer(this.gel,{type:'SET_ROLLOVER',ref});
    }
    if(meta.kind==='ordinary')this.selectInspector(getFocusedFragmentIndex(this.gel));
  }
  tick=(freezeAfter?:number):void=>{
    this.transact(()=>{
      this.molecular.freezeAfter=freezeAfter;
      this.molecular.tick(()=>{
        // ViewCollection clears rollover ownership during a held gesture;
        // GelView clears the shared fragment rollover before SampleView ticks.
        if(this.pointerDown)this.gel=gelReducer(this.gel,{type:'SET_ROLLOVER',ref:null});
        if(selectionViewTarget(this.gel)!==undefined)this.dispatch({type:'SYNC_SELECTION_VIEW'});
      });
    });
    for(const listener of [...this.frameListeners])listener();
  };

  createSpecies=(lane:number,targetY?:number):number|undefined=>this.transact(()=>{
    if(lane<0||lane>=this.gel.numLanes)return undefined;
    this.dispatch({type:'SET_SELECTED_LANE',laneIndex:lane});
    const meta=this.active.get('sample');if(!meta)return undefined;
    const before=this.gel,fragment=meta.view.createFragment(),index=before.samples[lane]!.fragments.length;
    const appended=gelReducer(before,{type:'ADD_FRAGMENT',laneIndex:lane,fragment});
    // SampleView::newFragment does not select until its caller finishes.
    this.gel={...appended,selection:before.selection,selectedFragmentIndex:before.selectedFragmentIndex,inspectorMode:before.inspectorMode};
    this.reviseOpenSample();this.refreshAll();
    meta.view.setSample(this.gel.samples[lane]);meta.syncedSample=meta.view.sample;
    if(targetY!==undefined) {
      const state=this.gel;
      const bases=solveBasesForY({targetY,frag:fragment,lane,ctx:{...state.ctx,sampleBuffer:state.samples[lane]!.buffer},wellRect:state.wellRects[lane]});
      this.gel=gelReducer(state,{type:'SET_FRAGMENT_BASES',laneIndex:lane,index,bases});
      this.reviseOpenSample();this.refreshAll();
    }
    this.dispatch({type:'SET_SELECTED',laneIndex:lane,index});
    return index;
  });

  dispatch=(input:Action):void=>this.transact(()=>{
    if(input.type==='MOVE_SAMPLE'||input.type==='CLONE_SAMPLE_TO_LANE') {
      if(input.from===input.to||!this.gel.samples[input.from])return;
      this.dispatch({type:'BEGIN_SAMPLE_DRAG',laneIndex:input.from,clone:input.type==='CLONE_SAMPLE_TO_LANE'});
      this.dispatch({type:'UPDATE_SAMPLE_DRAG',laneIndex:input.to});
      this.dispatch({type:'END_SAMPLE_DRAG'});return;
    }
    let action=input;
    if(action.type==='CLONE_FRAGMENT'&&action.color===undefined&&this.gel.samples[action.laneIndex]?.fragments[action.sourceIndex])
      action={...action,color:this.molecular.randomFragmentColor()};
    const old=this.gel,next=gelReducer(old,action);
    if(next===old) {
      // GelSettingsView notifies even when Gel::setNumLanes leaves layout intact.
      if(action.type==='SET_NUM_LANES')this.refreshAll();
      return;
    }
    if(action.type==='UPDATE_SAMPLE_DRAG'&&old.drag?.type==='sample') {
      let intermediate=old;
      if(old.drag.laneIndex!==-1) {
        const samples=old.samples.slice();samples[old.drag.laneIndex]=null;
        intermediate={...old,samples};this.refreshAll(intermediate);
      }
      if(next.drag?.type==='sample'&&next.drag.laneIndex!==-1)this.refreshAll({...intermediate,samples:next.samples});
      this.gel=next;this.syncOrdinary();this.refreshAll();
      return;
    }
    this.gel=next;this.reviseOpenSample();
    switch(action.type) {
      // Native settings callbacks notify even when their resulting value is unchanged.
      case 'SET_TIME':case 'SET_VOLTAGE':case 'SET_WELL_DAMAGE':case 'SET_GEL_BUFFER':
        this.refreshAll();break;
      case 'SET_SELECTED_LANE':case 'BEGIN_SAMPLE_DRAG':
        this.syncOrdinary();if(modelChanged(old,next))this.refreshAll();break;
      case 'SET_SELECTED':case 'BEGIN_DRAG':case 'SELECT_NEXT':case 'SELECT_PREV':case 'TOGGLE_SAMPLE_SETTINGS':
        this.syncOrdinary();this.selectInspector(next.selectedFragmentIndex);break;
      case 'SYNC_SELECTION_VIEW':case 'CLOSE_SAMPLE':this.syncOrdinary();break;
      case 'SET_INSPECTOR_MODE':
        this.syncOrdinary();this.selectInspector(next.selectedFragmentIndex);break;
      case 'CLONE_FRAGMENT':
        this.refreshAll();this.syncOrdinary();this.selectInspector(next.selectedFragmentIndex);break;
      case 'ADD_FRAGMENT': {
        this.syncOrdinary();this.refreshAll();
        const meta=this.active.get('sample');
        if(meta){meta.view.setSample(next.samples[action.laneIndex]);meta.syncedSample=meta.view.sample;}
        this.selectInspector(next.selectedFragmentIndex);break;
      }
      case 'DELETE_FRAGMENT': {
        const meta=this.active.get('sample');
        if(meta&&sameSample(meta.view.sample,next.samples[action.laneIndex])) {
          if(fragmentIndexIn(old.selection,old.samples[action.laneIndex])===action.index)this.selectInspector(null);
          meta.view.setSample(next.samples[action.laneIndex]);meta.syncedSample=meta.view.sample;
        }
        this.refreshAll();break;
      }
      case 'UPDATE_BAND_DRAG':
        if(old.drag?.type==='band'&&next.drag?.type==='band'&&old.drag.laneIndex!==next.drag.laneIndex) {
          this.syncOrdinary();this.selectInspector(next.selectedFragmentIndex);
        }
        if(old.drag?.type==='band')this.refreshAll();break;
      case 'LOAD_GEL_STATE':
        for(const meta of [...this.active.values()])this.close(meta);
        this.setInspector('none');this.refreshAll();break;
      case 'ADD_LOUPE': {
        const loupe=next.loupes.at(-1)!;
        const meta=this.createView(`loupe-${loupe.id}`,'persistent',null);
        meta.anchor=loupe.anchor;this.persistent.push(meta);this.refresh(meta,next);break;
      }
      case 'MOVE_LOUPE': {
        const meta=this.active.get(`loupe-${action.id}`),loupe=next.loupes.find(l=>l.id===action.id);
        if(meta&&loupe&&action.mode!=='frame'){meta.anchor=loupe.anchor;this.refresh(meta,next);}break;
      }
      case 'RAISE_LOUPE':this.raiseLayer(`loupe-${action.id}`);break;
      case 'REMOVE_LOUPE':this.close(this.active.get(`loupe-${action.id}`));break;
      case 'CLEAR_LOUPES':for(const meta of [...this.active.values()])if(meta.kind==='persistent')this.close(meta);break;
      case 'SET_HOVER_LOUPE_ENABLED':case 'TOGGLE_HOVER_LOUPE':
        this.applyHover(hoverLoupeReducer(this.hover,{type:'enable',value:next.hoverLoupeEnabled}));break;
      default:if(modelChanged(old,next))this.refreshAll();break;
    }
    if(this.pendingRelease&&!this.gel.drag) {
      this.applyHover(hoverLoupeReducer(this.hover,{type:'up',point:this.pendingRelease.point}));this.pendingRelease=null;
    }
  });
}
