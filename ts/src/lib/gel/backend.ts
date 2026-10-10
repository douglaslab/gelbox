export type Backend = 'webgpu' | 'webgl2';

const VALID: readonly Backend[] = ['webgpu', 'webgl2'];

function isBackend(s: string | null): s is Backend {
  return s !== null && (VALID as readonly string[]).includes(s);
}

/**
 * Parse `?backend=...` from a HashRouter location hash. Returns null when no
 * `backend` query is present or the value isn't recognized.
 *
 * Examples:
 *   "#/dev"                         → null
 *   "#/dev?backend=webgl2"          → "webgl2"
 *   "#/dev?foo=bar&backend=webgpu"  → "webgpu"
 *   "#/dev?backend=metal"           → null
 */
export function parseBackendFromHash(hash: string): Backend | null {
  const q = hash.indexOf('?');
  if (q < 0) return null;
  const params = new URLSearchParams(hash.slice(q + 1));
  const v = params.get('backend');
  return isBackend(v) ? v : null;
}

export interface SelectBackendOpts {
  hash?: string;  // override window.location.hash for testing
}

/**
 * Select a backend with precedence: URL hash query > localStorage.gelBackend >
 * auto-detect (WebGPU if navigator.gpu, else WebGL2, else throw).
 *
 * Throws if no backend is available — callers should catch and render an
 * error UI explaining how to enable WebGPU or use a WebGL2-capable browser.
 */
export function selectBackend(opts: SelectBackendOpts = {}): Backend {
  const hash = opts.hash ?? (typeof window !== 'undefined' ? window.location.hash : '');
  const fromHash = parseBackendFromHash(hash);
  if (fromHash) return fromHash;

  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('gelBackend');
    if (isBackend(stored)) return stored;
  }

  if (typeof navigator !== 'undefined' && (navigator as { gpu?: unknown }).gpu) {
    return 'webgpu';
  }

  if (typeof document !== 'undefined') {
    const probe = document.createElement('canvas');
    if (probe.getContext('webgl2')) return 'webgl2';
  }

  throw new Error('No GPU backend available (neither WebGPU nor WebGL2)');
}


/**
 * Resolve the preferred backend before claiming a canvas context. WebGPU API
 * presence is only a hint: a null adapter or rejected device must still allow
 * the complete WebGL2 renderer to initialize on the untouched canvas.
 * Actual WebGL2 context/shader failures remain the caller's responsibility.
 */
export async function resolveBackend(): Promise<Backend> {
  const preferred = selectBackend();
  if (preferred === 'webgl2') return preferred;
  try {
    const { requestDevice } = await import('../gpu/device');
    await requestDevice();
    return 'webgpu';
  } catch {
    return 'webgl2';
  }
}
