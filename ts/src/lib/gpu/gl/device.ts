import { configureGl2Context, type GlContext } from './context';

export interface Gl2DeviceBundle extends GlContext {}

/**
 * Probes WebGL2 availability by attempting to create a context on a throwaway
 * canvas. Returns the live context anchored to that probe canvas — callers
 * should NOT use it for real rendering. Use configureGl2Context with the real
 * canvas instead.
 *
 * This mirrors WebGPU's `requestDevice()` shape so callers can do a try/catch
 * capability check before mounting their canvas.
 */
export async function requestGl2Device(): Promise<Gl2DeviceBundle> {
  if (typeof document === 'undefined') {
    throw new Error('WebGL2 not available (no document)');
  }
  const probe = document.createElement('canvas');
  return configureGl2Context(probe);
}
