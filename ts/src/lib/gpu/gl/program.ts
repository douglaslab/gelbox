export interface GlProgram {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  uniform(name: string): WebGLUniformLocation | null;
  attrib(name: string): number;
  destroy(): void;
}

/**
 * Compile a vertex + fragment GLSL ES 3.00 program. Prepends a uniform header
 * and any caller-supplied `#define`s. Throws with a labeled error containing
 * the shader info-log on compile/link failure.
 *
 * `defines` is an array of bare names (no `#define`); each becomes a `#define X 1`
 * line. Used by gel-passthrough.frag.glsl to switch between fs_main and fs_composite.
 */
export function createGlProgram(
  gl: WebGL2RenderingContext,
  vsSrc: string,
  fsSrc: string,
  label: string,
  defines: readonly string[] = []
): GlProgram {
  const header =
    '#version 300 es\n' +
    'precision highp float;\n' +
    defines.map((d) => `#define ${d} 1\n`).join('');

  const vs = compile(gl, gl.VERTEX_SHADER,   header + vsSrc, `${label}.vert`);
  const fs = compile(gl, gl.FRAGMENT_SHADER, header + fsSrc, `${label}.frag`);

  const program = gl.createProgram();
  if (!program) throw new Error(`createProgram returned null for ${label}`);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) || '';
    gl.deleteProgram(program);
    throw new Error(`Program link failed for ${label}: ${info}`);
  }
  // Shaders are no longer needed once the program is linked.
  gl.detachShader(program, vs); gl.detachShader(program, fs);
  gl.deleteShader(vs); gl.deleteShader(fs);

  const uniformCache = new Map<string, WebGLUniformLocation | null>();
  const attribCache  = new Map<string, number>();

  return {
    gl, program,
    uniform(name) {
      let loc = uniformCache.get(name);
      if (loc === undefined) {
        loc = gl.getUniformLocation(program, name);
        uniformCache.set(name, loc);
      }
      return loc;
    },
    attrib(name) {
      let loc = attribCache.get(name);
      if (loc === undefined) {
        loc = gl.getAttribLocation(program, name);
        attribCache.set(name, loc);
      }
      return loc;
    },
    destroy() { gl.deleteProgram(program); },
  };
}

function compile(
  gl: WebGL2RenderingContext,
  type: GLenum,
  src: string,
  label: string
): WebGLShader {
  const sh = gl.createShader(type);
  if (!sh) throw new Error(`createShader returned null for ${label}`);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(sh) || '';
    gl.deleteShader(sh);
    throw new Error(`Shader compile failed for ${label}: ${info}\n--- source ---\n${src}`);
  }
  return sh;
}
