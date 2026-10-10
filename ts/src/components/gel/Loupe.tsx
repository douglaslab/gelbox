import {loupeSeed} from '../../lib/sim/loupeSeed';
import {useEffect,useMemo,useRef} from 'react';
import {type SampleFragRef} from '../../lib/gel/sampleFragRef';
import type {BandLaneFragment} from '../../lib/sim/sampleFromGel';
import { useGelDispatch, useGelState } from './GelContext';
import type { LoupeRef } from '../../lib/gel/gelState';
import type { Sample } from '../../lib/sim/sample';
import type { DegradeFilter } from '../../lib/sim/sampleFromGel';
import { SampleSimCanvas } from '../sample/SampleSimCanvas';

const LOUPE_SIZE = 171;   // C++ Layout::mLoupeSize

interface LoupeProps {
  loupe:          LoupeRef;
  sample:         Sample;
  origins:        BandLaneFragment[];
  degradeFilter?: DegradeFilter;
}

export function Loupe({ loupe, sample, degradeFilter, origins }: LoupeProps) {
  const dispatch = useGelDispatch(),state=useGelState();
  const hovered=useRef<SampleFragRef|null>(null);
  const source=(index:number):SampleFragRef|null=>{
    const origin=origins[index];
    return origin?{lane:origin.lane,fragmentIndex:origin.fragment}:null;
  };
  const selected=useMemo(()=>new Set(origins.flatMap((o,i)=>state.selection?.lane===o.lane&&state.selection.fragmentIndex===o.fragment?[i]:[])),[origins,state.selection]);
  const rollover=useMemo(()=>new Set(origins.flatMap((o,i)=>state.rollover?.lane===o.lane&&state.rollover.fragmentIndex===o.fragment?[i]:[])),[origins,state.rollover]);
  useEffect(()=>()=>{
    if(hovered.current)dispatch({type:'CLEAR_ROLLOVER_IF',ref:hovered.current});
  },[dispatch]);
  return (
    <div
      data-testid={`loupe-${loupe.id}`}
      data-loupe-id={loupe.id}
      style={{
        position: 'fixed',
        left: loupe.screen.x,
        top: loupe.screen.y,
        width: LOUPE_SIZE,
        height: LOUPE_SIZE,
        background: 'var(--color-surface-raised, #14131a)',
        border: '1px solid var(--color-grid, #444)',
        borderRadius: 6,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        overflow: 'hidden',
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      <button
        data-testid={`loupe-close-${loupe.id}`}
        onClick={() => dispatch({ type: 'REMOVE_LOUPE', id: loupe.id })}
        style={{
          position: 'absolute', top: 4, right: 4, zIndex: 1,
          width: 22, height: 22, padding: 0,
          background: 'transparent', border: 'none',
          color: 'var(--color-ink-muted, #888)', cursor: 'pointer',
          fontSize: 16, lineHeight: '20px',
        }}
        aria-label="Close loupe"
      >×</button>
      <SampleSimCanvas
        sample={sample}
        prerollSample
        width={LOUPE_SIZE}
        height={LOUPE_SIZE}
        seed={loupeSeed(loupe.anchor, state.ctx.time)}
        degradeFilter={degradeFilter}
        selectedFragment={selected}
        rolloverFragment={rollover}
        onPickFragment={index=>{const ref=source(index);if(ref)dispatch({type:'SET_SELECTION',ref});}}
        onPickBackground={() => dispatch({type:'SET_SELECTION',ref:null})}
        onHoverFragment={index=>{
          const ref=index===null?null:source(index);
          if(ref)dispatch({type:'SET_ROLLOVER',ref});
          else if(hovered.current)dispatch({type:'CLEAR_ROLLOVER_IF',ref:hovered.current});
          hovered.current=ref;
        }}
        data-testid={`loupe-canvas-${loupe.id}`}
      />
    </div>
  );
}
