import {ApplicationMenuPaint} from './ApplicationMenuPaint';
import menuText from '../../lib/layout/nativeMenuText.json';
import {useSharedPresentation} from '../gel/ScenePresentation';
import {SharedAssetPaint} from '../gel/SharedAssetPaint';
import {useNativeButton} from '../gel/useNativeButton';
import {useDisplayScale} from '../../lib/gpu/useDisplayScale';
import {flushSync} from 'react-dom';
import {useFileLoadQueue} from '../gel/FileLoadProvider';
import {useReferenceImages} from '../gel/ReferenceImageLayer';
import {isReferenceImage} from '../../lib/gel/referenceImages';
import {isNativeAccelerator} from '../../lib/gel/nativeAccelerator';
import {useViewLayer,useViewZIndex} from '../gel/useViewLayer';
import {Children,type ReactNode,type CSSProperties,type PointerEvent as ReactPointerEvent,type MouseEvent as ReactMouseEvent} from 'react';
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
  const registry=useSharedPresentation(),buttonElement=useRef<HTMLButtonElement>(null);
  useDisplayScale();const buttonUrl=resolveAssetUrl('/assets/settings.png');
  const buttonZ=useViewZIndex('app-button');
  const [open, setOpen] = useState(false);
  const button=useNativeButton(()=>setOpen(value=>!value));
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
  const images = useReferenceImages();
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
        if (isReferenceImage(file.name)) {
          await images.load(file);
          if (isCurrent()) { setError(null); setOpen(false); }
          return;
        }
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

  // Native file shortcuts are global, including while a molecular view owns
  // keyboard focus. Keep current document/selection callbacks without binding
  // a new window listener on every animation render.
  const shortcuts = useRef({open:onOpenClick,saveGel:onSaveGel,saveSample:onSaveSample,selected:!!selectedSample});
  useLayoutEffect(() => {
    shortcuts.current={open:onOpenClick,saveGel:onSaveGel,saveSample:onSaveSample,selected:!!selectedSample};
  });
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!isNativeAccelerator(event)) return;
      // macOS Option changes the character (Option-S is ß on US keyboards).
      // Preserve the native Save Sample shortcut using its physical S key.
      const command=event.altKey && event.code==='KeyS' ? 's' : event.key.toLowerCase();
      if (command!=='o' && command!=='s') return;
      event.preventDefault();
      setOpen(false);
      if (command==='o') shortcuts.current.open();
      else if (!event.altKey) shortcuts.current.saveGel();
      else if (shortcuts.current.selected) shortcuts.current.saveSample();
    };
    window.addEventListener('keydown',key,true);
    return () => window.removeEventListener('keydown',key,true);
  },[]);

  return (
    <section onPointerDownCapture={e => e.preventDefault()} ref={menuRef} data-testid="file-controls" style={{display:'contents'}}>
      {open && <FileControlMenu selected={!!selectedSample} hoverLoupe={state.hoverLoupeEnabled} render={state.renderEnabled}
        onOpen={onOpenClick} onSaveGel={onSaveGel} onSaveSample={onSaveSample}
        onHoverLoupe={value=>dispatch({type:'SET_HOVER_LOUPE_ENABLED',value})}
        onRender={value=>dispatch({type:'SET_RENDER_ENABLED',value})}/>}
      <button ref={buttonElement} {...button.events} type="button" aria-label="Application settings" aria-expanded={open} aria-controls="application-file-menu" style={{ position: 'fixed', left:16, bottom:16, zIndex:buttonZ, width: 32, height: 32, border: 0, padding: 0, background: 'transparent', cursor: 'pointer',outline:registry?'none':undefined }}>
        <img src={buttonUrl} alt="" width={32} height={32} style={{opacity:registry?0:undefined}} />
        {registry&&<SharedAssetPaint registry={registry} viewKey="app-button" element={buttonElement} url={buttonUrl} tint={button.tint}/>}
      </button>
      <input ref={fileInputRef} data-testid="file-input" type="file" accept=".json,.xml,.jpg,.png,.gif,application/json,text/xml,application/xml" style={{ display: 'none' }} onChange={onFileChange} />
      {error && <div role="alert" data-testid="file-error" style={{ position: 'fixed', bottom: 180, left: 16, zIndex:100, width: 260, background: '#fff', color: '#c44', fontSize: 12 }}>{error}</div>}
    </section>
  );
}

function ApplicationMenu({children}:{children:ReactNode}){
 const {zIndex}=useViewLayer('app-settings');
 const registry=useSharedPresentation(),element=useRef<HTMLDivElement>(null),divider=useRef<HTMLImageElement>(null);
 const items=Children.toArray(children);
 // Native text buttons render a 1x texture and divide its size by the window
 // scale; CheckboxView explicitly renders its label at the window scale.
 const scale=useDisplayScale()>=2?2:1;
 return <div ref={element} id="application-file-menu" className={styles.menu} style={{
   opacity:registry?0:undefined,left:LAYOUT.btnGutter,bottom:LAYOUT.btnGutter+LAYOUT.btnSize.y,zIndex,
   fontFamily:LAYOUT.uiFont,fontWeight:LAYOUT.uiFontWeight,
   '--button-font-size':`${LAYOUT.uiFontSize/scale}px`,
   '--button-line-height':`${Math.floor(17/scale)}px`,
   '--menu-scale':scale,
   '--open-width':`${Math.floor(50/scale)}px`,'--save-width':`${Math.floor(67/scale)}px`,'--sample-width':`${Math.floor(139/scale)}px`,
   // CoreText Avenir-Medium 12 ascent + descent; native rounds texture pixels up.
   '--label-line-height':`${Math.floor(Math.ceil(16.3919677734375*scale)/scale)}px`,
 } as CSSProperties}>
   <img ref={divider} data-testid="application-menu-divider" src={resolveAssetUrl('/assets/app-settings-line.png')}
     width={113} height={8} alt="" draggable={false}
     style={{position:'absolute',width:113,height:8,maxWidth:'none',left:-LAYOUT.appSettingsToDivLine.x,bottom:LAYOUT.appSettingsToDivLine.y}}/>
   {registry&&<><SharedAssetPaint registry={registry} viewKey="app-settings" element={divider} url={resolveAssetUrl('/assets/app-settings-line.png')} order={-1}/><ApplicationMenuPaint element={element}/></>}
   {items.map((item,index)=><div key={index} className={styles.item}
     style={{bottom:LAYOUT.appSettingsToFirstWidgetGutter+LAYOUT.appSettingsItemVOffset*(items.length-1-index)}}>{item}</div>)}
 </div>;
}

/** Native controls retain mouse ownership and activate on release inside. */
function useMenuPointer(activate:()=>void){
 const pointer=useRef<number|null>(null);
 const inside=(e:ReactPointerEvent<HTMLElement>)=>{const r=e.currentTarget.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<r.right&&e.clientY>=r.top&&e.clientY<r.bottom;};
 const clear=(e:ReactPointerEvent<HTMLElement>)=>{pointer.current=null;e.currentTarget.dataset.menuDown='false';if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);};
 return {
  onPointerEnter:(e:ReactPointerEvent<HTMLElement>)=>{e.currentTarget.dataset.menuHover='true';},
  onPointerLeave:(e:ReactPointerEvent<HTMLElement>)=>{e.currentTarget.dataset.menuHover='false';e.currentTarget.dataset.menuDown='false';},
  onPointerDown:(e:ReactPointerEvent<HTMLElement>)=>{
   if(pointer.current!==null)return;e.preventDefault();pointer.current=e.pointerId;
   e.currentTarget.dataset.menuDown='true';e.currentTarget.dataset.menuHover='true';e.currentTarget.setPointerCapture(e.pointerId);
  },
  onPointerMove:(e:ReactPointerEvent<HTMLElement>)=>{const hit=inside(e);e.currentTarget.dataset.menuHover=String(hit);if(pointer.current===e.pointerId)e.currentTarget.dataset.menuDown=String(hit);},
  onPointerUp:(e:ReactPointerEvent<HTMLElement>)=>{if(pointer.current!==e.pointerId)return;const hit=inside(e);clear(e);if(hit)activate();},
  onPointerCancel:clear,onLostPointerCapture:clear,
  onContextMenu:(e:ReactMouseEvent<HTMLElement>)=>e.preventDefault(),
  onClick:(e:ReactMouseEvent<HTMLElement>)=>{e.preventDefault();if(e.detail===0)activate();},
 };
}
function MenuButton({index,onActivate,children,className,testId}:{index:number;onActivate:()=>void;children:ReactNode;className:string;testId:string}){
 const pointer=useMenuPointer(onActivate);
 return <button type="button" data-menu-text={index} className={className} data-testid={testId} {...pointer}>{children}</button>;
}
function MenuCheckbox({index,value,onChange,children}:{index:0|1;value:boolean;onChange:(value:boolean)=>void;children:ReactNode}){
 const pointer=useMenuPointer(()=>onChange(!value)),scale=useDisplayScale()>=2?'2':'1';
 return <label data-menu-text={index} className={styles.hoverToggle} style={{width:menuText[scale][index].frame[2]}} {...pointer}
  onClick={e=>{if(e.detail!==0)e.preventDefault();}}>
  <input type="checkbox" checked={value} onChange={e=>{if((e.nativeEvent as globalThis.MouseEvent).detail===0)onChange(e.target.checked);}}/>{children}
 </label>;
}
export function FileControlMenu({selected,hoverLoupe,render,onOpen,onSaveGel,onSaveSample,onHoverLoupe,onRender}:{selected:boolean;hoverLoupe:boolean;render:boolean;onOpen:()=>void;onSaveGel:()=>void;onSaveSample:()=>void;onHoverLoupe:(value:boolean)=>void;onRender:(value:boolean)=>void}){
 return <ApplicationMenu>
  <MenuButton index={4} className={styles.openButton} testId="open-btn" onActivate={onOpen}>{' Open… '}</MenuButton>
  <MenuButton index={3} className={styles.saveGelButton} testId="save-gel-btn" onActivate={onSaveGel}>{' Save Gel… '}</MenuButton>
  {selected&&<MenuButton index={2} className={styles.saveSampleButton} testId="save-sample-btn" onActivate={onSaveSample}>{' Save Selected Sample… '}</MenuButton>}
  <MenuCheckbox index={1} value={hoverLoupe} onChange={onHoverLoupe}>Loupe on hover</MenuCheckbox>
  <MenuCheckbox index={0} value={render} onChange={onRender}>Render</MenuCheckbox>
 </ApplicationMenu>;
}
