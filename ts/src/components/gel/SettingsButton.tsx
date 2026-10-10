import {useEffect,useRef,useState} from 'react';
import {useSharedPresentation} from './ScenePresentation';
import {SharedAssetPaint} from './SharedAssetPaint';
import {useDisplayScale} from '../../lib/gpu/useDisplayScale';
import { LAYOUT } from '../../lib/layout/layout';
import { resolveAssetUrl } from '../../lib/layout/assets';
import { useGelDispatch, useGelState } from './GelContext';

/**
 * 32×32 gear button that toggles inspector between default and gel-settings mode.
 * Matches the C++ Gelbox `mSettingsBtn` (assets/settings.png, mBtnSize 32×32).
 */
export function SettingsButton() {
  const registry=useSharedPresentation(),element=useRef<HTMLButtonElement>(null);
  const [hover,setHover]=useState(false),[down,setDown]=useState(false);
  useDisplayScale();
  useEffect(()=>{const release=()=>setDown(false);window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);return()=>{window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);};},[]);
  const url=resolveAssetUrl('/assets/settings.png'),shade=down&&hover?0.7:hover?0.9:1;
  const state    = useGelState();
  const dispatch = useGelDispatch();

  const active = state.inspectorMode === 'gel-settings';

  function onClick() {
    dispatch({
      type: 'SET_INSPECTOR_MODE',
      mode: active ? 'default' : 'gel-settings',
    });
  }

  return (
    <button
      ref={element}
      onPointerEnter={()=>setHover(true)} onPointerLeave={()=>setHover(false)}
      onPointerDown={event=>{if(event.button===0)setDown(true);}}
      onPointerUp={()=>setDown(false)} onPointerCancel={()=>setDown(false)} onLostPointerCapture={()=>setDown(false)}
      type="button"
      onClick={onClick}
      data-testid="settings-button"
      aria-label="Toggle gel settings"
      aria-pressed={active}
      style={{
        width:    LAYOUT.btnSize.x,
        height:   LAYOUT.btnSize.y,
        padding:  0,
        border:   0,
        background: registry?'transparent':active ? LAYOUT.btnDownColor : 'transparent',
        outline: registry?'none':undefined,
        borderRadius: 4,
        cursor:   'pointer',
      }}
    >
      <img
        src={url}
        alt=""
        width={LAYOUT.btnSize.x}
        height={LAYOUT.btnSize.y}
        style={{ display: 'block',opacity:registry?0:undefined }}
      />
      {registry&&<SharedAssetPaint registry={registry} viewKey="gel" element={element} url={url} tint={[shade,shade,shade,1]} order={100}/>}
    </button>
  );
}
