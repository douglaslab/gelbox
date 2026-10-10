import {resolveAssetUrl} from '../../lib/layout/assets';
import {LAYOUT} from '../../lib/layout/layout';
import {useViewZIndex} from '../gel/useViewLayer';
import styles from './HelpButton.module.css';

/** Pinned GelboxApp::makeHelpBtn / Config::mHelpURL. */
export function HelpButton() {
  const zIndex=useViewZIndex('help-button');
  return <a className={styles.helpButton} aria-label="Help"
    href="http://douglaslab.org/gelbox/" target="_blank" rel="noopener noreferrer"
    draggable={false} onPointerDown={event=>event.preventDefault()}
    style={{position:'fixed',right:LAYOUT.btnGutter,bottom:LAYOUT.btnGutter,
      width:LAYOUT.btnSize.x,height:LAYOUT.btnSize.y,zIndex}}>
    <img src={resolveAssetUrl('/assets/help.png')}
      width={LAYOUT.btnSize.x} height={LAYOUT.btnSize.y} alt="" draggable={false}/>
  </a>;
}
