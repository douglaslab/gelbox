import {useRef} from 'react';
import {useSharedPresentation} from '../gel/ScenePresentation';
import {SharedAssetPaint} from '../gel/SharedAssetPaint';
import {useGelState} from '../gel/GelContext';
import {selectInspectorView} from '../../lib/gel/gelState';
import {useDisplayScale} from '../../lib/gpu/useDisplayScale';
import { resolveAssetUrl } from '../../lib/layout/assets';
import { LAYOUT } from '../../lib/layout/layout';

/**
 * Vertical brace graphic that sits between the sample panel and the inspector
 * in the wide layout. The PNG is `assets/brace.png` (44x465) and is sized
 * exactly to LAYOUT.braceSize.
 */
export function Brace() {
  const registry=useSharedPresentation(),element=useRef<HTMLImageElement>(null),state=useGelState();
  useDisplayScale();const url=resolveAssetUrl('/assets/brace.png');
  return (<>
    <img ref={element}
      src={url}
      alt=""
      width={LAYOUT.braceSize.x}
      height={LAYOUT.braceSize.y}
      style={{ display: 'block', userSelect: 'none', pointerEvents: 'none',opacity:registry?0:undefined }}
      data-testid="brace"
    />
    {registry&&<SharedAssetPaint registry={registry} viewKey={`inspector-${selectInspectorView(state)}`} element={element} url={url} order={-100}/>}
  </>);
}
