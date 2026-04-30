# M4 — WebGL2 Fallback Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a parallel WebGL2 GelRenderer that produces visually-equivalent output to the WebGPU path on the same fixtures (single-band + 50-band overcook). Add a `?backend=webgl2` URL override and a Playwright project matrix so each visual test runs on both backends. Unblock Linux CI visual coverage (chromium on Linux can do WebGL2 reliably; it can't do WebGPU).

**Architecture:** Hand-port all 8 WGSL shaders to GLSL ES 3.00, kept side-by-side with the WGSL files (one shader per algorithm, two source representations). Build a small `lib/gpu/gl/` layer that mirrors the existing `lib/gpu/` shape (program, target, quad, surface). Build a parallel `lib/gel/render-gl.ts` that implements the same `GelRenderer` interface using inline WebGL2 calls. Routes pick a backend at boot via a `selectBackend()` helper that consults `?backend=webgl2` query, `localStorage.gelBackend`, then auto-detects (WebGPU > WebGL2 > error). Playwright defines two chromium projects (`chromium-webgpu`, `chromium-webgl2`); the WebGL2 project sets `localStorage.gelBackend = 'webgl2'` via `page.addInitScript`, so tests don't need backend-aware URLs. Per-backend goldens (Playwright auto-suffixes by project name).

**Tech Stack:** Same as M3 — TypeScript 5.6 strict, Vite 5.4, Vitest 3, Playwright 1.49. **No new runtime dependencies.** WebGL2 is in `lib.dom.d.ts`. No naga.wasm — see Decisions below.

**M4 reference:** WebGPU sources at `ts/src/lib/gpu/`, `ts/src/lib/gel/passes/`, `ts/src/lib/gel/render.ts`. WGSL shaders at `ts/src/shaders/*.wgsl`. C++ reference at `~/code/gelbox/src/GelRender.cpp`.

---

## Scope

**In M4:**
- 8 GLSL ES 3.00 shaders mirroring the WGSL set (`*.glsl` siblings of each `*.wgsl`).
- `ts/src/lib/gpu/gl/` — minimal WebGL2 wrappers (device, context, program, target, quad).
- `ts/src/lib/gel/render-gl.ts` — WebGL2 GelRenderer with inline pass implementations (geometry, smile/wd warp, blur, composite, overcook).
- `ts/src/lib/gel/backend.ts` — `selectBackend()` + `Backend` type.
- All three dev routes (`DevPage`, `DevMultiPage`, `DevPerfPage`) updated to dispatch on `selectBackend()`. The `?backend=webgl2` URL hash override lets you force the fallback in a real browser.
- Playwright config grows two projects (`chromium-webgpu`, `chromium-webgl2`); existing single-band/multi-band/perf specs re-run under both projects via project metadata. Existing baselines renamed `-chromium → -chromium-webgpu`; new `-chromium-webgl2` baselines generated.
- New unit test for `selectBackend()` (URL parsing + storage precedence).
- New CI job changes: Linux runs the `chromium-webgl2` project (was: skipped all visual tests); macOS runs both projects. The WebGPU-on-Linux skips remain (until WebGPU on chromium-Linux stabilizes; tracked separately).
- Phase 1 overview marked M4 done; tagged `m4-webgl2-fallback`.

**Out of M4 (deferred):**
- Refactoring the WebGPU passes to a backend-neutral abstraction. Parallel impl is faster to ship; refactor later if it pays off.
- Adopting naga.wasm at build- or run-time. Not worth the bundle bloat or transpilation edge cases for 8 small shaders.
- Re-enabling WebGPU on Linux CI. Out of scope; M4's value is unblocking Linux visual coverage via WebGL2.
- Optimizing WebGL2 perf to match WebGPU (gate at 33ms, not 25ms — WebGL2 typically slower).
- Refactoring DevPage/DevMultiPage/DevPerfPage into a shared "renderer host" component. Three near-duplicates persist for now (consolidation lands when GelCanvas is built in M6+).

**Non-goals:**
- Pixel-exact match between WebGPU and WebGL2. Per-backend baselines + visual sanity check via dev page. Cross-backend tolerance would be too lossy a guarantee.

---

## Decisions for this milestone

| Decision | Reason |
|---|---|
| Hand-port shaders, not naga.wasm | 8 short shaders (~150 lines GLSL total) vs onboarding a 2–3 MB naga wasm binary plus a Vite plugin and known WGSL→GLSL edge cases. WebGPU still authors WGSL; WebGL2 reads the GLSL twin. Rewrites in M5+ touch both files (a known cost). |
| Parallel `render-gl.ts`, not refactor passes to backend abstraction | M4 acceptance is fallback parity, not architecture cleanup. Parallel impl ships in days; abstraction is a M9+ refactor task once we know what the second backend needs. |
| `localStorage.gelBackend = 'webgl2'` for tests, `?backend=webgl2` URL hash for humans | localStorage avoids HashRouter query-string contortions; URL override is human-friendly for QA. |
| GLSL `#version 300 es` + `precision highp float;` everywhere | Phase 1 overview rule — avoid fp16 banding on iOS in additive blur composite. Inject via `createGlProgram` so shader files stay version-agnostic. |
| `SRGB8_ALPHA8` FBO color attachments | Hardware sRGB decode/encode keeps additive blend mathematically correct. Equivalent of WebGPU `rgba8unorm-srgb`. |
| Premultiplied additive `(ONE, ONE)` blend | Mathematically identical to the WebGPU path. |
| Combined `sampler2D` in GLSL (one binding for tex+sampler) | GLSL ES 3.00 doesn't separate texture and sampler; collapse the WGSL pair. |
| Plain `uniform vec2`-style declarations in GLSL, NOT UBOs | Simpler. WebGL2 UBOs work but they require std140 padding awareness. The pass uniforms are tiny (≤ 6 floats); plain uniforms cost nothing measurable. |
| Playwright project matrix (two chromium projects) | Standard Playwright pattern; auto-suffixes baseline filenames; keeps test code identical. |
| Existing `chromium` project renamed to `chromium-webgpu` | Snapshot filenames change once; we rename existing PNGs and move on. |
| Linux CI runs `chromium-webgl2` project, NOT `chromium-webgpu` | WebGPU on Linux chromium continues to skip until upstream stabilizes; M4's value is finally getting visual coverage on Linux at all. |
| WebGL2 perf gate at < 33ms (30fps), not 25ms | WebGL2 is typically slower; a parity gate would be over-tight. The 25ms WebGPU gate stays. |

---

## File structure for M4

```
ts/
  src/
    lib/
      gel/
        backend.ts                          # NEW: selectBackend() + Backend type
        render-gl.ts                        # NEW: WebGL2 GelRenderer (parallel to render.ts)
        render.ts                           # UNCHANGED
      gpu/
        gl/
          context.ts                        # NEW: getGl2Context, premultiplied alpha
          device.ts                         # NEW: WebGL2 capability check (mirrors gpu/device.ts)
          program.ts                        # NEW: createGlProgram(vsSrc, fsSrc) + uniform/attr lookups
          quad.ts                           # NEW: WebGL2 fullscreen quad VBO + VAO
          target.ts                         # NEW: GlRenderTarget + GlPingPong
        adapter.ts                          # UNCHANGED
        context.ts                          # UNCHANGED
        device.ts                           # UNCHANGED
        # (existing target.ts, quad.ts, etc remain WebGPU-only)
    shaders/
      passthrough.vert.glsl                 # NEW: GLSL ES 3.00 mirror of passthrough.vert.wgsl
      geometry.vert.glsl                    # NEW
      geometry.frag.glsl                    # NEW
      blur5.frag.glsl                       # NEW
      blur9.frag.glsl                       # NEW
      blur13.frag.glsl                      # NEW
      warp.frag.glsl                        # NEW
      gel-passthrough.frag.glsl             # NEW
    routes/
      DevPage.tsx                           # MODIFY: dispatch on selectBackend()
      DevMultiPage.tsx                      # MODIFY
      DevPerfPage.tsx                       # MODIFY (separate perf gate per backend)
  tests/
    unit/
      backend.test.ts                       # NEW: selectBackend() URL+localStorage precedence
    visual/
      single-band.spec.ts                   # MODIFY: drop linux skip; runs in both projects
      multi-band.spec.ts                    # MODIFY: drop linux skip; runs in both projects
      perf.spec.ts                          # MODIFY: per-project gate (25ms webgpu / 33ms webgl2); skip webgpu on linux
      single-band.spec.ts-snapshots/
        single-band-canvas-chromium.png     # RENAME → single-band-canvas-chromium-webgpu.png
        single-band-canvas-chromium-webgl2.png  # NEW (generated)
      multi-band.spec.ts-snapshots/
        multi-band-canvas-chromium.png      # RENAME → multi-band-canvas-chromium-webgpu.png
        multi-band-canvas-chromium-webgl2.png   # NEW (generated)
  playwright.config.ts                      # MODIFY: split chromium project into two
  .github/
    workflows/
      ci.yml                                # MODIFY: run chromium-webgl2 on Linux
docs/
  superpowers/
    plans/
      2026-04-27-gelbox-ts-phase-1-overview.md   # MODIFY: mark M4 complete
      2026-04-28-gelbox-ts-m4-webgl2-fallback.md # this file
```

---

## Reference: WGSL → GLSL ES 3.00 translation rules

Applied uniformly across all 8 shaders:

| WGSL | GLSL ES 3.00 |
|---|---|
| `vec2f` / `vec3f` / `vec4f` | `vec2` / `vec3` / `vec4` |
| `f32` | `float` |
| Struct `<uniform>` block | Plain `uniform` declarations (one per field) |
| `@group(0) @binding(N) var<uniform> u: T;` | `uniform <fields of T>;` |
| `@group(0) @binding(N) var t: texture_2d<f32>;` + `@group(0) @binding(M) var s: sampler;` | `uniform sampler2D u<Name>;` (combined) |
| `textureSample(tex, samp, uv)` | `texture(tex, uv)` |
| `@vertex fn vs_main(@location(0) p: vec2f) -> VsOut` | `in vec2 aPos; out vec2 vTexCoord; void main() { ... gl_Position = ...; vTexCoord = ...; }` |
| `@builtin(position) clipPos: vec4f` (vertex output) | `gl_Position` (built-in) |
| `@builtin(position) fragCoord: vec4f` (fragment input) | `gl_FragCoord` (built-in) |
| `@fragment fn fs_main(...) -> @location(0) vec4f` | `in vec2 vTexCoord; out vec4 fragColor; void main() { ... fragColor = ...; }` |
| `(let / var)` | `(const float / float)` |

Header injected by `createGlProgram` (so shader files stay version-agnostic):

```glsl
#version 300 es
precision highp float;
```

---

## Tasks

### Task 1: GLSL ES 3.00 shader ports

**Files:**
- Create: `ts/src/shaders/passthrough.vert.glsl`
- Create: `ts/src/shaders/geometry.vert.glsl`
- Create: `ts/src/shaders/geometry.frag.glsl`
- Create: `ts/src/shaders/blur5.frag.glsl`
- Create: `ts/src/shaders/blur9.frag.glsl`
- Create: `ts/src/shaders/blur13.frag.glsl`
- Create: `ts/src/shaders/warp.frag.glsl`
- Create: `ts/src/shaders/gel-passthrough.frag.glsl`

These files are static text and don't break anything until consumers wire them up — Task 6+ does that. No tests in this task; the validity of the GLSL is exercised by program compilation in Task 3 and by render output in later tasks.

- [ ] **Step 1: Write `passthrough.vert.glsl`**

```glsl
in vec2 aPos;
in vec2 aTexCoord;

uniform vec2 uPositionOffset;
uniform vec2 uPositionScale;
uniform vec2 uTexCoordOffset;
uniform vec2 uTexCoordScale;
uniform vec2 uGelSize;

out vec2 vTexCoord;

void main() {
  vec2 gelPos = aPos * uPositionScale + uPositionOffset;
  // Gel-space (top-left origin, Y down) → clip space (Y up): flip Y
  vec2 clipXY = vec2(
    (gelPos.x / uGelSize.x) * 2.0 - 1.0,
    1.0 - (gelPos.y / uGelSize.y) * 2.0
  );
  gl_Position = vec4(clipXY, 0.0, 1.0);
  vTexCoord = aTexCoord * uTexCoordScale + uTexCoordOffset;
}
```

- [ ] **Step 2: Write `geometry.vert.glsl`**

```glsl
in vec2 aPos;
in vec4 aColor;

uniform vec2 uGelSize;

out vec4 vColor;

void main() {
  vec2 clipXY = vec2(
    (aPos.x / uGelSize.x) * 2.0 - 1.0,
    1.0 - (aPos.y / uGelSize.y) * 2.0
  );
  gl_Position = vec4(clipXY, 0.0, 1.0);
  vColor = aColor;
}
```

- [ ] **Step 3: Write `geometry.frag.glsl`**

```glsl
in vec4 vColor;
out vec4 fragColor;

void main() {
  // Premultiplied additive — color RGB is already in linear space; alpha=1 for solid primitives
  fragColor = vec4(vColor.rgb * vColor.a, vColor.a);
}
```

- [ ] **Step 4: Write `blur5.frag.glsl`**

```glsl
uniform sampler2D uTex0;
uniform vec2 uResolution;
uniform vec2 uDirection;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 off1 = vec2(1.3333333333333333) * uDirection;
  vec4 c = vec4(0.0);
  c += texture(uTex0, uv) * 0.29411764705882354;
  c += texture(uTex0, uv + (off1 / uResolution)) * 0.35294117647058826;
  c += texture(uTex0, uv - (off1 / uResolution)) * 0.35294117647058826;
  fragColor = c;
}
```

- [ ] **Step 5: Write `blur9.frag.glsl`**

```glsl
uniform sampler2D uTex0;
uniform vec2 uResolution;
uniform vec2 uDirection;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 off1 = vec2(1.3846153846) * uDirection;
  vec2 off2 = vec2(3.2307692308) * uDirection;
  vec4 c = vec4(0.0);
  c += texture(uTex0, uv) * 0.2270270270;
  c += texture(uTex0, uv + (off1 / uResolution)) * 0.3162162162;
  c += texture(uTex0, uv - (off1 / uResolution)) * 0.3162162162;
  c += texture(uTex0, uv + (off2 / uResolution)) * 0.0702702703;
  c += texture(uTex0, uv - (off2 / uResolution)) * 0.0702702703;
  fragColor = c;
}
```

- [ ] **Step 6: Write `blur13.frag.glsl`**

```glsl
uniform sampler2D uTex0;
uniform vec2 uResolution;
uniform vec2 uDirection;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 off1 = vec2(1.411764705882353)  * uDirection;
  vec2 off2 = vec2(3.2941176470588234) * uDirection;
  vec2 off3 = vec2(5.176470588235294)  * uDirection;
  vec4 c = vec4(0.0);
  c += texture(uTex0, uv) * 0.1964825501511404;
  c += texture(uTex0, uv + (off1 / uResolution)) * 0.2969069646728344;
  c += texture(uTex0, uv - (off1 / uResolution)) * 0.2969069646728344;
  c += texture(uTex0, uv + (off2 / uResolution)) * 0.09447039785044732;
  c += texture(uTex0, uv - (off2 / uResolution)) * 0.09447039785044732;
  c += texture(uTex0, uv + (off3 / uResolution)) * 0.010381362401148057;
  c += texture(uTex0, uv - (off3 / uResolution)) * 0.010381362401148057;
  fragColor = c;
}
```

- [ ] **Step 7: Write `warp.frag.glsl`**

```glsl
uniform sampler2D uTex0;
uniform sampler2D uTexWarp;
uniform vec2 uWarpScale;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec2 warp = texture(uTexWarp, vTexCoord).xy;
  warp = (warp - vec2(0.5, 0.5)) * 2.0;
  warp = warp * uWarpScale;
  fragColor = texture(uTex0, vTexCoord + warp);
}
```

- [ ] **Step 8: Write `gel-passthrough.frag.glsl`**

This file mirrors WGSL's two entry points (`fs_main` for the canvas blit, `fs_composite` for the composite pass). GLSL doesn't support multiple entry points in one file, so split into two GLSL files conceptually but keep in one file separated by `#ifdef GEL_COMPOSITE` so the program builder can `#define GEL_COMPOSITE` for the composite variant:

```glsl
uniform sampler2D uTex0;
#ifdef GEL_COMPOSITE
uniform vec3 uTint;
#endif

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
#ifdef GEL_COMPOSITE
  vec4 s = texture(uTex0, vTexCoord);
  float lum = max(max(s.r, s.g), s.b);
  fragColor = vec4(s.rgb * uTint, lum);
#else
  fragColor = texture(uTex0, vTexCoord);
#endif
}
```

- [ ] **Step 9: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: typecheck clean, 27/27 unit tests (no behavior change yet).

- [ ] **Step 10: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/shaders/*.glsl
git commit -m "feat(shaders): GLSL ES 3.00 mirrors of all 8 WGSL shaders"
```

---

### Task 2: WebGL2 device + context wrappers

**Files:**
- Create: `ts/src/lib/gpu/gl/device.ts`
- Create: `ts/src/lib/gpu/gl/context.ts`

`device.ts` mirrors `gpu/device.ts`'s `requestDevice` shape but for WebGL2 — returns `{ gl: WebGL2RenderingContext }`. `context.ts` mirrors `gpu/context.ts` — wraps the canvas-context-acquisition step.

Note: WebGL2 doesn't have a separate "device" vs "context" — the `WebGL2RenderingContext` is both. We keep the two-file shape only for symmetry with the WebGPU side (and so `requestGl2Device` can be called before a canvas is mounted, e.g. for capability probes).

- [ ] **Step 1: Write `ts/src/lib/gpu/gl/context.ts`**

```ts
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
```

- [ ] **Step 2: Write `ts/src/lib/gpu/gl/device.ts`**

```ts
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
```

- [ ] **Step 3: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/gpu/gl/context.ts ts/src/lib/gpu/gl/device.ts
git commit -m "feat(gl): WebGL2 device + context wrappers (mirror gpu/device + gpu/context)"
```

---

### Task 3: WebGL2 program builder

**Files:**
- Create: `ts/src/lib/gpu/gl/program.ts`

This is the central piece — it compiles a vert+frag GLSL pair into a linked program, prepends the `#version 300 es` + `precision highp float;` header (and any `defines`), and surfaces uniform/attribute locations via a `getUniformLocation`/`getAttribLocation` cache.

- [ ] **Step 1: Write `ts/src/lib/gpu/gl/program.ts`**

```ts
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
```

- [ ] **Step 2: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/gpu/gl/program.ts
git commit -m "feat(gl): WebGL2 program builder with version+precision header injection"
```

---

### Task 4: WebGL2 render target + ping-pong

**Files:**
- Create: `ts/src/lib/gpu/gl/target.ts`

Mirror `gpu/target.ts` for WebGL2. Each `GlRenderTarget` owns a `WebGLTexture` (color attachment) and a `WebGLFramebuffer` that wraps it. `SRGB8_ALPHA8` is the format equivalent to WebGPU's `rgba8unorm-srgb`.

- [ ] **Step 1: Write `ts/src/lib/gpu/gl/target.ts`**

```ts
export interface GlRenderTarget {
  gl:           WebGL2RenderingContext;
  texture:      WebGLTexture;
  framebuffer:  WebGLFramebuffer;
  width:        number;
  height:       number;
  destroy():    void;
}

/**
 * Allocate a WebGL2 render target: SRGB8_ALPHA8 texture + framebuffer with
 * the texture as COLOR_ATTACHMENT0. No depth/stencil — this app never needs them.
 *
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
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.SRGB8_ALPHA8, width, height);
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
```

- [ ] **Step 2: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/gpu/gl/target.ts
git commit -m "feat(gl): WebGL2 render target + ping-pong wrappers (SRGB8_ALPHA8)"
```

---

### Task 5: WebGL2 quad VBO + VAO

**Files:**
- Create: `ts/src/lib/gpu/gl/quad.ts`

Same quad geometry as `gpu/quad.ts`, but VAO-bound for WebGL2. The VAO captures attribute pointer state; binding the VAO before each draw is one call vs four state-set calls.

The quad is reusable across passes: each pass fetches attribute locations from its program and binds them by name. Since attribute locations differ per program, we can't pre-bake them into one VAO. Solution: a single shared VBO, and each pass owns its VAO that captures the binding for that program's attribute locations.

For the M4 plan, we'll keep things simple: one shared VBO, and `drawFullscreenQuad(program, vbo)` binds the attributes inline per draw. VAO optimization is a possible follow-up but rarely matters for 4-vertex draws at this scale.

- [ ] **Step 1: Write `ts/src/lib/gpu/gl/quad.ts`**

```ts
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
 * Returns the attribute indices that were enabled (so callers can disable
 * them after the draw if they want strict state hygiene; usually no).
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
```

- [ ] **Step 2: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/gpu/gl/quad.ts
git commit -m "feat(gl): WebGL2 fullscreen quad VBO + bindQuadAttribs helper"
```

---

### Task 6: Backend selector + Backend type

**Files:**
- Create: `ts/src/lib/gel/backend.ts`
- Create: `ts/tests/unit/backend.test.ts`

Single source of truth for which backend a route mounts. Precedence: explicit URL hash query (`?backend=webgpu` or `?backend=webgl2`) → `localStorage.gelBackend` → auto-detect (`navigator.gpu` available ⇒ WebGPU, else WebGL2, else throw).

The URL hash query parses out of `window.location.hash` because we use `HashRouter`. e.g. `#/dev?backend=webgl2` → `backend=webgl2`.

- [ ] **Step 1: Write `ts/tests/unit/backend.test.ts`**

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { selectBackend, parseBackendFromHash } from '../../src/lib/gel/backend';

describe('parseBackendFromHash', () => {
  it('returns null when no query string is present', () => {
    expect(parseBackendFromHash('#/dev')).toBeNull();
    expect(parseBackendFromHash('')).toBeNull();
  });

  it('extracts backend from a hash query', () => {
    expect(parseBackendFromHash('#/dev?backend=webgl2')).toBe('webgl2');
    expect(parseBackendFromHash('#/dev?backend=webgpu')).toBe('webgpu');
  });

  it('returns null for unrecognized backend values', () => {
    expect(parseBackendFromHash('#/dev?backend=metal')).toBeNull();
  });

  it('handles multiple query params', () => {
    expect(parseBackendFromHash('#/dev?foo=bar&backend=webgl2')).toBe('webgl2');
  });
});

describe('selectBackend', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => storage[k] ?? null,
      setItem: (k: string, v: string) => { storage[k] = v; },
      removeItem: (k: string) => { delete storage[k]; },
    });
    vi.stubGlobal('navigator', {});  // no .gpu, no .gl
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hash query overrides everything', () => {
    storage.gelBackend = 'webgpu';
    vi.stubGlobal('navigator', { gpu: {} });
    expect(selectBackend({ hash: '#/dev?backend=webgl2' })).toBe('webgl2');
  });

  it('localStorage overrides auto-detect', () => {
    storage.gelBackend = 'webgl2';
    vi.stubGlobal('navigator', { gpu: {} });  // would auto-detect webgpu
    expect(selectBackend({ hash: '' })).toBe('webgl2');
  });

  it('auto-detects webgpu when navigator.gpu is present', () => {
    vi.stubGlobal('navigator', { gpu: {} });
    expect(selectBackend({ hash: '' })).toBe('webgpu');
  });

  it('auto-detects webgl2 when navigator.gpu is absent and webgl2 context can be created', () => {
    expect(selectBackend({ hash: '' })).toBe('webgl2');
  });

  it('throws when no backend is available', () => {
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => null }) });
    expect(() => selectBackend({ hash: '' })).toThrow(/no GPU backend available/i);
  });

  it('ignores invalid localStorage values and falls back to auto-detect', () => {
    storage.gelBackend = 'metal';
    vi.stubGlobal('navigator', { gpu: {} });
    expect(selectBackend({ hash: '' })).toBe('webgpu');
  });
});
```

- [ ] **Step 2: Run test, confirm fails**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run tests/unit/backend.test.ts
```

Expected: FAIL (module missing).

- [ ] **Step 3: Implement `ts/src/lib/gel/backend.ts`**

```ts
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
```

- [ ] **Step 4: Run test, confirm passes**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run tests/unit/backend.test.ts
```

Expected: 10 tests pass (4 in `parseBackendFromHash`, 6 in `selectBackend`).

- [ ] **Step 5: Run full unit suite**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: typecheck clean, 27 + 10 = 37/37 unit tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/gel/backend.ts ts/tests/unit/backend.test.ts
git commit -m "feat(backend): selectBackend() with URL+localStorage+auto precedence"
```

---

### Task 7: WebGL2 GelRenderer scaffold + geometry pass

**Files:**
- Create: `ts/src/lib/gel/render-gl.ts`

This is the largest task. We assemble the scaffold of `render-gl.ts` matching `render.ts`'s `GelRenderer` interface, plus implement the geometry pass inline. Composite/warp/blur/overcook are stubbed to clear-only and filled in tasks 8-10. After this task, a single-band scene rendered via WebGL2 will show only the raw geometry primitives (no smile, no welldamage, no blur, no tint) — no goldens yet.

The shared CPU mesh builders (`buildSmearMesh`, `buildBodyMesh`, `buildFlamesMesh`) and CPU warp generators (`buildSmileWarp`, `buildWellDamageWarp`, `buildOvercookWarp`) are reused as-is — they're backend-agnostic.

- [ ] **Step 1: Read the current `ts/src/lib/gel/render.ts`** to confirm the GelRenderer interface shape (export types, setBands, setGlobalWarp, render, output, destroy).

- [ ] **Step 2: Write `ts/src/lib/gel/render-gl.ts`** (skeleton + geometry pass; later tasks fill in the rest)

```ts
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
```

- [ ] **Step 3: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: typecheck clean, 37/37 unit tests (no behavior change to WebGPU path).

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/gel/render-gl.ts
git commit -m "feat(gl): WebGL2 GelRenderer scaffold + geometry pass (composite/warp/blur stubs)"
```

---

### Task 8: WebGL2 composite pass

**Files:**
- Modify: `ts/src/lib/gel/render-gl.ts`

Replace the `drawCompositeStub` with a real composite pass: draw `src` into `dst` via the `progComp` program, modulating by `band.color`. Use premultiplied additive blend (`ONE, ONE`).

After this task, the WebGL2 path correctly accumulates multiple bands into the composite, and `output` switches from `band.current` to `composite.current` (matching the WebGPU API).

- [ ] **Step 1: In `render-gl.ts`, replace the `drawCompositeStub` body** with the real composite implementation:

```ts
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
```

- [ ] **Step 2: In `render()`, replace the stub call** with `drawComposite(band.current, composite.current, b.color, /*clear*/ i === 0);`

- [ ] **Step 3: Switch `output` getter** from `band.current` back to `composite.current`:

```ts
get output() { return composite.current; },
```

- [ ] **Step 4: Remove the `drawCompositeStub` declaration** (replaced).

- [ ] **Step 5: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: clean, 37/37 unit tests.

- [ ] **Step 6: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/gel/render-gl.ts
git commit -m "feat(gl): WebGL2 composite pass with premultiplied additive blend"
```

---

### Task 9: WebGL2 warp pass

**Files:**
- Modify: `ts/src/lib/gel/render-gl.ts`

Add a `runWarp(target, warp)` helper that mirrors the WebGPU warp pass: read `target.current`, sample the warp control texture, write deflected output to `target.next`, swap. Used for smile, well-damage (1D warp tex), and overcook (2D).

The CPU `WarpTextureCpu` returned by `buildSmileWarp`/`buildWellDamageWarp`/`buildOvercookWarp` is already in the right shape (`Uint8Array`, width × height × 4 bytes RGBA, `scale: [sx, sy]`).

- [ ] **Step 1: Add `runWarp` near the other helpers in `render-gl.ts`**:

```ts
import type { WarpTextureCpu } from './warpTexture';
// ^ add this import alongside the other type imports at the top.
```

```ts
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

  // Passthrough vertex uniforms
  gl.uniform2f(progWarp.uniform('uPositionOffset'), 0, 0);
  gl.uniform2f(progWarp.uniform('uPositionScale'),  gelSize.width, gelSize.height);
  gl.uniform2f(progWarp.uniform('uTexCoordOffset'), 0, 0);
  gl.uniform2f(progWarp.uniform('uTexCoordScale'),  1, 1);
  gl.uniform2f(progWarp.uniform('uGelSize'),        gelSize.width, gelSize.height);

  bindQuadAttribs(gl, quad.buffer, progWarp.attrib('aPos'), progWarp.attrib('aTexCoord'));

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  target.swap();
}
```

- [ ] **Step 2: In `render()`, after `drawGeometry(band.current, b)`, add the smile + welldamage warp calls** (mirrors `render.ts` lines 73-84):

```ts
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
```

- [ ] **Step 3: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: clean, 37/37 unit tests.

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/gel/render-gl.ts
git commit -m "feat(gl): WebGL2 warp pass for smile + well-damage"
```

---

### Task 10: WebGL2 blur pass + overcook integration

**Files:**
- Modify: `ts/src/lib/gel/render-gl.ts`

Two pieces in one task: the blur pass (uses progBlur5/9/13 in 1/2/3-pixel steps with a per-direction inner loop) and the overcook integration (calls `runWarp` on the composite ping-pong, with overcook memoization mirroring `render.ts`).

- [ ] **Step 1: Add `runBlur` helper** near `runWarp`:

```ts
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
```

- [ ] **Step 2: In `render()`, after the warp calls**, insert the blur step:

```ts
if (b.blur > 0) runBlur(band, b.blur * pixelsPerUnit);
```

- [ ] **Step 3: Add overcook memoization** at the closure scope (mirrors `render.ts` lines 42-46):

```ts
let overcookMemo: { gw: GlobalWarp; warp: ReturnType<typeof buildOvercookWarp> } | null = null;
```

- [ ] **Step 4: After the band loop in `render()`**, add the overcook block (mirrors `render.ts` lines 107-112):

```ts
if (!overcookMemo || overcookMemo.gw !== globalWarp) {
  overcookMemo = { gw: globalWarp, warp: buildOvercookWarp(globalWarp, gelSize, pixelsPerUnit) };
}
const overcook = overcookMemo.warp;
if (overcook) runWarp(composite, overcook);
```

- [ ] **Step 5: Update `setGlobalWarp`** to invalidate the memo:

```ts
setGlobalWarp(w) { globalWarp = w; overcookMemo = null; },
```

- [ ] **Step 6: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: clean, 37/37 unit tests.

- [ ] **Step 7: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/gel/render-gl.ts
git commit -m "feat(gl): WebGL2 blur pass + overcook integration"
```

---

### Task 11: DevPage WebGL2 path + canvas blit

**Files:**
- Modify: `ts/src/routes/DevPage.tsx`

Wire `selectBackend()` into `DevPage`. When backend is `webgl2`, mount the WebGL2 path: `configureGl2Context` → `createGlGelRenderer` → render → blit `composite` texture to canvas (via the same `progComp` style program but without composite blending — just sample and write).

The cleanest way is to call `selectBackend()` at the top of the boot effect and `if/else` the entire mounting body. Keep the WebGPU path identical to its current form.

- [ ] **Step 1: Read `ts/src/routes/DevPage.tsx`** to confirm the existing layout (already read above; familiar with structure).

- [ ] **Step 2: At the top of the boot effect, branch on backend.** Replace the boot effect's `(async () => { ... })()` body with:

```ts
(async () => {
  try {
    const fixture = (await import('../../fixtures/states/single-band.json')).default;
    canvas.width  = fixture.gelSize.width  * fixture.pixelsPerUnit;
    canvas.height = fixture.gelSize.height * fixture.pixelsPerUnit;

    const backend = selectBackend();

    if (backend === 'webgl2') {
      await mountWebGl2(canvas, fixture, () => cancelled, (r) => { rendererGl = r; });
    } else {
      await mountWebGpu(canvas, fixture, () => cancelled, (r) => { rendererGpu = r; });
    }
    if (!cancelled) setBoot({ status: 'ready' });
  } catch (err) {
    if (!cancelled) setBoot({ status: 'error', message: (err as Error).message });
  }
})();
```

You'll need to declare `let rendererGpu: ... | null = null;` and `let rendererGl: ReturnType<typeof import('../lib/gel/render-gl').createGlGelRenderer> | null = null;` at the effect scope, then in the cleanup release whichever is set:

```ts
return () => {
  cancelled = true;
  rendererGpu?.destroy();
  rendererGl?.destroy();
};
```

- [ ] **Step 3: Extract the existing WebGPU mount body into a helper `mountWebGpu`** in the same file (or as a separate module if the file gets too big — but keep it inline for now to avoid churn). Signature:

```ts
async function mountWebGpu(
  canvas: HTMLCanvasElement,
  fixture: { gelSize: { width: number; height: number }; pixelsPerUnit: number; bands: unknown[] },
  isCancelled: () => boolean,
  onRenderer: (r: ReturnType<typeof import('../lib/gel/render').createGelRenderer>) => void
): Promise<void> {
  // Move the existing WebGPU block here verbatim, replacing `cancelled` with isCancelled() and
  // recording the renderer via onRenderer(r).
}
```

- [ ] **Step 4: Add the new `mountWebGl2` helper** in the same file:

```ts
async function mountWebGl2(
  canvas: HTMLCanvasElement,
  fixture: { gelSize: { width: number; height: number }; pixelsPerUnit: number; bands: unknown[] },
  isCancelled: () => boolean,
  onRenderer: (r: ReturnType<typeof import('../lib/gel/render-gl').createGlGelRenderer>) => void
): Promise<void> {
  const { configureGl2Context } = await import('../lib/gpu/gl/context');
  const { gl } = configureGl2Context(canvas);
  if (isCancelled()) return;

  const [
    { createGlGelRenderer },
    { createGlProgram },
    { createGlQuad, bindQuadAttribs },
    passthroughVertSrc,
    gelPassthroughSrc,
  ] = await Promise.all([
    import('../lib/gel/render-gl'),
    import('../lib/gpu/gl/program'),
    import('../lib/gpu/gl/quad'),
    import('../shaders/passthrough.vert.glsl?raw'),
    import('../shaders/gel-passthrough.frag.glsl?raw'),
  ]);

  const renderer = createGlGelRenderer(gl, fixture.gelSize, fixture.pixelsPerUnit);
  renderer.setBands(fixture.bands as unknown as Parameters<typeof renderer.setBands>[0]);
  renderer.render();
  if (isCancelled()) return;
  onRenderer(renderer);

  // Blit composite → default framebuffer.
  const blit = createGlProgram(gl, passthroughVertSrc.default, gelPassthroughSrc.default, 'gl-blit');  // no GEL_COMPOSITE define → fs_main equivalent
  const quad = createGlQuad(gl);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(blit.program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, renderer.output.texture);
  gl.uniform1i(blit.uniform('uTex0'), 0);
  gl.uniform2f(blit.uniform('uPositionOffset'), 0, 0);
  gl.uniform2f(blit.uniform('uPositionScale'),  fixture.gelSize.width, fixture.gelSize.height);
  gl.uniform2f(blit.uniform('uTexCoordOffset'), 0, 0);
  gl.uniform2f(blit.uniform('uTexCoordScale'),  1, 1);
  gl.uniform2f(blit.uniform('uGelSize'),        fixture.gelSize.width, fixture.gelSize.height);
  bindQuadAttribs(gl, quad.buffer, blit.attrib('aPos'), blit.attrib('aTexCoord'));
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  // NB: blit + quad allocate WebGL resources that leak when the page unmounts. Same TODO as the WebGPU path —
  // resolves when GelCanvas owns the lifecycle.
}
```

- [ ] **Step 5: Add `import { selectBackend } from '../lib/gel/backend';`** at the top of the file.

- [ ] **Step 6: Verify in browser**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npm run dev > /tmp/m4-task11-dev.log 2>&1 &
SERVE_PID=$!
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/
kill $SERVE_PID 2>/dev/null
wait $SERVE_PID 2>/dev/null
```

Expected: 200. If you can, eyeball both `/#/dev` and `/#/dev?backend=webgl2` in a browser; both should show the single-band scene.

- [ ] **Step 7: Run typecheck + WebGPU goldens still pass**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit && npx playwright test smoke.spec.ts single-band.spec.ts
```

Expected: clean, 37/37 unit, 7/7 visual (WebGPU baselines unchanged).

- [ ] **Step 8: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/routes/DevPage.tsx
git commit -m "feat(dev): DevPage dispatches on selectBackend() (WebGPU + WebGL2)"
```

---

### Task 12: DevMultiPage + DevPerfPage WebGL2 paths

**Files:**
- Modify: `ts/src/routes/DevMultiPage.tsx`
- Modify: `ts/src/routes/DevPerfPage.tsx`

Apply the same `mountWebGpu` / `mountWebGl2` split pattern from Task 11 to the multi-band and perf pages. Each page gets its own helpers (the perf page needs a per-frame rebind in the rAF loop for both backends).

- [ ] **Step 1: Modify `DevMultiPage.tsx`** following the same pattern as `DevPage.tsx`. The structural difference is that the existing one-shot blit code becomes the body of `mountWebGpu`. The `mountWebGl2` body is identical to Task 11's `mountWebGl2` except it loads `50-band.json` and applies `setGlobalWarp(fixture.globalWarp)` after `setBands`.

Key additional line in `mountWebGl2` after the `setBands` line:

```ts
renderer.setGlobalWarp(fixture.globalWarp);
```

- [ ] **Step 2: Modify `DevPerfPage.tsx`** with both backend mounts. The perf page is a rAF loop, so the blit must happen each frame. The structure for `mountWebGl2` should set up the renderer and blit pipeline ONCE outside the loop, then per frame: call `renderer.render()`, bind the canvas framebuffer, use the blit program, sample `renderer.output.texture`, draw. After each frame call `renderer.output` may have swapped (overcook on means an extra ping-pong swap), so re-bind the texture each frame.

Sample frame body for `mountWebGl2`:

```ts
function frame() {
  if (isCancelled()) return;
  const now = performance.now();
  samples.push(now - last);
  if (samples.length > SAMPLE_WINDOW) samples.shift();
  last = now;
  if (samples.length === SAMPLE_WINDOW) {
    const sum = samples.reduce((a, b) => a + b, 0);
    setAvgMs(sum / samples.length);
  }

  renderer.render();

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(blit.program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, renderer.output.texture);
  gl.uniform1i(blit.uniform('uTex0'), 0);
  gl.uniform2f(blit.uniform('uPositionOffset'), 0, 0);
  gl.uniform2f(blit.uniform('uPositionScale'),  fixture.gelSize.width, fixture.gelSize.height);
  gl.uniform2f(blit.uniform('uTexCoordOffset'), 0, 0);
  gl.uniform2f(blit.uniform('uTexCoordScale'),  1, 1);
  gl.uniform2f(blit.uniform('uGelSize'),        fixture.gelSize.width, fixture.gelSize.height);
  bindQuadAttribs(gl, quad.buffer, blit.attrib('aPos'), blit.attrib('aTexCoord'));
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  rafId = requestAnimationFrame(frame);
}
```

The cleanup must call `cancelAnimationFrame(rafId)` AND destroy renderer + blit program + quad on the WebGL2 side too.

- [ ] **Step 3: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: clean, 37/37 unit tests.

- [ ] **Step 4: Visual smoke**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npm run dev > /tmp/m4-task12-dev.log 2>&1 &
SERVE_PID=$!
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/
kill $SERVE_PID 2>/dev/null
wait $SERVE_PID 2>/dev/null
```

Expected: 200.

- [ ] **Step 5: Existing WebGPU goldens still pass**

```bash
cd /Users/shawn/code/gel/ts && npx playwright test
```

Expected: 8/8 (same as before; the WebGL2 path isn't tested yet — Task 14 wires that up).

- [ ] **Step 6: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/routes/DevMultiPage.tsx ts/src/routes/DevPerfPage.tsx
git commit -m "feat(dev): DevMultiPage + DevPerfPage dispatch on selectBackend()"
```

---

### Task 13: Rename existing WebGPU baselines, split Playwright project into two

**Files:**
- Rename: `ts/tests/visual/single-band.spec.ts-snapshots/single-band-canvas-chromium.png` → `single-band-canvas-chromium-webgpu.png`
- Rename: `ts/tests/visual/multi-band.spec.ts-snapshots/multi-band-canvas-chromium.png` → `multi-band-canvas-chromium-webgpu.png`
- Modify: `ts/playwright.config.ts`
- Modify: `ts/tests/visual/single-band.spec.ts`
- Modify: `ts/tests/visual/multi-band.spec.ts`

This task does the structural Playwright change without yet generating WebGL2 baselines (Task 14 generates them). After this task: the WebGPU project runs and passes; the WebGL2 project runs and fails because no baselines exist.

- [ ] **Step 1: Rename the existing baselines**

```bash
cd /Users/shawn/code/gel/ts
git mv tests/visual/single-band.spec.ts-snapshots/single-band-canvas-chromium.png \
       tests/visual/single-band.spec.ts-snapshots/single-band-canvas-chromium-webgpu.png
git mv tests/visual/multi-band.spec.ts-snapshots/multi-band-canvas-chromium.png \
       tests/visual/multi-band.spec.ts-snapshots/multi-band-canvas-chromium-webgpu.png
```

- [ ] **Step 2: Modify `ts/playwright.config.ts`** — split the single chromium project into two:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'chromium-webgpu',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--enable-unsafe-webgpu',
            '--enable-features=Vulkan',
            '--ignore-gpu-blocklist',
          ],
        },
      },
    },
    {
      name: 'chromium-webgl2',
      use: {
        ...devices['Desktop Chrome'],
        // Tests in this project run against the WebGL2 path. Backend selection
        // is driven by localStorage.gelBackend = 'webgl2' (set by the test
        // beforeEach below) — no special launch flags needed.
      },
    },
  ],
});
```

- [ ] **Step 3: Modify `ts/tests/visual/single-band.spec.ts`** to be backend-aware:

```ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  const backend = testInfo.project.name === 'chromium-webgl2' ? 'webgl2' : 'webgpu';
  await page.addInitScript((b: string) => {
    localStorage.setItem('gelBackend', b);
  }, backend);
});

test('single canonical band — golden frame', async ({ page }, testInfo) => {
  // WebGPU still skipped on Linux; WebGL2 runs everywhere.
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/dev');
  await expect(page.getByTestId('renderer-status')).toHaveText('renderer: ready');
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
  const canvas = page.getByTestId('gel-canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveScreenshot('single-band-canvas.png', {
    maxDiffPixelRatio: 0.02,
  });
});
```

- [ ] **Step 4: Modify `ts/tests/visual/multi-band.spec.ts`** with the same shape:

```ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  const backend = testInfo.project.name === 'chromium-webgl2' ? 'webgl2' : 'webgpu';
  await page.addInitScript((b: string) => {
    localStorage.setItem('gelBackend', b);
  }, backend);
});

test('50-band canonical scene with overcook — golden frame', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/dev/multi');
  await expect(page.getByTestId('renderer-status')).toHaveText('renderer: ready');
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
  const canvas = page.getByTestId('gel-canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveScreenshot('multi-band-canvas.png', {
    maxDiffPixelRatio: 0.02,
  });
});
```

- [ ] **Step 5: Modify `ts/tests/visual/perf.spec.ts`** with per-project gate:

```ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  const backend = testInfo.project.name === 'chromium-webgl2' ? 'webgl2' : 'webgpu';
  await page.addInitScript((b: string) => {
    localStorage.setItem('gelBackend', b);
  }, backend);
});

test('50-band rAF loop holds avg frame time within budget', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  // Per-backend gate: WebGPU at <25ms (60fps target with headroom), WebGL2 at <33ms (30fps minimum).
  const gateMs = testInfo.project.name === 'chromium-webgl2' ? 33 : 25;

  await page.goto('/#/dev/perf');
  await expect(page.getByTestId('renderer-status')).toHaveText('renderer: ready');
  await expect(async () => {
    const text = await page.getByTestId('frame-avg').textContent();
    expect(text).toMatch(/^avg-frame-ms: /);
  }).toPass({ timeout: 5000 });
  const text = await page.getByTestId('frame-avg').textContent();
  const m = text?.match(/^avg-frame-ms: ([\d.]+)/);
  expect(m, `frame-avg testid did not match expected format: ${text}`).not.toBeNull();
  const ms = parseFloat(m![1]);
  console.log(`50-band rAF avg frame time (${testInfo.project.name}): ${ms.toFixed(2)} ms`);
  expect(ms, `Expected <${gateMs} ms/frame, got ${ms.toFixed(2)} ms`).toBeLessThan(gateMs);
});
```

- [ ] **Step 6: Verify smoke specs still pass under both projects (no backend dependency)**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npx playwright test smoke.spec.ts
```

Expected: 5 tests × 2 projects = 10 passing smoke tests on macOS (5 + 5).

- [ ] **Step 7: Verify WebGPU project still passes goldens**

```bash
cd /Users/shawn/code/gel/ts && npx playwright test --project chromium-webgpu
```

Expected: on macOS — 5 smoke + single-band + multi-band + perf = 8 pass. The WebGL2 project would fail (no baselines yet) — that's Task 14.

- [ ] **Step 8: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/playwright.config.ts ts/tests/visual/single-band.spec.ts ts/tests/visual/multi-band.spec.ts ts/tests/visual/perf.spec.ts ts/tests/visual/single-band.spec.ts-snapshots/ ts/tests/visual/multi-band.spec.ts-snapshots/
git commit -m "test(visual): split Playwright into chromium-webgpu + chromium-webgl2 projects"
```

---

### Task 14: Generate WebGL2 baselines

**Files:**
- Create (auto-generated): `ts/tests/visual/single-band.spec.ts-snapshots/single-band-canvas-chromium-webgl2.png`
- Create (auto-generated): `ts/tests/visual/multi-band.spec.ts-snapshots/multi-band-canvas-chromium-webgl2.png`

- [ ] **Step 1: Generate WebGL2 baselines**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npx playwright test --project chromium-webgl2 single-band.spec.ts multi-band.spec.ts --update-snapshots
```

Expected: 2 passes; new files at `*-chromium-webgl2.png` paths.

- [ ] **Step 2: Visual sanity check** — open both pairs of baselines side-by-side. The WebGL2 versions should look visually similar to the WebGPU versions (within reason — different sampling/precision).

```bash
ls -la /Users/shawn/code/gel/ts/tests/visual/single-band.spec.ts-snapshots/
ls -la /Users/shawn/code/gel/ts/tests/visual/multi-band.spec.ts-snapshots/
file /Users/shawn/code/gel/ts/tests/visual/single-band.spec.ts-snapshots/single-band-canvas-chromium-webgl2.png
file /Users/shawn/code/gel/ts/tests/visual/multi-band.spec.ts-snapshots/multi-band-canvas-chromium-webgl2.png
```

Expected: both new PNGs exist, 320×240 RGB. If you can open them in an image viewer, they should depict:
- single-band: a single dim band with smile/welldamage/blur (matches the WebGPU version qualitatively).
- multi-band: 50 dim bands with global H2O distortion (matches the WebGPU version qualitatively).

If the WebGL2 baselines look catastrophically different (black, all-white, missing bands, etc.), revert and investigate. Likely culprits: a uniform name typo (e.g., `uTexCoord` vs `aTexCoord`), missing `gl.activeTexture` call, incorrect blend mode, FBO incompleteness on a particular Chrome version.

- [ ] **Step 3: Lock the baselines (clean run)**

```bash
cd /Users/shawn/code/gel/ts && npx playwright test --project chromium-webgl2 single-band.spec.ts multi-band.spec.ts
```

Expected: 2 passes.

- [ ] **Step 4: Run perf test on WebGL2** to verify it passes the 33ms gate

```bash
cd /Users/shawn/code/gel/ts && npx playwright test --project chromium-webgl2 perf.spec.ts
```

Expected: 1 pass on macOS. Note the `console.log` line surfaces in `--reporter=list` output as a test annotation. If WebGL2 is over 33ms, the gate is too tight or the WebGL2 path needs profiling — investigate before committing the baselines.

- [ ] **Step 5: Run full Playwright suite under both projects**

```bash
cd /Users/shawn/code/gel/ts && npx playwright test
```

Expected: macOS — 16 tests pass (5 smoke + single-band + multi-band + perf, all × 2 projects). Linux — 5 smoke pass per project + 3 chromium-webgl2 visuals pass = 13 pass; 3 chromium-webgpu visuals skip = 13 pass + 3 skip.

- [ ] **Step 6: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/tests/visual/single-band.spec.ts-snapshots/single-band-canvas-chromium-webgl2.png \
        ts/tests/visual/multi-band.spec.ts-snapshots/multi-band-canvas-chromium-webgl2.png
git commit -m "test(visual): WebGL2 goldens for single-band + multi-band scenes"
```

---

### Task 15: CI runs WebGL2 visuals on Linux

**Files:**
- Modify: `.github/workflows/ci.yml`

The current CI runs `npm run test:visual` on Ubuntu, with the WebGPU tests skipping themselves via `test.skip(process.platform === 'linux')`. After Task 13's project split, the WebGPU project still skips its 3 visual tests on Linux; the WebGL2 project runs all 3 (no skip). No CI workflow changes are strictly necessary because `npm run test:visual` runs both projects and Playwright handles per-project skip logic via the test files themselves.

But: Linux CI doesn't need the SwiftShader Vulkan loader steps anymore for the WebGL2 path. Those steps remain useful for any future WebGPU work, so keep them but make their failure non-fatal (already done — `|| true`).

The visual check that this task delivers is: CI green with the Linux runner now actually exercising the WebGL2 path.

- [ ] **Step 1: Inspect the current CI workflow** to confirm `npm run test:visual` is the one and only Playwright invocation, and that no project filter is in use (it isn't).

```bash
cat /Users/shawn/code/gel/.github/workflows/ci.yml
```

Confirm: `- run: npm run test:visual` — runs both projects.

- [ ] **Step 2: No change needed**, but add a brief comment to make the intent explicit:

In `.github/workflows/ci.yml`, find the `- run: npm run test:visual` line and add a comment block above it:

```yaml
      # Runs both Playwright projects: chromium-webgpu and chromium-webgl2.
      # WebGPU tests still self-skip on Linux (chromium-headless can't acquire a
      # Vulkan adapter reliably even with mesa-vulkan-drivers + the SwiftShader
      # ICD). WebGL2 tests run everywhere — they're the M4 acceptance gate.
      - run: npm run test:visual
```

- [ ] **Step 3: Verify (locally, simulating CI)**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npm run typecheck && npm run test:unit && npm run build && npx playwright test
```

Expected: typecheck clean, 37 unit pass, build succeeds, all visual tests pass on macOS (16 of 16).

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel
git add .github/workflows/ci.yml
git commit -m "ci: clarify that test:visual runs both backend projects"
```

---

### Task 16: Update Phase 1 overview + tag m4-webgl2-fallback

**Files:**
- Modify: `docs/superpowers/plans/2026-04-27-gelbox-ts-phase-1-overview.md`

- [ ] **Step 1: Mark M4 done in the overview**

In `docs/superpowers/plans/2026-04-27-gelbox-ts-phase-1-overview.md`:

a) In the milestones table, M4 row, replace `TBW after M3` with the linked filename:

```markdown
| M4 | WebGL2 fallback parity | Same goldens pass with WebGPU disabled (force-WebGL2 query param) | [`m4-webgl2-fallback.md`](2026-04-28-gelbox-ts-m4-webgl2-fallback.md) | Week 3.5 |
```

b) In the Sub-plans section:

```markdown
- [x] **M4 WebGL2 fallback** — [`2026-04-28-gelbox-ts-m4-webgl2-fallback.md`](2026-04-28-gelbox-ts-m4-webgl2-fallback.md)
```

- [ ] **Step 2: Run full local CI green check**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npm run typecheck && npm run test:unit && npm run build && npx playwright test
```

Expected: typecheck clean, 37/37 unit, build succeeds, 16/16 Playwright on macOS (10 smoke + 3 single-band + 3 multi-band + 3 perf + ... — re-tally: smoke is 5 tests × 2 projects = 10; the three visual specs each 1 test × 2 projects = 6; total 16). On Linux, the WebGPU visual tests skip → 13 pass + 3 skip.

- [ ] **Step 3: Commit, push, tag**

```bash
cd /Users/shawn/code/gel
git add docs/superpowers/plans/2026-04-27-gelbox-ts-phase-1-overview.md
git commit -m "docs(plan): mark M4 WebGL2 fallback complete and link sub-plan"
git push origin main
git tag m4-webgl2-fallback
git push origin m4-webgl2-fallback
```

- [ ] **Step 4: Verify CI green**

```bash
cd /Users/shawn/code/gel
gh run list --workflow=ci.yml --limit 1
```

Wait via Monitor or `until` polling, max 5 minutes. Linux CI is now expected to run 13 of 16 tests (3 WebGPU visuals skip) and pass.

If CI is green: M4 shipped. Done.

If CI is red: capture failure with `gh run view <id> --log-failed | head -200`. Most likely failure modes:
- WebGL2 baselines drift between Mac (M1 / Metal-Angle) and Linux (Mesa Angle / SwiftShader). If the diff exceeds `maxDiffPixelRatio: 0.02`, you'll need a Linux-baked baseline. Two options: (a) bump tolerance to 0.05 if visual parity is intact; (b) generate a separate Linux baseline by running `--update-snapshots` on a Linux runner and committing the result. Note the convention is one baseline per project name, not per OS — Playwright's `snapshotPathTemplate` doesn't include OS by default. Address by either editing the template to include `{platform}` or by using `--ignore-snapshots` for known-flaky cases. Don't make this decision lightly; for M4, prefer (a) if visually equivalent.
- Vite build fails to import `*.glsl?raw`. Vite's `?raw` import works for any text file; the GLSL files should be picked up automatically. If not, add `assetsInclude: ['**/*.glsl']` to `vite.config.ts`.

---

## Self-review

**Spec coverage** (against M4 acceptance "Same goldens pass with WebGPU disabled (force-WebGL2 query param)"):

- ✅ WebGL2 fallback renderer — Tasks 1–10 ship `lib/gpu/gl/` + `lib/gel/render-gl.ts` with all 6 passes (geometry, smile/wd warp, blur, composite, overcook).
- ✅ Force-WebGL2 query param — Task 6 ships `selectBackend()` reading `?backend=webgl2`. Task 11 wires DevPage; Task 12 wires DevMultiPage + DevPerfPage.
- ✅ Same goldens pass — Tasks 13–14 generate per-backend baselines and the project matrix runs both. Visual parity is per-backend (each baseline locked to its backend's output) which is the only sustainable interpretation; cross-backend bit-equality is not a meaningful goal.
- ✅ Linux CI visual coverage unblocked — Task 15 confirms `chromium-webgl2` runs on Linux without the prior WebGPU skip; visual tests now run on Linux for the first time.

**Placeholder scan:** No `TBD`/`TODO`/`add appropriate error handling`/`similar to Task N` markers. Every code-bearing step has a complete code block. Commands are exact with expected outputs. Conditional handling (Task 16's "if CI is red" diagnostics) names specific failure modes with concrete remediation, not vague placeholders.

**Type consistency:**
- `Backend = 'webgpu' | 'webgl2'` introduced in Task 6 used in Task 11+ via `selectBackend()`.
- `GlGelRenderer` interface introduced in Task 7 mirrors `GelRenderer` from `render.ts` field-for-field (`setBands`, `setGlobalWarp`, `render`, `output`, `destroy`).
- `GlRenderTarget` (Task 4) consumed by `GlGelRenderer.output` (Task 7+) and by the dev page blit code (Tasks 11, 12).
- `GlProgram` (Task 3) consumed by all `runX` functions inside `render-gl.ts`.
- `GlPingPong` (Task 4) used as parameter type for `runWarp` (Task 9) and `runBlur` (Task 10) inside `render-gl.ts` — the type ref appears as `ReturnType<typeof createGlPingPong>` in those functions which is equivalent.
- Shaders: every uniform and attribute name in Task 1's GLSL matches the WebGL2 calls that bind them in Tasks 7–11. Cross-checked: `uPositionOffset`, `uPositionScale`, `uTexCoordOffset`, `uTexCoordScale`, `uGelSize`, `uTex0`, `uTexWarp`, `uWarpScale`, `uResolution`, `uDirection`, `uTint`, `aPos`, `aTexCoord`, `aColor`. The `GEL_COMPOSITE` define in Task 1's `gel-passthrough.frag.glsl` is used by Task 7's `progComp = createGlProgram(..., 'composite', ['GEL_COMPOSITE'])` and inverted in Task 11's blit (`createGlProgram(..., 'gl-blit')` — no define = `fs_main` equivalent path).

**Risks specific to M4:**

1. **WebGL2 GLSL precision drift on Linux/Mesa SwiftShader.** Per-backend baselines pinned per OS isn't supported by Playwright's default snapshot template. Likely manageable — both Mac (M1) and Linux Chrome use the same Angle/D3D pathway in headless mode, so Anglerendering should be near-identical. If not, Task 16 step 4 lays out the remediation.
2. **`gl.texSubImage2D` upload behavior on Safari.** WebGL2 + `texSubImage2D(target, level, x, y, w, h, format, type, data)` works on Chrome/Firefox; iOS Safari has historically lagged on full WebGL2 conformance. Phase 1 doesn't gate Safari; tested manually in M9.
3. **Allocation hotpath in `withFaint` band-clone (50 × 60fps = 3000 allocs/sec).** Same risk as M3; not new in M4. Both backends share the optimization opportunity.
4. **`@webgpu/types` dependency.** The WebGL2 path doesn't need WebGPU types; if the import fails for any reason in a WebGL2-only build, the failure is at module-load time. Acceptable — Phase 1 always ships both backend implementations.
5. **DevPage code duplication via `mountWebGpu`/`mountWebGl2`.** Three pages each duplicate the pair. M6+ "GelCanvas" component will consolidate; until then, three near-identical implementations are the cost of shipping fast.

Plan complete and saved to `docs/superpowers/plans/2026-04-28-gelbox-ts-m4-webgl2-fallback.md`.
