export interface GlContext {
  gl: WebGL2RenderingContext;
}

/**
 * Acquire a WebGL2 context on the given canvas. Configures the drawing buffer
 * for premultiplied alpha (matches WebGPU `alphaMode: 'premultiplied'`) so the
 * canvas blit composites correctly into the page.
 *
 * Throws if WebGL2 is unavailable.
 */
export function configureGl2Context(canvas: HTMLCanvasElement): GlContext {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    preserveDrawingBuffer: false,
    desynchronized: false,
  });
  if (!gl) throw new Error('canvas.getContext("webgl2") returned null');
  return { gl };
}
