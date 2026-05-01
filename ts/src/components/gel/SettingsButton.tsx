import { LAYOUT } from '../../lib/layout/layout';
import { resolveAssetUrl } from '../../lib/layout/assets';
import { useGelDispatch, useGelState } from './GelContext';

/**
 * 32×32 gear button that toggles inspector between default and gel-settings mode.
 * Matches the C++ Gelbox `mSettingsBtn` (assets/settings.png, mBtnSize 32×32).
 */
export function SettingsButton() {
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
        background: active ? LAYOUT.btnDownColor : 'transparent',
        borderRadius: 4,
        cursor:   'pointer',
      }}
    >
      <img
        src={resolveAssetUrl('/assets/settings.png')}
        alt=""
        width={LAYOUT.btnSize.x}
        height={LAYOUT.btnSize.y}
        style={{ display: 'block' }}
      />
    </button>
  );
}
