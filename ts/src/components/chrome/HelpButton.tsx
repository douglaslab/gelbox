import {useRef} from 'react';
import {useSharedPresentation} from '../gel/ScenePresentation';
import {SharedAssetPaint} from '../gel/SharedAssetPaint';
import {useNativeButtonTint} from '../gel/useNativeButtonTint';
import {useDisplayScale} from '../../lib/gpu/useDisplayScale';
import {resolveAssetUrl} from '../../lib/layout/assets';
import {LAYOUT} from '../../lib/layout/layout';
import {useViewZIndex} from '../gel/useViewLayer';
import styles from './HelpButton.module.css';

/** Pinned GelboxApp::makeHelpBtn / Config::mHelpURL. */
export function HelpButton() {
  const registry=useSharedPresentation(),element=useRef<HTMLAnchorElement>(null),button=useNativeButtonTint();
  useDisplayScale();const url=resolveAssetUrl('/assets/help.png');
  const zIndex=useViewZIndex('help-button');
  return <a ref={element} {...button.events} className={styles.helpButton} aria-label="Help"
    href="http://douglaslab.org/gelbox/" target="_blank" rel="noopener noreferrer"
    draggable={false} onPointerDown={event=>{button.events.onPointerDown(event);event.preventDefault();}}
    style={{position:'fixed',right:LAYOUT.btnGutter,bottom:LAYOUT.btnGutter,
      width:LAYOUT.btnSize.x,height:LAYOUT.btnSize.y,zIndex,outline:registry?'none':undefined}}>
    <img src={url} style={{opacity:registry?0:undefined}}
      width={LAYOUT.btnSize.x} height={LAYOUT.btnSize.y} alt="" draggable={false}/>
    {registry&&<SharedAssetPaint registry={registry} viewKey="help-button" element={element} url={url} tint={button.tint}/>}
  </a>;
}
