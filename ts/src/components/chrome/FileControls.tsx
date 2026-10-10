import {useSharedPresentation} from '../gel/ScenePresentation';
import {SharedAssetPaint} from '../gel/SharedAssetPaint';
import {useNativeButtonTint} from '../gel/useNativeButtonTint';
import {useDisplayScale} from '../../lib/gpu/useDisplayScale';
import {flushSync} from 'react-dom';
import {useFileLoadQueue} from '../gel/FileLoadProvider';
import {useViewLayer,useViewZIndex} from '../gel/useViewLayer';
import {Children,type ReactNode,type CSSProperties} from 'react';
import {LAYOUT} from '../../lib/layout/layout';
import styles from './FileControls.module.css';
import { resolveAssetUrl } from '../../lib/layout/assets';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const registry=useSharedPresentation(),buttonElement=useRef<HTMLButtonElement>(null),button=useNativeButtonTint();
  useDisplayScale();const buttonUrl=resolveAssetUrl('/assets/settings.png');
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
  const fileQueue = useFileLoadQueue();
  const current = useRef(state);
  useLayoutEffect(() => { current.current = state; }, [state]);
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
    // Snapshot and clear the input immediately, even while another load waits.
    e.target.value = '';
    await fileQueue.run(async isCurrent => {
      try {
        const text = await file.text();
        if (!isCurrent()) return;
        const result = deserializeFile(text);
        if (result.kind === 'sample') {
          const state = current.current;
          if (state.samples.slice(0, state.numLanes).every(Boolean)) throw new Error('No empty lane available');
          flushSync(() => dispatch({ type: 'IMPORT_SAMPLE', sample: result.sample }));
        } else {
          flushSync(() => dispatch({
            type: 'LOAD_GEL_STATE', samples: result.samples,
            numLanes: result.numLanes, ctx: result.ctx,
          }));
        }
        setError(null);
        setOpen(false);
      } catch (err) {
        if (isCurrent()) setError(`Open failed: ${(err as Error).message}`);
      }
    });
  }

  return (
    <section onPointerDownCapture={e => e.preventDefault()} ref={menuRef} data-testid="file-controls" style={{display:'contents'}}>
      {open && <ApplicationMenu>
        <button className={styles.openButton} data-testid="open-btn" onClick={onOpenClick}>{' Open… '}</button>
        <button className={styles.saveGelButton} data-testid="save-gel-btn" onClick={onSaveGel}>{' Save Gel… '}</button>
        {selectedSample && <button className={styles.saveSampleButton} data-testid="save-sample-btn" onClick={onSaveSample}>{' Save Selected Sample… '}</button>}
        <label className={styles.hoverToggle}>
          <input type="checkbox" checked={state.hoverLoupeEnabled}
            onChange={event => dispatch({ type: 'SET_HOVER_LOUPE_ENABLED', value: event.target.checked })} />
          Loupe on hover
        </label>
        <label className={styles.hoverToggle}>
          <input type="checkbox" checked={state.renderEnabled}
            onChange={event => dispatch({type:'SET_RENDER_ENABLED',value:event.target.checked})} />
          Render
        </label>
      </ApplicationMenu>}
      <button ref={buttonElement} {...button.events} type="button" aria-label="Application settings" aria-expanded={open} aria-controls="application-file-menu" onClick={() => setOpen(!open)} style={{ position: 'fixed', left:16, bottom:16, zIndex:buttonZ, width: 32, height: 32, border: 0, padding: 0, background: 'transparent', cursor: 'pointer',outline:registry?'none':undefined }}>
        <img src={buttonUrl} alt="" width={32} height={32} style={{opacity:registry?0:undefined}} />
        {registry&&<SharedAssetPaint registry={registry} viewKey="app-button" element={buttonElement} url={buttonUrl} tint={button.tint}/>}
      </button>
      <input ref={fileInputRef} data-testid="file-input" type="file" accept=".json,.xml,application/json,text/xml,application/xml" style={{ display: 'none' }} onChange={onFileChange} />
      {error && <div role="alert" data-testid="file-error" style={{ position: 'fixed', bottom: 180, left: 16, zIndex:100, width: 260, background: '#fff', color: '#c44', fontSize: 12 }}>{error}</div>}
    </section>
  );
}

function ApplicationMenu({children}:{children:ReactNode}){
 const {zIndex}=useViewLayer('app-settings');
 const items=Children.toArray(children);
 // Native text buttons render a 1x texture and divide its size by the window
 // scale; CheckboxView explicitly renders its label at the window scale.
 const scale=window.devicePixelRatio||1;
 return <div id="application-file-menu" className={styles.menu} style={{
   left:LAYOUT.btnGutter,bottom:LAYOUT.btnGutter+LAYOUT.btnSize.y,zIndex,
   fontFamily:LAYOUT.uiFont,fontWeight:LAYOUT.uiFontWeight,
   '--button-font-size':`${LAYOUT.uiFontSize/scale}px`,
   '--button-line-height':`${17/scale}px`,
   '--menu-scale':scale,
   // CoreText Avenir-Medium 12 ascent + descent; native rounds texture pixels up.
   '--label-line-height':`${Math.ceil(16.3919677734375*scale)/scale}px`,
 } as CSSProperties}>
   <img data-testid="application-menu-divider" src={resolveAssetUrl('/assets/app-settings-line.png')}
     width={113} height={8} alt="" draggable={false}
     style={{position:'absolute',width:113,height:8,maxWidth:'none',left:-LAYOUT.appSettingsToDivLine.x,bottom:LAYOUT.appSettingsToDivLine.y}}/>
   {items.map((item,index)=><div key={index} className={styles.item}
     style={{bottom:LAYOUT.appSettingsToFirstWidgetGutter+LAYOUT.appSettingsItemVOffset*(items.length-1-index)}}>{item}</div>)}
 </div>;
}
