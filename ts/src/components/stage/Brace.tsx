import { resolveAssetUrl } from '../../lib/layout/assets';
import { LAYOUT } from '../../lib/layout/layout';

/**
 * Vertical brace graphic that sits between the sample panel and the inspector
 * in the wide layout. The PNG is `assets/brace.png` (44x465) and is sized
 * exactly to LAYOUT.braceSize.
 */
export function Brace() {
  return (
    <img
      src={resolveAssetUrl('/assets/brace.png')}
      alt=""
      width={LAYOUT.braceSize.x}
      height={LAYOUT.braceSize.y}
      style={{ display: 'block', userSelect: 'none', pointerEvents: 'none' }}
      data-testid="brace"
    />
  );
}
