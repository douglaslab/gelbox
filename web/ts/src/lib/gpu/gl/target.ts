export interface GlRenderTarget {
  gl:           WebGL2RenderingContext;
  texture:      WebGLTexture;
  framebuffer:  WebGLFramebuffer;
  width:        number;
  height:       number;
  destroy():    void;
}

/**
 * Allocate a WebGL2 render target: linear RGBA8 texture + framebuffer with
 * the texture as COLOR_ATTACHMENT0. No depth/stencil — this app never needs them.
 *
 * Native GelRender uses Cinder RGBA8 targets; preserve its per-pass quantization.
 * The texture is initialized with linear filtering and clamp-to-edge, matching
 * the WebGPU sampler defaults.
 */
export function createGlRenderTarget(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  label?: string
): GlRenderTarget {
  const texture = gl.createTexture();
  if (!texture) throw new Error(`createTexture failed${label ? ` (${label})` : ''}`);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, width, height);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);

  const framebuffer = gl.createFramebuffer();
  if (!framebuffer) throw new Error(`createFramebuffer failed${label ? ` (${label})` : ''}`);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(framebuffer);
    gl.deleteTexture(texture);
    throw new Error(`framebuffer incomplete (status=0x${status.toString(16)})${label ? ` for ${label}` : ''}`);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return {
    gl, texture, framebuffer, width, height,
    destroy() {
      gl.deleteFramebuffer(framebuffer);
      gl.deleteTexture(texture);
    },
  };
}

export interface GlPingPong {
  current: GlRenderTarget;
  next:    GlRenderTarget;
  swap():  void;
  destroy(): void;
}

export function createGlPingPong(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  label?: string
): GlPingPong {
  let a = createGlRenderTarget(gl, width, height, label ? `${label}.a` : undefined);
  let b = createGlRenderTarget(gl, width, height, label ? `${label}.b` : undefined);
  return {
    get current() { return a; },
    get next()    { return b; },
    swap() { const t = a; a = b; b = t; },
    destroy() { a.destroy(); b.destroy(); },
  };
}
