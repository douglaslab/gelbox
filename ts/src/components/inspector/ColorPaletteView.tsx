import { FRAGMENT_PALETTE_HEX, FRAGMENT_PALETTE_RGB, hexToRgb } from '../../lib/fragment/palette';
import styles from './ColorPaletteView.module.css';

export interface ColorPaletteViewProps {
  value: readonly [number, number, number];
  onChange: (color: [number, number, number]) => void;
  testId?: string;
}

function rgbApproxEq(a: readonly [number, number, number], b: readonly [number, number, number]) {
  const EPS = 0.001;
  return Math.abs(a[0] - b[0]) < EPS && Math.abs(a[1] - b[1]) < EPS && Math.abs(a[2] - b[2]) < EPS;
}

/**
 * 4×3 grid of color swatches. Mirrors C++ ColorPaletteView used inside FragmentView.
 */
export function ColorPaletteView({ value, onChange, testId }: ColorPaletteViewProps) {
  return (
    <div className={styles.grid} data-testid={testId}>
      {FRAGMENT_PALETTE_HEX.map((hex, i) => {
        const linear = FRAGMENT_PALETTE_RGB[i];
        const selected = rgbApproxEq(value, linear);
        return (
          <button
            type="button"
            key={hex}
            className={styles.swatch}
            data-selected={selected || undefined}
            data-testid={testId ? `${testId}-swatch-${i}` : undefined}
            onClick={() => onChange(hexToRgb(hex))}
            aria-label={`Color ${i + 1}: ${hex}`}
            aria-pressed={selected}
          >
            <div className={styles.swatchInner} style={{ background: hex }} />
          </button>
        );
      })}
    </div>
  );
}
