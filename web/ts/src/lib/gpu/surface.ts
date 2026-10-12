export interface SurfaceSize {
  width: number;        // CSS px
  height: number;       // CSS px
  pixelWidth: number;   // device px = round(width * dpr)
  pixelHeight: number;  // device px
  dpr: number;
}

export interface Surface {
  canvas: HTMLCanvasElement;
  size: SurfaceSize;
  onResize(cb: (size: SurfaceSize) => void): () => void;
  dispose(): void;
}

// TODO(M3+): also observe matchMedia(`(resolution: ${dpr}dppx)`) for DPR changes
//   between monitors. ResizeObserver only catches CSS-px size changes; the
//   backbuffer will go stale on cross-monitor drag without this.
function measure(canvas: HTMLCanvasElement): SurfaceSize {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  return {
    width: rect.width,
    height: rect.height,
    pixelWidth: Math.max(1, Math.round(rect.width * dpr)),
    pixelHeight: Math.max(1, Math.round(rect.height * dpr)),
    dpr,
  };
}

export function createSurface(canvas: HTMLCanvasElement): Surface {
  let size = measure(canvas);
  canvas.width = size.pixelWidth;
  canvas.height = size.pixelHeight;
  const subs = new Set<(s: SurfaceSize) => void>();

  const ro = new ResizeObserver(() => {
    const next = measure(canvas);
    if (next.pixelWidth === size.pixelWidth && next.pixelHeight === size.pixelHeight) return;
    size = next;
    canvas.width = size.pixelWidth;
    canvas.height = size.pixelHeight;
    subs.forEach((cb) => cb(size));
  });
  ro.observe(canvas);

  return {
    canvas,
    get size() { return size; },
    onResize(cb) {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    dispose() {
      ro.disconnect();
      subs.clear();
    },
  };
}
