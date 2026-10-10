/** Native asset paths are rooted in the deployed app, not the origin. */
function appAssetUrl(url:string):string {
  return url.startsWith('/assets/') ? `${import.meta.env.BASE_URL}${url.slice(1)}` : url;
}

/**
 * Resolve an asset URL to its DPR-appropriate variant.
 * Mirrors Layout::uiImageWithPath: at devicePixelRatio >= 2, swap `foo.png` -> `foo@2x.png`.
 * Native /assets paths first resolve under the Vite deployment base.
 * Non-PNG and DPR<2 paths keep their filename.
 *
 * Note: this does NOT verify the @2x file exists on disk - the build/asset pipeline ensures it.
 * If a caller needs a graceful fallback, use `loadImage` below.
 */
export function resolveAssetUrl(url: string): string {
  url=appAssetUrl(url);
  if (!url.endsWith('.png')) return url;
  const w = (globalThis as { window?: { devicePixelRatio?: number } }).window;
  if (!w || (w.devicePixelRatio ?? 1) < 2) return url;
  return url.replace(/\.png$/, '@2x.png');
}

/**
 * `onError` handler for `<img>` tags whose `src` came from `resolveAssetUrl`.
 * If a @2x request 404s (because no @2x variant exists for that asset), this
 * silently retries the 1x URL so the image still appears.
 *
 * Usage: `<img src={resolveAssetUrl(...)} onError={dprFallbackOnError} />`
 */
export function dprFallbackOnError(e: { currentTarget: HTMLImageElement }): void {
  const el = e.currentTarget;
  if (el.src.includes('@2x.')) {
    el.src = el.src.replace('@2x.', '.');
  }
}

/**
 * Preload an image and resolve to an HTMLImageElement once decoded.
 * Tries `@2x` at DPR>=2; falls back to `1x` if `@2x` 404s.
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  const candidate = resolveAssetUrl(url);
  const fallbackUrl = appAssetUrl(url);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => {
      if (candidate !== fallbackUrl) {
        const fallback = new Image();
        fallback.onload  = () => resolve(fallback);
        fallback.onerror = () => reject(new Error(`Failed to load ${url} (and ${candidate})`));
        fallback.src = fallbackUrl;
      } else {
        reject(new Error(`Failed to load ${url}`));
      }
    };
    img.src = candidate;
  });
}
