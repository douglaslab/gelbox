import { createGlProgram } from './program';
import { type Mesh, VERTEX_STRIDE } from '../../gel/mesh';
import geometryVertSrc from '../../../shaders/geometry.vert.glsl?raw';
import geometryFragSrc from '../../../shaders/geometry.frag.glsl?raw';

export type GlBlendMode = 'additive' | 'over';

export interface GlMeshBatchTarget {
  framebuffer: WebGLFramebuffer | null; // null = default framebuffer (canvas)
  width: number;                         // drawing-buffer pixels for gl.viewport
  height: number;
}

export interface GlMeshBatchDrawOpts {
  clear: boolean;
  clearColor?: [number, number, number, number];
}

export interface GlMeshBatch {
  draw(target: GlMeshBatchTarget, mesh: Mesh, opts: GlMeshBatchDrawOpts): void;
  setViewport(width: number, height: number): void;
  destroy(): void;
}

export function createGlMeshBatch(
  gl: WebGL2RenderingContext,
  opts: { viewport: { width: number; height: number }; blend: GlBlendMode },
): GlMeshBatch {
  const prog = createGlProgram(gl, geometryVertSrc, geometryFragSrc, `meshBatch-${opts.blend}`);
  let vbo: WebGLBuffer | null = gl.createBuffer();
  let vboSize = 0;
  // Logical (CSS-pixel) coordinate space the mesh positions live in; fed to the
  // `uGelSize` vertex uniform to map positions → NDC. This is deliberately
  // independent of `target.width/height` (the drawing-buffer pixel size used for
  // gl.viewport), which is dpr-scaled. Update via setViewport on logical resize.
  let viewW = opts.viewport.width;
  let viewH = opts.viewport.height;

  function ensureVbo(byteLength: number) {
    if (vboSize >= byteLength) return;
    vboSize = Math.max(byteLength, 64 * 1024);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vboSize, gl.DYNAMIC_DRAW);
  }

  function applyBlend() {
    gl.enable(gl.BLEND);
    if (opts.blend === 'additive') {
      gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE);
    } else {
      // 'over' — premultiplied source-over.
      gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }
    gl.blendEquation(gl.FUNC_ADD);
  }

  return {
    setViewport(w, h) { viewW = w; viewH = h; },
    draw(target, mesh, { clear, clearColor }) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.viewport(0, 0, target.width, target.height);
      if (clear) {
        const c = clearColor ?? [0, 0, 0, 0];
        gl.disable(gl.BLEND);
        gl.clearColor(c[0], c[1], c[2], c[3]);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      if (mesh.vertexCount === 0) return;

      ensureVbo(mesh.data.byteLength);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, mesh.data);

      gl.useProgram(prog.program);
      gl.uniform2f(prog.uniform('uGelSize'), viewW, viewH);
      const aPos = prog.attrib('aPos');
      const aColor = prog.attrib('aColor');
      const STRIDE = VERTEX_STRIDE * 4;          // 6 floats × 4 bytes
      if (aPos >= 0)   { gl.enableVertexAttribArray(aPos);   gl.vertexAttribPointer(aPos,   2, gl.FLOAT, false, STRIDE, 0); }
      if (aColor >= 0) { gl.enableVertexAttribArray(aColor); gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, STRIDE, 8); } // color at +2 floats

      applyBlend();
      gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
      // Leave global GL state clean: BLEND is process-wide, so don't let it leak
      // to other passes that may share this context.
      gl.disable(gl.BLEND);
    },
    destroy() {
      prog.destroy();
      if (vbo) gl.deleteBuffer(vbo);
      vbo = null;
    },
  };
}
