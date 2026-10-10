import { useRef, type PointerEvent } from 'react';
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
  const pointer = useRef<number | null>(null);
  function pick(e: PointerEvent<HTMLDivElement>) {
    // Native pickColor uses whole cells, including their inset/gutter areas.
    const cells = e.currentTarget.querySelectorAll<HTMLButtonElement>('button');
    for (let i = 0; i < cells.length; i++) {
      const r = cells[i].getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX < r.right && e.clientY >= r.top && e.clientY < r.bottom) {
        onChange(hexToRgb(FRAGMENT_PALETTE_HEX[i]));
        return true;
      }
    }
    return false; // Leaving the palette retains the last valid color.
  }
  function endPointer(e: PointerEvent<HTMLDivElement>) {
    if (pointer.current !== e.pointerId) return;
    pointer.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }
  return (
    <div className={styles.grid} data-testid={testId}
      onPointerDown={e => {
        if (e.button !== 0 || pointer.current !== null) return;
        e.preventDefault(); // Preserve the native sample keyboard owner.
        if (!pick(e)) return;
        pointer.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={e => { if (pointer.current === e.pointerId) pick(e); }}
      onPointerUp={endPointer} onPointerCancel={endPointer}
      onLostPointerCapture={e => { if (pointer.current === e.pointerId) pointer.current = null; }}
    >
      {FRAGMENT_PALETTE_HEX.map((hex, i) => {
        const selected = i === selectedIndex;
        return (
          <button
            type="button"
            key={hex}
            className={styles.swatch}
            data-selected={selected || undefined}
            data-testid={testId ? `${testId}-swatch-${i}` : undefined}
            // Pointer edits happen on press/drag; keyboard activation has no pointer.
            onClick={e => { if (e.detail === 0) onChange(hexToRgb(hex)); }}
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
