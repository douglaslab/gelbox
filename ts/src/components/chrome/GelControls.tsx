import { useGelState, useGelDispatch } from '../gel/GelContext';
import { Slider } from '../primitives/Slider';
import type { Sample } from '../../lib/sim/sample';

const FIXTURES: { key: string; label: string; loader: () => Promise<{ default: Sample }> }[] = [
  { key: 'ladder-1kb', label: '1 kb ladder', loader: () => import('../../../fixtures/states/ladder-1kb.json') as unknown as Promise<{ default: Sample }> },
];

export function GelControls() {
  const state = useGelState();
  const dispatch = useGelDispatch();

  const bufferKey: 'TBE' | 'TAE' | 'H2O' =
    state.ctx.gelBuffer.borate > 0 ? 'TBE'
      : state.ctx.gelBuffer.acetate > 0 ? 'TAE'
      : 'H2O';

  return (
    <section
      data-testid="gel-controls"
      style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, minWidth: 240 }}
    >
      <Slider
        label="Voltage"
        value={state.ctx.voltage}
        min={-300} max={300} step={1} unit="V"
        onChange={(v) => dispatch({ type: 'SET_VOLTAGE', value: v })}
      />
      <Slider
        label="Time"
        value={state.ctx.time}
        min={0} max={1} step={0}
        onChange={(v) => dispatch({ type: 'SET_TIME', value: v })}
      />
      <Slider
        label="Well damage"
        value={state.ctx.wellDamage}
        min={0} max={1} step={0}
        onChange={(v) => dispatch({ type: 'SET_WELL_DAMAGE', value: v })}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ color: 'var(--color-ink)', fontSize: 13 }}>Gel buffer</label>
        <select
          data-testid="gel-buffer-select"
          value={bufferKey}
          onChange={(e) => dispatch({ type: 'SET_GEL_BUFFER', value: e.target.value as 'TBE' | 'TAE' | 'H2O' })}
        >
          <option value="TBE">0.5× TBE</option>
          <option value="TAE">1× TAE</option>
          <option value="H2O">H₂O</option>
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ color: 'var(--color-ink)', fontSize: 13 }}>Sample</label>
        <select
          data-testid="fixture-select"
          value={state.fixtureKey}
          onChange={async (e) => {
            const fixture = FIXTURES.find((f) => f.key === e.target.value);
            if (!fixture) return;
            const mod = await fixture.loader();
            dispatch({ type: 'LOAD_FIXTURE', key: fixture.key, sample: mod.default });
          }}
        >
          {FIXTURES.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
      </div>
      <div data-testid="modifiers" style={{ fontSize: 12, color: 'var(--color-ink-muted)', fontFamily: 'monospace' }}>
        modifiers: {[
          state.modifiers.shift ? 'shift' : null,
          state.modifiers.alt   ? 'alt'   : null,
          state.modifiers.meta  ? 'meta'  : null,
        ].filter(Boolean).join(' + ') || '—'}
      </div>
    </section>
  );
}
