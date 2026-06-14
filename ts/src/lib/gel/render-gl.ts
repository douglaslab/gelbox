import { createGlPingPong, type GlRenderTarget } from '../gpu/gl/target';
import { createGlProgram } from '../gpu/gl/program';
import { createGlQuad, bindQuadAttribs } from '../gpu/gl/quad';
import { createGlMeshBatch } from '../gpu/gl/meshBatch';
import { buildSmearMesh } from './smear';
import { buildBodyMesh }  from './body';
import { buildFlamesMesh } from './flames';
import { buildSmileWarp } from './smile';
import { buildWellDamageWarp } from './welldamage';
import { buildOvercookWarp } from './overcook';
import { GEL_RENDER_TUNING } from '../../data/tuning';
import type { Band } from '../sim/band';
import type { Mesh } from './mesh';
import { VERTEX_STRIDE } from './mesh';
import type { GlobalWarp } from '../sim/globalWarp';
import { NO_GLOBAL_WARP } from '../sim/globalWarp';
import type { WarpTextureCpu } from './warpTexture';

import passthroughVertSrc from '../../shaders/passthrough.vert.glsl?raw';
import warpFragSrc        from '../../shaders/warp.frag.glsl?raw';
import blur5FragSrc       from '../../shaders/blur5.frag.glsl?raw';
import blur9FragSrc       from '../../shaders/blur9.frag.glsl?raw';
import blur13FragSrc      from '../../shaders/blur13.frag.glsl?raw';
import gelPassthroughSrc  from '../../shaders/gel-passthrough.frag.glsl?raw';

export interface GlGelRenderer {
  setBands(bands: Band[]): void;
  setGlobalWarp(w: GlobalWarp): void;
  render(): void;
  readonly output: GlRenderTarget;
  destroy(): void;
}

export function createGlGelRenderer(
  gl: WebGL2RenderingContext,
  gelSize: { width: number; height: number },
  pixelsPerUnit: number
): GlGelRenderer {
  const outputW = Math.round(gelSize.width  * pixelsPerUnit);
  const outputH = Math.round(gelSize.height * pixelsPerUnit);

  const band      = createGlPingPong(gl, outputW, outputH, 'band');
  const composite = createGlPingPong(gl, outputW, outputH, 'composite');

  const quad = createGlQuad(gl);

  // Programs (compiled once, reused across passes).
  const progWarp    = createGlProgram(gl, passthroughVertSrc, warpFragSrc,        'warp');
  const progBlur5   = createGlProgram(gl, passthroughVertSrc, blur5FragSrc,       'blur5');
  const progBlur9   = createGlProgram(gl, passthroughVertSrc, blur9FragSrc,       'blur9');
  const progBlur13  = createGlProgram(gl, passthroughVertSrc, blur13FragSrc,      'blur13');
  const progComp    = createGlProgram(gl, passthroughVertSrc, gelPassthroughSrc,  'composite', ['GEL_COMPOSITE']);
  // Geometry batch — owns the shader + VBO for band primitive drawing.
  const geomBatch = createGlMeshBatch(gl, { viewport: gelSize, blend: 'additive' });

  // Warp textures (1D and 2D), grown on demand. Same split-cache pattern as the
  // WebGPU warp pass to avoid mid-frame destroys.
  let warpTex1D: WebGLTexture | null = null;
  let warpTex1DW = 0;
  let warpTex2D: WebGLTexture | null = null;
  let warpTex2DW = 0;
  let warpTex2DH = 0;
  function ensureWarpTex(width: number, height: number): WebGLTexture {
    if (height === 1) {
      if (warpTex1D && warpTex1DW === width) return warpTex1D;
      if (warpTex1D) gl.deleteTexture(warpTex1D);
      warpTex1DW = width;
      warpTex1D = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, warpTex1D);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, width, 1);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return warpTex1D!;
    } else {
      if (warpTex2D && warpTex2DW === width && warpTex2DH === height) return warpTex2D;
      if (warpTex2D) gl.deleteTexture(warpTex2D);
      warpTex2DW = width;
      warpTex2DH = height;
      warpTex2D = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, warpTex2D);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, width, height);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return warpTex2D!;
    }
  }

  let bands: Band[] = [];
  let globalWarp: GlobalWarp = NO_GLOBAL_WARP;
  let overcookMemo: { gw: GlobalWarp; warp: ReturnType<typeof buildOvercookWarp> } | null = null;

  function withFaint(b: Band, s: number): Band {
    if (s === 1) return b;
    return {
      ...b,
      brightness: b.brightness * s,
      smearBrightnessAbove: [b.smearBrightnessAbove[0] * s, b.smearBrightnessAbove[1] * s],
      smearBrightnessBelow: [b.smearBrightnessBelow[0] * s, b.smearBrightnessBelow[1] * s],
    };
  }

  function combine(meshes: Mesh[]): Mesh {
    let total = 0;
    for (const m of meshes) total += m.data.length;
    const data = new Float32Array(total);
    let off = 0;
    for (const m of meshes) { data.set(m.data, off); off += m.data.length; }
    return { data, vertexCount: total / VERTEX_STRIDE };
  }

  function clearTarget(target: GlRenderTarget) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.viewport(0, 0, target.width, target.height);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  function drawGeometry(target: GlRenderTarget, b: Band) {
    const mesh = combine([buildSmearMesh(b), buildBodyMesh(b), buildFlamesMesh(b)]);
    geomBatch.draw(
      { framebuffer: target.framebuffer, width: target.width, height: target.height },
      mesh,
      { clear: true, clearColor: [0, 0, 0, 1] },
    );
  }

  function runWarp(target: ReturnType<typeof createGlPingPong>, warp: WarpTextureCpu) {
    // Upload CPU warp data into managed warp texture (1D or 2D).
    const tex = ensureWarpTex(warp.width, warp.height);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, warp.width, warp.height, gl.RGBA, gl.UNSIGNED_BYTE, warp.data);

    // Render to target.next using target.current as input.
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.next.framebuffer);
    gl.viewport(0, 0, target.next.width, target.next.height);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(progWarp.program);

    // uTex0 = source, uTexWarp = control
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, target.current.texture);
    gl.uniform1i(progWarp.uniform('uTex0'), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(progWarp.uniform('uTexWarp'), 1);

    gl.uniform2f(progWarp.uniform('uWarpScale'), warp.scale[0], warp.scale[1]);

    // Passthrough vertex uniforms. The (1, -1) scale on the texcoord flips V so
    // the warp shader's sample row aligns with the destination FBO row. The
    // vertex shader does clipY = 1 - 2*aPos.y; in WebGL2's FBO storage,
    // clipY=+1 lands at texel-row H-1 while texCoord.y=0 reads texel-row 0 —
    // so without the flip, sampling at vTexCoord.y reads from the OPPOSITE
    // end of the texture from where this fragment is being written, producing
    // a vertically-mirrored warp output. This was visible only when an odd
    // number of warps ran in sequence (sim-ladder = 1 smile/band; multi-band
    // overcook on composite = 1 warp). Single-band ran 2 warps (smile+wd),
    // canceling the flip — which is why the bug stayed latent through M4.
    gl.uniform2f(progWarp.uniform('uPositionOffset'), 0, 0);
    gl.uniform2f(progWarp.uniform('uPositionScale'),  gelSize.width, gelSize.height);
    gl.uniform2f(progWarp.uniform('uTexCoordOffset'), 0, 1);
    gl.uniform2f(progWarp.uniform('uTexCoordScale'),  1, -1);
    gl.uniform2f(progWarp.uniform('uGelSize'),        gelSize.width, gelSize.height);

    bindQuadAttribs(gl, quad.buffer, progWarp.attrib('aPos'), progWarp.attrib('aTexCoord'));

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    target.swap();
  }

  function runBlur(target: ReturnType<typeof createGlPingPong>, distance: number) {
    let steps = Math.floor(distance);
    while (steps > 0) {
      const kernel = Math.min(steps, 3);  // 1, 2, or 3
      const prog = kernel === 1 ? progBlur5 : kernel === 2 ? progBlur9 : progBlur13;
      for (let dir = 0; dir < 2; dir++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.next.framebuffer);
        gl.viewport(0, 0, target.next.width, target.next.height);
        gl.disable(gl.BLEND);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(prog.program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, target.current.texture);
        gl.uniform1i(prog.uniform('uTex0'), 0);

        gl.uniform2f(prog.uniform('uResolution'), gelSize.width, gelSize.height);
        gl.uniform2f(prog.uniform('uDirection'), dir === 0 ? 1 : 0, dir === 0 ? 0 : 1);

        // Passthrough vertex uniforms
        gl.uniform2f(prog.uniform('uPositionOffset'), 0, 0);
        gl.uniform2f(prog.uniform('uPositionScale'),  gelSize.width, gelSize.height);
        gl.uniform2f(prog.uniform('uTexCoordOffset'), 0, 0);
        gl.uniform2f(prog.uniform('uTexCoordScale'),  1, 1);
        gl.uniform2f(prog.uniform('uGelSize'),        gelSize.width, gelSize.height);

        bindQuadAttribs(gl, quad.buffer, prog.attrib('aPos'), prog.attrib('aTexCoord'));

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        target.swap();
      }
      steps -= kernel;
    }
  }

  function drawComposite(src: GlRenderTarget, dst: GlRenderTarget, color: [number, number, number], clear: boolean) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.framebuffer);
    gl.viewport(0, 0, dst.width, dst.height);

    if (clear) {
      gl.disable(gl.BLEND);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    gl.useProgram(progComp.program);

    // Bind src texture as sampler2D uTex0 at TEXTURE_UNIT_0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src.texture);
    gl.uniform1i(progComp.uniform('uTex0'), 0);
    gl.uniform3f(progComp.uniform('uTint'), color[0], color[1], color[2]);

    // Set passthrough vertex uniforms — full-screen quad mapped 1:1 to dst pixel space.
    gl.uniform2f(progComp.uniform('uPositionOffset'), 0, 0);
    gl.uniform2f(progComp.uniform('uPositionScale'),  gelSize.width, gelSize.height);
    gl.uniform2f(progComp.uniform('uTexCoordOffset'), 0, 0);
    gl.uniform2f(progComp.uniform('uTexCoordScale'),  1, 1);
    gl.uniform2f(progComp.uniform('uGelSize'),        gelSize.width, gelSize.height);

    bindQuadAttribs(gl, quad.buffer, progComp.attrib('aPos'), progComp.attrib('aTexCoord'));

    // Premultiplied additive (matches WebGPU composite blend)
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE);
    gl.blendEquation(gl.FUNC_ADD);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function render() {
    const brightScale = globalWarp.h2oDistort
      ? GEL_RENDER_TUNING.h2oDistort.faint
      : 1;

    bands.forEach((rawBand, i) => {
      const b = withFaint(rawBand, brightScale);
      drawGeometry(band.current, b);

      const smile = buildSmileWarp({
        x1: b.rect.x1, x2: b.rect.x2,
        smileHeight: b.smileHeight, smileExp: b.smileExp,
      }, gelSize);
      if (smile) runWarp(band, smile);

      const wd = buildWellDamageWarp({
        rect: b.rect, wellDamage: b.wellDamage,
        wellDamageRandSeed: b.wellDamageRandSeed,
      }, gelSize);
      if (wd) runWarp(band, wd);

      if (b.blur > 0) runBlur(band, b.blur * pixelsPerUnit);

      drawComposite(band.current, composite.current, b.color, /*clear*/ i === 0);
    });

    if (bands.length === 0) clearTarget(composite.current);

    if (!overcookMemo || overcookMemo.gw !== globalWarp) {
      overcookMemo = { gw: globalWarp, warp: buildOvercookWarp(globalWarp, gelSize, pixelsPerUnit) };
    }
    const overcook = overcookMemo.warp;
    if (overcook) runWarp(composite, overcook);
  }

  return {
    setBands(b)        { bands = b; },
    setGlobalWarp(w)   { globalWarp = w; overcookMemo = null; },
    render,
    get output()       { return composite.current; },
    destroy() {
      geomBatch.destroy();
      progWarp.destroy();
      progBlur5.destroy();
      progBlur9.destroy();
      progBlur13.destroy();
      progComp.destroy();
      quad.destroy();
      band.destroy();
      composite.destroy();
      if (warpTex1D) gl.deleteTexture(warpTex1D);
      if (warpTex2D) gl.deleteTexture(warpTex2D);
    },
  };
}
