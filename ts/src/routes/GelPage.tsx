import {useFileLoadQueue} from '../components/gel/FileLoadProvider';
import {tubeGeometry} from '../lib/layout/tubeGeometry';
import {flushSync} from 'react-dom';
import {ReferenceImageLayer,useReferenceImages} from '../components/gel/ReferenceImageLayer';
import {isReferenceImage} from '../lib/gel/referenceImages';
import { sameSample } from '../lib/gel/sampleFragRef';
import { FileControls } from '../components/chrome/FileControls';
import { useMemo, useState, useRef, useLayoutEffect } from 'react';
import { GelProvider, useGelState, useGelDispatch } from '../components/gel/GelContext';
import { GelCanvas } from '../components/gel/GelCanvas';
import { GelOverlay, type BandLaneFragment } from '../components/gel/GelOverlay';
import { MicrotubeRow } from '../components/gel/MicrotubeRow';
import { SettingsButton } from '../components/gel/SettingsButton';
import { TimelineSlider } from '../components/gel/TimelineSlider';
import { LoupePortalLayer } from '../components/gel/LoupePortalLayer';
import { Stage } from '../components/stage/Stage';
import { Brace } from '../components/stage/Brace';
import { SampleView } from '../components/sample/SampleView';
import { InspectorPanel } from '../components/inspector/InspectorPanel';
import { BUFFER_H2O, bufferEquals } from '../lib/sim/buffer';
import { fragToBands } from '../lib/sim/gelSim';
import { deserializeFile } from '../lib/gel/serialize';
import { getVisibleSampleLane, isInspectorVisible, selectInspectorView } from '../lib/gel/gelState';
import type { Band } from '../lib/sim/band';

function GelInner() {
  const state = useGelState();
  const dispatch = useGelDispatch();
  const images=useReferenceImages();
  const current=useRef(state),fileQueue=useFileLoadQueue();
  useLayoutEffect(()=>{current.current=state;},[state]);
  const [dropError, setDropError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const { bands, bandToLaneFragment } = useMemo(() => {
    const bands: Band[] = [];
    const bandToLaneFragment: BandLaneFragment[] = [];
    for (let lane = 0; lane < state.numLanes; lane++) {
      const sample = state.samples[lane];
      if (!sample) continue;
      for (let fragi = 0; fragi < sample.fragments.length; fragi++) {
        const out = fragToBands(sample, fragi, state.wellRects[lane], lane, state.ctx);
        for (const b of out) {
          bands.push(b);
          bandToLaneFragment.push({ lane, fragment: fragi });
        }
      }
    }
    return { bands, bandToLaneFragment };
  }, [state.samples, state.ctx, state.wellRects, state.numLanes]);

  // Gel::getRenderGlobalWarp: exact water composition, fixed native seed.
  const globalWarp = useMemo(() => ({
    h2oDistort: bufferEquals(state.ctx.gelBuffer, BUFFER_H2O),
    randSeed: 1,
  }), [state.ctx.gelBuffer]);

  const selectedLane = state.selection ? state.samples.findIndex(s => sameSample(s, state.selection!.sample)) : state.selectedLane;
  const selectedIndex = state.selection?.fragmentIndex ?? null;
  const selectedSample = state.selection?.sample ?? state.samples[state.selectedLane];
  const selectedFrag = selectedSample && selectedIndex !== null
    ? selectedSample.fragments[selectedIndex!]
    : null;

  function onDrop(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();setDropError(null);setIsDragOver(false);
    const files=Array.from(e.dataTransfer.files),point={x:e.clientX,y:e.clientY};
    const workspace=e.currentTarget;
    // Native handles dropped files synchronously in input order. Serialize async
    // browser reads/decodes, including a second drop while the first is loading.
    void fileQueue.run(async isCurrent=>{
      const errors:string[]=[];
      for(const file of files){
        if(!isCurrent())return;
        try {
          if(isReferenceImage(file.name)){await images.load(file,point);continue;}
          const result=deserializeFile(await file.text());
          if(!isCurrent())return;
          if(result.kind==='sample'){
            const state=current.current;
            if(state.samples.slice(0,state.numLanes).every(Boolean))throw new Error('No empty lane available');
            const overlay=workspace.querySelector('[data-testid="gel-overlay"]')?.getBoundingClientRect();
            let preferredLane:number|undefined;
            if(overlay){
              const x=(point.x-overlay.left)/overlay.width*state.gelSize.width;
              const y=(point.y-overlay.top)/overlay.height*state.gelSize.height;
              if(x>=0&&x<state.gelSize.width&&y>=0&&y<=state.gelSize.height)
                preferredLane=Math.floor(x/state.gelSize.width*state.numLanes);
              else for(let lane=0;lane<state.numLanes;lane++){
                const {hit}=tubeGeometry(state.gelSize.width,state.gelSize.height,state.numLanes,lane);
                if(x>=hit.x1&&x<=hit.x2&&y>=hit.y1&&y<=hit.y2){preferredLane=lane;break;}
              }
            }
            flushSync(()=>dispatch({type:'IMPORT_SAMPLE',sample:result.sample,preferredLane}));
          }else flushSync(()=>dispatch({type:'LOAD_GEL_STATE',samples:result.samples,numLanes:result.numLanes,ctx:result.ctx}));
        }catch(err){errors.push(`${file.name}: ${(err as Error).message}`);}
      }
      if(isCurrent())setDropError(errors.length?`Drop failed: ${errors.join('; ')}`:null);
    });
  }

  function onDragEnter(e: React.DragEvent<HTMLElement>) {
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }
  function onDragLeave(e: React.DragEvent<HTMLElement>) {
    // Only clear when leaving the document, not when crossing child boundaries.
    if (e.relatedTarget === null) setIsDragOver(false);
  }

  // Left panel: microtube row floats above the gel rect (in the same vertical
  // band as the Sample/Gel panel headers). The gel canvas + overlay fill the
  // panel, and the time slider sits below.
  const leftPanel = (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MicrotubeRow />
      <div
        style={{
          position: 'absolute', inset: 0,
          transform: state.gelRotate ? `rotate(${state.gelRotate}deg)` : undefined,
          transformOrigin: '50% 0%',
        }}
      >
        <GelCanvas bands={bands} globalWarp={globalWarp} gelSize={state.gelSize} pixelsPerUnit={state.pixelsPerUnit} />
        <GelOverlay bands={bands} bandToLaneFragment={bandToLaneFragment} />
        <LoupePortalLayer bands={bands} bandToLaneFragment={bandToLaneFragment} />
      </div>
      {/*
        C++ Gelbox places the gel-settings button at the gel's lower-right
        with mBtnGutter (=16) below: button.upperRight = (gelRight,
        gelBottom + 16). So it sits BELOW the gel, right-aligned, in the
        same horizontal band as the time slider — just past the clock icon.
      */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: '100%',
          marginTop: 16,
        }}
      >
        <SettingsButton />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 48,
          top: '100%',
          marginTop: 16,
        }}
      >
        <TimelineSlider />
      </div>
    </div>
  );

  return (
    <div
      className="native-workspace"
      data-testid="gel-page"
      data-drag-over={isDragOver || undefined}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{ height: '100dvh', overflow: 'auto', position: 'relative', background: '#fff', color: '#000', fontFamily: 'Avenir, sans-serif', fontSizeAdjust: 'none' }}
    >
      {isDragOver && (
        <div
          data-testid="drop-zone-affordance"
          style={{
            position: 'fixed',
            inset: 16,
            border: '3px dashed #4990E2',
            borderRadius: 12,
            background: 'rgba(73, 144, 226, 0.06)',
            pointerEvents: 'none',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4990E2',
            font: '500 16px Inter, system-ui, sans-serif',
          }}
        >
          Drop a Gelbox JSON document, XML sample or JPG/PNG/GIF image
        </div>
      )}
      <FileControls />
      <Stage
        left={leftPanel}
        middle={state.inspectorMode !== 'gel-settings' && getVisibleSampleLane(state) !== null ? <SampleView /> : null}
        inspectorBesideGel={state.inspectorMode === 'gel-settings'}
        inspectorKind={selectInspectorView(state)}
        right={isInspectorVisible(state) ? <InspectorPanel /> : null}
        brace={isInspectorVisible(state) ? <Brace /> : null}
      />
      <ReferenceImageLayer />
      <div
        hidden
        data-testid="selection-info"
        style={{
          position: 'fixed',
          bottom: 8,
          left: 64,
          fontSize: 13,
          color: 'var(--color-ink-muted)',
          background: 'rgba(255,255,255,0.85)',
          padding: '2px 6px',
          borderRadius: 3,
          pointerEvents: 'none',
        }}
      >
        {selectedFrag
          ? `lane ${selectedLane} fragment ${selectedIndex}: ${selectedFrag.bases} bp, ${selectedFrag.mass} ng`
          : selectedSample
            ? `lane ${state.selectedLane}: ${selectedSample.fragments.length} fragments — click or tab through bands`
            : `lane ${state.selectedLane}: empty`}
      </div>
      {dropError && (
        <div
          data-testid="drop-error"
          style={{
            position: 'fixed',
            top: 8,
            right: 8,
            color: '#c44',
            fontSize: 12,
            background: '#fff',
            padding: '4px 8px',
            borderRadius: 4,
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          {dropError}
        </div>
      )}

    </div>
  );
}

export function GelPage() {
  return (
    <GelProvider>
      <GelInner />
    </GelProvider>
  );
}
