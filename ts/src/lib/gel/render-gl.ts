import { createGlPingPong, type GlRenderTarget } from '../gpu/gl/target';
import { createGlProgram } from '../gpu/gl/program';
import { createGlQuad, bindQuadAttribs } from '../gpu/gl/quad';
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

import passthroughVertSrc from '../../shaders/passthrough.vert.glsl?raw';
import geometryVertSrc    from '../../shaders/geometry.vert.glsl?raw';
import geometryFragSrc    from '../../shaders/geometry.frag.glsl?raw';
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
  const progGeom    = createGlProgram(gl, geometryVertSrc,    geometryFragSrc,    'geometry');
  const progWarp    = createGlProgram(gl, passthroughVertSrc, warpFragSrc,        'warp');
  const progBlur5   = createGlProgram(gl, passthroughVertSrc, blur5FragSrc,       'blur5');
  const progBlur9   = createGlProgram(gl, passthroughVertSrc, blur9FragSrc,       'blur9');
  const progBlur13  = createGlProgram(gl, passthroughVertSrc, blur13FragSrc,      'blur13');
  const progComp    = createGlProgram(gl, passthroughVertSrc, gelPassthroughSrc,  'composite', ['GEL_COMPOSITE']);
  // Geometry pass needs a vertex buffer for primitives (grows on demand).
  let geomVbo: WebGLBuffer | null = gl.createBuffer();
  let geomVboSize = 0;
  function ensureGeomVbo(byteLength: number) {
    if (geomVboSize >= byteLength) return;
    geomVboSize = Math.max(byteLength, 64 * 1024);
    gl.bindBuffer(gl.ARRAY_BUFFER, geomVbo);
    gl.bufferData(gl.ARRAY_BUFFER, geomVboSize, gl.DYNAMIC_DRAW);
  }

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

    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.viewport(0, 0, target.width, target.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (mesh.vertexCount === 0) return;

    ensureGeomVbo(mesh.data.byteLength);
    gl.bindBuffer(gl.ARRAY_BUFFER, geomVbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, mesh.data);

    gl.useProgram(progGeom.program);
    gl.uniform2f(progGeom.uniform('uGelSize'), gelSize.width, gelSize.height);

    const aPos   = progGeom.attrib('aPos');
    const aColor = progGeom.attrib('aColor');
    const STRIDE = VERTEX_STRIDE * 4;  // 6 floats × 4 bytes = 24 bytes
    if (aPos >= 0)   { gl.enableVertexAttribArray(aPos);   gl.vertexAttribPointer(aPos,   2, gl.FLOAT, false, STRIDE, 0); }
    if (aColor >= 0) { gl.enableVertexAttribArray(aColor); gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, STRIDE, 8); }

    // Premultiplied additive (matches WebGPU primitives blend)
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE);
    gl.blendEquation(gl.FUNC_ADD);

    gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
  }

  function render() {
    const brightScale = globalWarp.h2oDistort
      ? GEL_RENDER_TUNING.h2oDistort.faint
      : 1;

    // Tasks 8-10 will use these helpers; reference them to satisfy noUnusedLocals.
    void bindQuadAttribs;
    void buildSmileWarp;
    void buildWellDamageWarp;
    void buildOvercookWarp;
    void ensureWarpTex;

    bands.forEach((rawBand, i) => {
      const b = withFaint(rawBand, brightScale);
      drawGeometry(band.current, b);

      // (Tasks 8-10 will add: smile/wd warp, blur, composite.)
      // For now, copy band.current into composite.current so the canvas blit shows something.
      if (i === 0) clearTarget(composite.current);
      drawCompositeStub(band.current, composite.current);
    });

    if (bands.length === 0) clearTarget(composite.current);

    // (Task 10 will add: overcook on composite ping-pong.)
  }

  // STUB — replaced in Task 8 with the real composite pass.
  function drawCompositeStub(_src: GlRenderTarget, _dst: GlRenderTarget) {
    // Intentionally empty for the geometry-only scaffold. The first band's
    // geometry-output stays in band.current; downstream the canvas blit will
    // sample band.current via output. This stub is REPLACED in Task 8.
  }

  return {
    setBands(b)        { bands = b; },
    setGlobalWarp(w)   { globalWarp = w; },
    render,
    // For Task 7 only, expose band.current as the "output" so the dev page
    // can blit something non-empty. Task 8 will switch to composite.current.
    get output()       { return band.current; },
    destroy() {
      progGeom.destroy();
      progWarp.destroy();
      progBlur5.destroy();
      progBlur9.destroy();
      progBlur13.destroy();
      progComp.destroy();
      quad.destroy();
      band.destroy();
      composite.destroy();
      if (geomVbo) gl.deleteBuffer(geomVbo);
      if (warpTex1D) gl.deleteTexture(warpTex1D);
      if (warpTex2D) gl.deleteTexture(warpTex2D);
    },
  };
}
