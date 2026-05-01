/**
 * Resolve an asset URL to its DPR-appropriate variant.
 * Mirrors Layout::uiImageWithPath: at devicePixelRatio >= 2, swap `foo.png` -> `foo@2x.png`.
 * Returns the URL unchanged for non-`.png` paths or when DPR < 2 or `window` is undefined (SSR/node).
 *
 * Note: this does NOT verify the @2x file exists on disk - the build/asset pipeline ensures it.
 * If a caller needs a graceful fallback, use `loadImage` below.
 */
export function resolveAssetUrl(url: string): string {
  if (!url.endsWith('.png')) return url;
  const w = (globalThis as { window?: { devicePixelRatio?: number } }).window;
  if (!w || (w.devicePixelRatio ?? 1) < 2) return url;
  return url.replace(/\.png$/, '@2x.png');
}

/**
 * Preload an image and resolve to an HTMLImageElement once decoded.
 * Tries `@2x` at DPR>=2; falls back to `1x` if `@2x` 404s.
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  const candidate = resolveAssetUrl(url);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => {
      if (candidate !== url) {
        const fallback = new Image();
        fallback.onload  = () => resolve(fallback);
        fallback.onerror = () => reject(new Error(`Failed to load ${url} (and ${candidate})`));
        fallback.src = url;
      } else {
        reject(new Error(`Failed to load ${url}`));
      }
    };
    img.src = candidate;
  });
}
