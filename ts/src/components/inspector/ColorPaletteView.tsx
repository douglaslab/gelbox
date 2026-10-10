import { FRAGMENT_PALETTE_HEX, nearestPaletteIndex, hexToRgb } from '../../lib/fragment/palette';
import styles from './ColorPaletteView.module.css';

export interface ColorPaletteViewProps {
  value: readonly [number, number, number];
  onChange: (color: [number, number, number]) => void;
  testId?: string;
}

/**
 * 4×3 grid of color swatches. Mirrors C++ ColorPaletteView used inside FragmentView.
 */
export function ColorPaletteView({ value, onChange, testId }: ColorPaletteViewProps) {
  const selectedIndex = nearestPaletteIndex(value);
  return (
    <div className={styles.grid} data-testid={testId}>
      {FRAGMENT_PALETTE_HEX.map((hex, i) => {
        const selected = i === selectedIndex;
        return (
          <button
            type="button"
            key={hex}
            className={styles.swatch}
            data-selected={selected || undefined}
            data-testid={testId ? `${testId}-swatch-${i}` : undefined}
            // Native palette clicks edit color without taking sample keyboard focus.
            // Explicit keyboard focus/activation of these buttons remains available.
            onPointerDown={e => e.preventDefault()}
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
