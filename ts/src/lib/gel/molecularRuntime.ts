import {MolecularSim, type Rect} from '../sim/molecularSimEngine';
import {CinderRand} from '../sim/rng';
import {loupeSeed} from '../sim/loupeSeed';
import type {Fragment,Sample} from '../sim/sample';
import {nativeFragmentColor,nativeSpecies} from './nativeSpecies';

interface ViewOptions {
  bounds:Rect;
  sample?:Sample|null;
  timeScale?:number;
}

/** One native SampleView lifetime, independent of React and GPU surfaces. */
export class MolecularView {
  readonly sim:MolecularSim;
  readonly viewSeed:number;
  localRand:CinderRand;
  sample:Sample|null;
  inspectorOpen=false;
  alive=true;
  ticks=0;
  frozen=false;
  bulletTime=false;
  beforeTick?:()=>void;
  afterTick?:()=>void;

  constructor(readonly id:string,globalRand:CinderRand,options:ViewOptions,
    private onDispose?: (view:MolecularView)=>void) {
    // Native member construction happens before SampleView::setup's seed draw.
    this.sim=new MolecularSim({bounds:options.bounds,globalRand});
    this.viewSeed=globalRand.nextInt();
    this.localRand=new CinderRand(this.viewSeed);
    this.sample=options.sample??null;
    this.sim.timeScale=options.timeScale??1;
    this.sim.setSample(this.sample);
    this.globalRand=globalRand;
  }
  private readonly globalRand:CinderRand;

  private assertAlive():void {
    if(!this.alive)throw new Error(`Molecular view ${this.id} is disposed`);
  }
  createFragment():Fragment {
    this.assertAlive();
    return nativeSpecies(this.localRand);
  }
  setInspectorOpen(open:boolean):void {
    this.assertAlive();
    if(open&&!this.inspectorOpen) {
      // FragmentView::makeSliders initializes its seven aggregate graph values.
      for(let i=0;i<7;i++)this.globalRand.nextFloat();
    }
    this.inspectorOpen=open;
  }
  setSample(sample:Sample|null,filter?:ReadonlyMap<number,number>):void {
    this.assertAlive();
    this.sample=sample;
    this.sim.setSample(sample,filter);
    this.ticks=0;
    this.frozen=false;
  }
  refreshDetail(anchor:{x:number;y:number},time:number,sample:Sample,
    filter?:ReadonlyMap<number,number>):void {
    this.assertAlive();
    const seed=loupeSeed(anchor,time);
    this.sim.parts=[];
    this.localRand=new CinderRand(seed);
    this.sim.setRand(seed);
    this.setSample(sample,filter);
    this.sim.preroll();
  }
  /** Only the owning application's frame driver calls this. */
  tick(freezeAfter?:number):void {
    if(!this.alive)return;
    this.beforeTick?.();
    if(!this.alive)return;
    if(freezeAfter===undefined||this.ticks<freezeAfter) {
      this.sim.tick(this.bulletTime);
      this.ticks++;
      this.frozen=false;
    } else this.frozen=true;
    this.afterTick?.();
  }
  dispose():void {
    if(!this.alive)return;
    this.alive=false;
    this.inspectorOpen=false;
    this.beforeTick=undefined;
    this.afterTick=undefined;
    this.onDispose?.(this);
    this.onDispose=undefined;
  }
}

/** Native ordered molecular view ownership and global random stream.
 * Document/event commands own creation and updates; canvases only draw. */
export class MolecularRuntime {
  private readonly globalRand:CinderRand;
  private ordered:MolecularView[]=[];
  private byId=new Map<string,MolecularView>();
  /** Test-only deterministic frame limit, unrelated to renderer readiness. */
  freezeAfter?:number;

  constructor(seed=310) { this.globalRand=new CinderRand(seed); }
  get views():readonly MolecularView[] { return this.ordered; }
  getView(id:string):MolecularView|undefined { return this.byId.get(id); }
  createView(id:string,options:ViewOptions):MolecularView {
    if(this.byId.has(id))throw new Error(`Duplicate molecular view ${id}`);
    const view=new MolecularView(id,this.globalRand,options,v=>this.detach(v));
    this.byId.set(id,view);
    this.ordered=[...this.ordered,view];
    return view;
  }
  private detach(view:MolecularView):void {
    if(this.byId.get(view.id)===view)this.byId.delete(view.id);
    this.ordered=this.ordered.filter(v=>v!==view);
  }
  removeView(id:string,retain=false):MolecularView|undefined {
    const view=this.byId.get(id);
    if(!view)return undefined;
    this.detach(view);
    if(!retain)view.dispose();
    return view;
  }
  raiseView(id:string):void {
    const view=this.byId.get(id);
    if(view&&this.ordered.at(-1)!==view)this.ordered=[...this.ordered.filter(v=>v!==view),view];
  }
  /** null represents the gel below all molecular views. */
  moveViewAbove(id:string,above:string|null):void {
    const view=this.byId.get(id);
    if(!view||id===above)return;
    const rest=this.ordered.filter(v=>v!==view);
    const index=above===null?-1:rest.findIndex(v=>v.id===above);
    if(above!==null&&index===-1)return;
    this.ordered=[...rest.slice(0,index+1),view,...rest.slice(index+1)];
  }
  randomFragmentColor():[number,number,number] { return nativeFragmentColor(this.globalRand); }
  tick(beforeViews?:()=>void):void {
    // Capture instances, not IDs: a replacement with the same key must wait.
    const snapshot=this.ordered.slice();
    beforeViews?.();
    for(const view of snapshot)if(view.alive)view.tick(this.freezeAfter);
  }
}
