import { useId } from 'react';

export function clampToRange(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function quantizeStep(v: number, min: number, max: number, step: number): number {
  if (step <= 0) return v;
  const offset = (v - min) / step;
  const rounded = Math.round(offset) * step + min;
  return clampToRange(rounded, min, max);
}

export interface SliderProps {
  label:    string;
  value:    number;
  min:      number;
  max:      number;
  step?:    number;       // 0 = continuous; default 0
  unit?:    string;       // appended to value pill ("V", "ms", etc.)
  onChange: (value: number) => void;
}

export function Slider({ label, value, min, max, step = 0, unit, onChange }: SliderProps) {
  const id = useId();
  const html = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <label htmlFor={id} style={{ color: 'var(--color-ink)', fontSize: 13 }}>{label}</label>
        <span data-testid={`${id}-value`} style={{ color: 'var(--color-ink-muted)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          {step >= 1 ? value.toFixed(0) : value.toFixed(2)}{unit ? ` ${unit}` : ''}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step > 0 ? step : 'any'}
        value={value}
        onChange={(e) => {
          const raw = parseFloat(e.target.value);
          const clamped = clampToRange(raw, min, max);
          const final = step > 0 ? quantizeStep(clamped, min, max, step) : clamped;
          onChange(final);
        }}
        style={{ width: '100%' }}
      />
    </div>
  );
  return html;
}
