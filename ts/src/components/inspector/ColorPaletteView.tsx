import { useLayoutEffect, useRef, type PointerEvent } from 'react';
import { FRAGMENT_PALETTE_HEX, FRAGMENT_PALETTE_RGB, nearestPaletteIndex, hexToRgb } from '../../lib/fragment/palette';
import { useSharedPresentation } from '../gel/ScenePresentation';
import { solidRoundedRect } from '../../lib/gel/fragmentWellGeometry';
import styles from './ColorPaletteView.module.css';

// Fixed native geometry can be shared by all palette instances and frames.
const swatchPaint = FRAGMENT_PALETTE_RGB.map((color, i) => {
  const x = i % 4 * 25, y = Math.floor(i / 4) * 25;
  return solidRoundedRect({x1:x+2,y1:y+2,x2:x+23,y2:y+23},4,color);
});
const selectionPaint = FRAGMENT_PALETTE_RGB.map((_, i) => {
  const x = i % 4 * 25, y = Math.floor(i / 4) * 25;
  return solidRoundedRect({x1:x-1,y1:y-1,x2:x+26,y2:y+26},4,[0,0,0]);
});

export interface ColorPaletteViewProps {
  value: readonly [number, number, number];
  onChange: (color: [number, number, number]) => void;
  testId?: string;
  presentation?: { viewKey: string; order: number };
}

/**
 * 4×3 grid of color swatches. Mirrors C++ ColorPaletteView used inside FragmentView.
 */
export function ColorPaletteView({ value, onChange, testId, presentation }: ColorPaletteViewProps) {
  const selectedIndex = nearestPaletteIndex(value);
  const registry = useSharedPresentation();
  const element = useRef<HTMLDivElement>(null);
  const selected = useRef(selectedIndex);
  selected.current = selectedIndex;
  useLayoutEffect(() => {
    if (!registry || !presentation) return;
    return registry.register(presentation.viewKey, () => {
      const el = element.current;
      if (!el) return [];
      const r = el.getBoundingClientRect();
      const transform = [1, 0, 0, 1, r.left, r.top] as const;
      // Native paints the selected background before every swatch.
      const commands = [selectionPaint[selected.current], ...swatchPaint];
      el.dataset.sharedReady = 'palette';
      return commands.map(command => ({...command, transform}));
    }, presentation.order);
  }, [registry, presentation?.viewKey, presentation?.order]);
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
    <div ref={element} className={styles.grid} data-testid={testId}
      style={registry && presentation ? {opacity:0} : undefined}
      onContextMenu={e => e.preventDefault()}
      onPointerDown={e => {
        if (pointer.current !== null) return;
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
