import {useViewLayer,useViewZIndex} from '../gel/useViewLayer';
import type {ReactNode} from 'react';
import styles from './FileControls.module.css';
import { resolveAssetUrl } from '../../lib/layout/assets';
import { useEffect, useRef, useState } from 'react';
import { useGelState, useGelDispatch } from '../gel/GelContext';
import { serializeSample, serializeGelState, deserializeFile } from '../../lib/gel/serialize';

function downloadJson(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function FileControls() {
  const buttonZ=useViewZIndex('app-button');
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [open]);
  const state = useGelState();
  const dispatch = useGelDispatch();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedSample = state.lastSampleLane === null ? null : state.samples[state.selectedLane];

  function onSaveSample() {
    if (!selectedSample) {
      setError('No sample in the selected lane');
      return;
    }
    setError(null);
    downloadJson(`${state.fixtureKey}-lane-${state.selectedLane}.json`, serializeSample(selectedSample));
    setOpen(false);
  }

  function onSaveGel() {
    setError(null);
    downloadJson(`${state.fixtureKey}-gel.json`, serializeGelState({
      samples: state.samples,
      numLanes: state.numLanes,
      ctx: state.ctx,
    }));
    setOpen(false);
  }

  function onOpenClick() {
    fileInputRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = deserializeFile(text);
      if (result.kind === 'sample') {
        if (state.samples.slice(0, state.numLanes).every(Boolean)) throw new Error('No empty lane available');
        dispatch({ type: 'IMPORT_SAMPLE', sample: result.sample });
      } else {
        dispatch({
          type: 'LOAD_GEL_STATE',
          samples: result.samples,
          numLanes: result.numLanes,
          ctx: result.ctx,
        });
      }
      setError(null);
      setOpen(false);
    } catch (err) {
      setError(`Open failed: ${(err as Error).message}`);
    } finally {
      // Reset so the same file can be opened twice in a row
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <section ref={menuRef} data-testid="file-controls" style={{display:'contents'}}>
      {open && <ApplicationMenu>
        <button data-testid="open-btn" onClick={onOpenClick}>Open…</button>
        <button data-testid="save-gel-btn" onClick={onSaveGel}>Save Gel…</button>
        {selectedSample && <button data-testid="save-sample-btn" onClick={onSaveSample}>Save Selected Sample…</button>}
        <label className={styles.hoverToggle}>
          <input type="checkbox" checked={state.hoverLoupeEnabled}
            onChange={event => dispatch({ type: 'SET_HOVER_LOUPE_ENABLED', value: event.target.checked })} />
          Loupe on hover
        </label>
      </ApplicationMenu>}
      <button type="button" aria-label="Application settings" aria-expanded={open} aria-controls="application-file-menu" onClick={() => setOpen(!open)} style={{ position: 'fixed', left:16, bottom:16, zIndex:buttonZ, width: 32, height: 32, border: 0, padding: 0, background: 'transparent', cursor: 'pointer' }}>
        <img src={resolveAssetUrl('/assets/settings.png')} alt="" width={32} height={32} />
      </button>
      <input ref={fileInputRef} data-testid="file-input" type="file" accept=".json,.xml,application/json,text/xml,application/xml" style={{ display: 'none' }} onChange={onFileChange} />
      {error && <div role="alert" data-testid="file-error" style={{ position: 'fixed', bottom: 180, left: 16, zIndex:100, width: 260, background: '#fff', color: '#c44', fontSize: 12 }}>{error}</div>}
    </section>
  );
}

function ApplicationMenu({children}:{children:ReactNode}){
 const {zIndex}=useViewLayer('app-settings');
 return <div id="application-file-menu" style={{position:'fixed',bottom:64,left:16,minWidth:180,display:'flex',flexDirection:'column',alignItems:'flex-start',gap:12,paddingBottom:12,borderBottom:'1px solid #979797',background:'#fff',zIndex}}>{children}</div>;
}
