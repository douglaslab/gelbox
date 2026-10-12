export interface GlQuad {
  gl:        WebGL2RenderingContext;
  buffer:    WebGLBuffer;
  destroy(): void;
}

const QUAD_DATA = new Float32Array([
  // x, y, u, v   (triangle strip — 0,0 → 1,0 → 0,1 → 1,1)
  0, 0, 0, 0,
  1, 0, 1, 0,
  0, 1, 0, 1,
  1, 1, 1, 1,
]);

export function createGlQuad(gl: WebGL2RenderingContext): GlQuad {
  const buffer = gl.createBuffer();
  if (!buffer) throw new Error('createBuffer failed for fullscreen-quad');
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, QUAD_DATA, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return {
    gl, buffer,
    destroy() { gl.deleteBuffer(buffer); },
  };
}

/**
 * Bind the quad VBO and set up vertex attributes for a program that uses
 * `aPos` (vec2) and (optionally) `aTexCoord` (vec2) attribute names. Call
 * before `gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)`.
 *
 * Pass -1 for texAttrib if the program doesn't have aTexCoord.
 */
export function bindQuadAttribs(
  gl: WebGL2RenderingContext,
  buffer: WebGLBuffer,
  posAttrib: number,
  texAttrib: number = -1
): void {
  const STRIDE = 4 * 4;  // 4 floats × 4 bytes
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  if (posAttrib >= 0) {
    gl.enableVertexAttribArray(posAttrib);
    gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, STRIDE, 0);
  }
  if (texAttrib >= 0) {
    gl.enableVertexAttribArray(texAttrib);
    gl.vertexAttribPointer(texAttrib, 2, gl.FLOAT, false, STRIDE, 8);
  }
}
