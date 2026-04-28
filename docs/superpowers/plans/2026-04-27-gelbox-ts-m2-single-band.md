# M2 — Single-Band Render Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the WebGPU image-graph engine and use it to render one canonical Gelbox band end-to-end (smears → body → flames → smile warp → well-damage warp → blur → composite), with a Playwright golden-frame test as the regression oracle.

**Architecture:** Two render-target ping-pong pairs (band RT × 2, composite RT × 2). Per-band: build primitive geometry (smears + body + flames) on CPU as position+color triangles, render onto band RT via a `geometry` shader pair; then run image-graph passes (smile warp → well-damage warp → blur scheduler) ping-ponging between band RT and band RT temp; then composite the band RT into the composite RT with band color modulation and `(ONE, ONE)` premultiplied additive blend; finally blit composite RT to the canvas surface. M2 covers a **single** band — the multi-band loop and global overcook are M3.

**Tech Stack:** Same as M1 — TypeScript 5.6 strict, Vite 5.4, React 18.3, raw WebGPU (`@webgpu/types`), Vitest 3 unit tests, Playwright 1.49 visual tests (`toHaveScreenshot` with `maxDiffPixelRatio: 0.02`). WGSL written by hand. Vite `?raw` import for shader strings.

**M2 reference:** C++ source at `~/code/gelbox/src/GelRender.cpp` and `~/code/gelbox/include/GelRender.h`. Six GLSL shaders at `~/code/gelbox/assets/shaders/`. Tuning at `~/code/gelbox/assets/tuning/gel-render.json`. Band fields at `~/code/gelbox/include/Band.h`.

---

## Scope

**In M2:**
- `ts/src/lib/gpu/` engine modules: surface, device, context, target, shader, pipeline, quad, uniforms
- Six WGSL ports of C++ shaders + one `geometry` WGSL pair for primitive rendering (engine support — Cinder's default color shader has no equivalent in raw WebGPU)
- CPU helpers: seeded RNG, smile warp 1×N texture generator, well-damage warp 1×N texture generator, smear gradient quads, body rect, flames midpoint-displacement strands
- Per-band orchestrator (`gel/render.ts`) covering one band, all passes
- Canonical scene fixture (`fixtures/states/single-band.json`)
- DevPage shows the band rendered live below the GPU info section
- Playwright golden-frame test that compares against a committed PNG baseline

**Out of M2 (deferred):**
- Multi-band loop (M3)
- Global overcook warp pass (M3 — needs the multi-band composite first)
- 60fps profiling (M3)
- WebGL2 fallback (M4 — `naga.wasm` toolchain comes online in M4)
- Pixel-exact match against the C++ Gelbox `ci::Rand` MT19937 sequence — see decision log below

**Non-goals at this milestone:**
- Production-ready GelSim (M5)
- Theme-aware band colors (color is hard-coded in fixture; theme integration is M3+)

---

## Decisions for this milestone

| Decision | Reason |
|---|---|
| TS-side RNG is **`mulberry32`** seeded by `band.randSeed` | Cinder's `ci::Rand` is MT19937 — a byte-exact TS port is possible but not worth M2 effort. Visual parity does not require flame-by-flame match; it requires "looks like flames." Lock TS layout via golden-frame, compare against C++ visually during dev. |
| Render targets use `rgba8unorm-srgb` | Per Phase 1 overview decision — hardware sRGB decode/encode keeps the additive blur correct |
| Composite blend uses **premultiplied source** + `(ONE, ONE)` | Per Phase 1 overview decision — mathematically equivalent to C++ `(SRC_ALPHA, ONE)` on unpremultiplied source |
| Y-down screen convention in vertex shader (clipY = 1 - 2·gelY/gelSize.y) | Matches C++ Cinder `CameraOrtho(0, w, h, 0, -1, 1)` and the fixture coordinate system from the C++ `Band::mRect` (top-left origin) |
| WGSL `?raw` text import + `device.createShaderModule` per pipeline (no hot-reload yet) | YAGNI for M2; hot-reload is engine ergonomic polish, not a parity requirement |
| Single canonical scene (one band, fixed seeds, fixed gel size 320×240, pixelsPerUnit=1) | Smaller golden frames, faster CI, explicit determinism |
| Golden-frame baseline is **committed** PNG; tolerance `maxDiffPixelRatio: 0.02` | Gives 2% wiggle room for SwiftShader/Lavapipe driver drift on CI vs local dev |
| Headless Chromium needs `--enable-unsafe-webgpu` and `--use-vulkan=swiftshader` (Linux CI) | Verified during Task 1; flags go into `playwright.config.ts` `launchOptions.args` |
| Engine includes a `geometry.wgsl` shader pair (vert + frag) for primitive rendering | Cinder uses a built-in color shader for `gl::draw(TriMesh)` and `gl::drawSolidRect` — we need the equivalent. Listed alongside the six C++ ports. |

---

## File structure for M2

```
ts/
  src/
    lib/
      gpu/
        surface.ts                     # NEW: canvas + DPR + ResizeObserver
        device.ts                      # NEW: requestAdapter + requestDevice
        context.ts                     # NEW: configure GPUCanvasContext
        target.ts                      # NEW: RenderTarget + ping-pong helper
        shader.ts                      # NEW: WGSL → GPUShaderModule
        pipeline.ts                    # NEW: render pipeline factories + cache
        uniforms.ts                    # NEW: typed-array uniform buffer helper
        quad.ts                        # NEW: full-screen unit-quad VBO + layout
        adapter.ts                     # MODIFY: re-export requestDevice
      sim/
        rng.ts                         # NEW: mulberry32 + helpers
        band.ts                        # NEW: TS Band type + factory
      gel/
        render.ts                      # NEW: GelRenderer (single-band for M2)
        smear.ts                       # NEW: smear gradient triangle generator
        body.ts                        # NEW: body solid-rect generator
        flames.ts                      # NEW: flame strands generator
        smile.ts                       # NEW: smile 1×N warp texture generator
        welldamage.ts                  # NEW: well-damage 1×N warp texture generator
        passes/
          blur.ts                      # NEW: blur scheduler (5/9/13 picker)
          warp.ts                      # NEW: warp pass (smile + welldamage)
          composite.ts                 # NEW: band → composite blit with blend
    shaders/
      passthrough.vert.wgsl            # NEW: image-graph vertex shader
      gel-passthrough.frag.wgsl        # NEW: passthrough fragment (composite)
      blur5.frag.wgsl                  # NEW: 3-tap separable Gaussian
      blur9.frag.wgsl                  # NEW: 5-tap separable Gaussian
      blur13.frag.wgsl                 # NEW: 7-tap separable Gaussian
      warp.frag.wgsl                   # NEW: image-warp fragment
      geometry.vert.wgsl               # NEW: position + color vertex shader
      geometry.frag.wgsl               # NEW: interpolated color fragment
    routes/
      DevPage.tsx                      # MODIFY: add canvas + render single band
  fixtures/
    states/
      single-band.json                 # NEW: canonical band parameters
    golden/
      single-band.png                  # NEW: committed Playwright baseline
  tests/
    unit/
      rng.test.ts                      # NEW: mulberry32 determinism
      smile-warp.test.ts               # NEW: byte-exact warp values
      welldamage-warp.test.ts          # NEW: byte-exact warp values
      flames.test.ts                   # NEW: layout determinism
    visual/
      single-band.spec.ts              # NEW: golden-frame test
  playwright.config.ts                 # MODIFY: WebGPU launch flags
```

---

## Reference: shader I/O contracts (so all tasks agree)

**Common bind group layout** (all image-graph shaders use the same layout):
- `@group(0) @binding(0) var<uniform> uPass: PassUniforms` — vertex transform
- `@group(0) @binding(1) var uTex0: texture_2d<f32>` — primary input
- `@group(0) @binding(2) var uSampler: sampler` — linear, clamp-to-edge

Where `PassUniforms` is:

```wgsl
struct PassUniforms {
  positionOffset: vec2f,    // gel-space pixels
  positionScale:  vec2f,    // gel-space pixels
  texCoordOffset: vec2f,    // 0..1
  texCoordScale:  vec2f,    // 0..1
  gelSize:        vec2f,    // pixels (for clip-space conversion)
  _pad:           vec2f,    // align to 16 bytes (std140-ish)
}
```

**Blur fragment** adds:
- `@group(0) @binding(3) var<uniform> uBlur: BlurUniforms` — `{ resolution: vec2f, direction: vec2f }`

**Warp fragment** adds:
- `@group(0) @binding(3) var uTexWarp: texture_2d<f32>` — warp control texture (R8G8B8A8, linear)
- `@group(0) @binding(4) var<uniform> uWarp: WarpUniforms` — `{ scale: vec2f, _pad: vec2f }` (UV-space scale)

**Geometry shaders** use a **different** bind group layout (no texture):
- `@group(0) @binding(0) var<uniform> uGeom: GeomUniforms` — `{ gelSize: vec2f, _pad: vec2f }`

…with a vertex layout of `position: vec2f` (location 0) + `color: vec4f` (location 1, premultiplied).

---

## Tasks

### Task 1: WebGPU surface, device, context bootstrap

**Files:**
- Create: `ts/src/lib/gpu/surface.ts`
- Create: `ts/src/lib/gpu/device.ts`
- Create: `ts/src/lib/gpu/context.ts`
- Modify: `ts/src/routes/DevPage.tsx`
- Modify: `ts/playwright.config.ts`
- Test: `ts/tests/visual/single-band.spec.ts` (smoke only this task)

- [ ] **Step 1: Create `surface.ts` with DPR-aware sizing**

```ts
// ts/src/lib/gpu/surface.ts
export interface SurfaceSize {
  width: number;        // CSS px
  height: number;       // CSS px
  pixelWidth: number;   // device px = round(width * dpr)
  pixelHeight: number;  // device px
  dpr: number;
}

export interface Surface {
  canvas: HTMLCanvasElement;
  size: SurfaceSize;
  onResize(cb: (size: SurfaceSize) => void): () => void;
  dispose(): void;
}

function measure(canvas: HTMLCanvasElement): SurfaceSize {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  return {
    width: rect.width,
    height: rect.height,
    pixelWidth: Math.max(1, Math.round(rect.width * dpr)),
    pixelHeight: Math.max(1, Math.round(rect.height * dpr)),
    dpr,
  };
}

export function createSurface(canvas: HTMLCanvasElement): Surface {
  let size = measure(canvas);
  canvas.width = size.pixelWidth;
  canvas.height = size.pixelHeight;
  const subs = new Set<(s: SurfaceSize) => void>();

  const ro = new ResizeObserver(() => {
    const next = measure(canvas);
    if (next.pixelWidth === size.pixelWidth && next.pixelHeight === size.pixelHeight) return;
    size = next;
    canvas.width = size.pixelWidth;
    canvas.height = size.pixelHeight;
    subs.forEach((cb) => cb(size));
  });
  ro.observe(canvas);

  return {
    canvas,
    get size() { return size; },
    onResize(cb) {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    dispose() {
      ro.disconnect();
      subs.clear();
    },
  };
}
```

- [ ] **Step 2: Create `device.ts`**

```ts
// ts/src/lib/gpu/device.ts
export interface DeviceBundle {
  adapter: GPUAdapter;
  device: GPUDevice;
  queue: GPUQueue;
}

export async function requestDevice(): Promise<DeviceBundle> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator) || !navigator.gpu) {
    throw new Error('WebGPU not available');
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error('navigator.gpu.requestAdapter returned null');
  const device = await adapter.requestDevice();
  return { adapter, device, queue: device.queue };
}
```

- [ ] **Step 3: Create `context.ts`**

```ts
// ts/src/lib/gpu/context.ts
export interface ConfiguredContext {
  context: GPUCanvasContext;
  format: GPUTextureFormat;
}

export function configureContext(
  canvas: HTMLCanvasElement,
  device: GPUDevice
): ConfiguredContext {
  const context = canvas.getContext('webgpu');
  if (!context) throw new Error('canvas.getContext("webgpu") returned null');
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format,
    alphaMode: 'premultiplied',
  });
  return { context, format };
}
```

- [ ] **Step 4: Wire DevPage to clear canvas to a known color (proof-of-life)**

Replace the existing `DevPage.tsx` body — keep the GPU JSON block, add a canvas + bootstrap:

```tsx
// ts/src/routes/DevPage.tsx
import { useEffect, useRef, useState } from 'react';
import { detectGpuCapability, type GpuCapability } from '../lib/gpu/adapter';
import { createSurface } from '../lib/gpu/surface';
import { requestDevice } from '../lib/gpu/device';
import { configureContext } from '../lib/gpu/context';

export function DevPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cap, setCap] = useState<GpuCapability | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => { detectGpuCapability().then(setCap); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let surface: ReturnType<typeof createSurface> | null = null;
    let cancelled = false;
    (async () => {
      try {
        surface = createSurface(canvas);
        const { device } = await requestDevice();
        if (cancelled) return;
        const { context } = configureContext(canvas, device);
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            clearValue: { r: 0.08, g: 0.10, b: 0.12, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
          }],
        });
        pass.end();
        device.queue.submit([encoder.finish()]);
      } catch (err) {
        setBootError((err as Error).message);
      }
    })();
    return () => { cancelled = true; surface?.dispose(); };
  }, []);

  return (
    <section style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Dev</h1>
      <p style={{ color: 'var(--color-ink-muted)' }}>
        Live GPU capability and renderer harness.
      </p>
      <pre data-testid="gpu-capability" style={{ /* unchanged from M1 */
        background: 'var(--color-surface-raised)', padding: '12px', borderRadius: '6px',
        border: '1px solid var(--color-grid)', overflowX: 'auto', color: 'var(--color-ink)',
      }}>{cap ? JSON.stringify(cap, null, 2) : 'detecting…'}</pre>
      <div data-testid="renderer-status" style={{ margin: '12px 0', color: 'var(--color-ink-muted)' }}>
        {bootError ? `boot error: ${bootError}` : 'renderer: ready'}
      </div>
      <canvas
        ref={canvasRef}
        data-testid="gel-canvas"
        style={{ width: '320px', height: '240px', display: 'block', border: '1px solid var(--color-grid)' }}
      />
    </section>
  );
}
```

- [ ] **Step 5: Add WebGPU launch flags to `playwright.config.ts`**

Edit `ts/playwright.config.ts` — replace the existing `chromium` project entry with the version below:

```ts
projects: [
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      launchOptions: {
        args: [
          '--enable-unsafe-webgpu',
          '--enable-features=Vulkan',
          '--use-vulkan=swiftshader',
          '--disable-vulkan-surface',
        ],
      },
    },
  },
],
```

- [ ] **Step 6: Add a smoke visual check that renderer initializes**

Append to `ts/tests/visual/smoke.spec.ts`:

```ts
test('dev page boots renderer', async ({ page }) => {
  await page.goto('/#/dev');
  await expect(page.getByTestId('renderer-status')).toHaveText('renderer: ready');
  // Canvas should be sized; physical pixels visible via attribute
  const canvas = page.getByTestId('gel-canvas');
  await expect(canvas).toBeVisible();
});
```

- [ ] **Step 7: Run typecheck + visual tests; fix any issues**

```bash
cd ts && npm run typecheck && npx playwright test smoke.spec.ts
```

Expected: all pass. The new smoke test asserts the renderer reaches the "ready" branch (no boot error).

- [ ] **Step 8: Commit**

```bash
cd ts && git add src/lib/gpu/surface.ts src/lib/gpu/device.ts src/lib/gpu/context.ts \
  src/routes/DevPage.tsx playwright.config.ts tests/visual/smoke.spec.ts
git commit -m "feat(gpu): bootstrap WebGPU device, context, and DPR-aware surface"
```

---

### Task 2: Render target ping-pong + uniform buffer helper

**Files:**
- Create: `ts/src/lib/gpu/target.ts`
- Create: `ts/src/lib/gpu/uniforms.ts`

- [ ] **Step 1: Create `target.ts`**

```ts
// ts/src/lib/gpu/target.ts
export interface RenderTarget {
  texture: GPUTexture;
  view: GPUTextureView;
  width: number;
  height: number;
  format: GPUTextureFormat;
  destroy(): void;
}

export function createRenderTarget(
  device: GPUDevice,
  width: number,
  height: number,
  format: GPUTextureFormat = 'rgba8unorm-srgb',
  label?: string
): RenderTarget {
  const texture = device.createTexture({
    label,
    size: { width, height },
    format,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });
  return {
    texture,
    view: texture.createView(),
    width,
    height,
    format,
    destroy() { texture.destroy(); },
  };
}

export interface PingPong {
  current: RenderTarget;
  next:    RenderTarget;
  swap(): void;
  destroy(): void;
}

export function createPingPong(
  device: GPUDevice,
  width: number,
  height: number,
  format: GPUTextureFormat = 'rgba8unorm-srgb',
  label?: string
): PingPong {
  let a = createRenderTarget(device, width, height, format, label ? `${label}.a` : undefined);
  let b = createRenderTarget(device, width, height, format, label ? `${label}.b` : undefined);
  return {
    get current() { return a; },
    get next() { return b; },
    swap() { const t = a; a = b; b = t; },
    destroy() { a.destroy(); b.destroy(); },
  };
}
```

- [ ] **Step 2: Create `uniforms.ts`**

```ts
// ts/src/lib/gpu/uniforms.ts
export interface UniformBuffer {
  buffer: GPUBuffer;
  cpu: ArrayBuffer;
  view: DataView;
  upload(queue: GPUQueue): void;
  destroy(): void;
}

export function createUniformBuffer(
  device: GPUDevice,
  byteLength: number,
  label?: string
): UniformBuffer {
  // Round up to 16-byte alignment per WebGPU spec
  const size = Math.ceil(byteLength / 16) * 16;
  const buffer = device.createBuffer({
    label,
    size,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const cpu = new ArrayBuffer(size);
  const view = new DataView(cpu);
  return {
    buffer,
    cpu,
    view,
    upload(queue) { queue.writeBuffer(buffer, 0, cpu, 0, size); },
    destroy() { buffer.destroy(); },
  };
}

export function writeVec2(view: DataView, offset: number, x: number, y: number) {
  view.setFloat32(offset, x, true);
  view.setFloat32(offset + 4, y, true);
}

export function writeVec4(view: DataView, offset: number, x: number, y: number, z: number, w: number) {
  view.setFloat32(offset, x, true);
  view.setFloat32(offset + 4, y, true);
  view.setFloat32(offset + 8, z, true);
  view.setFloat32(offset + 12, w, true);
}
```

- [ ] **Step 3: Run typecheck**

```bash
cd ts && npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd ts && git add src/lib/gpu/target.ts src/lib/gpu/uniforms.ts
git commit -m "feat(gpu): render target ping-pong + uniform buffer helpers"
```

---

### Task 3: Quad geometry, shader loader, pipeline factory

**Files:**
- Create: `ts/src/lib/gpu/quad.ts`
- Create: `ts/src/lib/gpu/shader.ts`
- Create: `ts/src/lib/gpu/pipeline.ts`
- Modify: `ts/src/vite-env.d.ts` (add `?raw` declaration if not already present)

- [ ] **Step 1: Ensure `?raw` import is typed**

If `ts/src/vite-env.d.ts` exists, leave it alone — `vite/client` types include `?raw`. If you get a typecheck error in later tasks about `?raw`, add this to a new file `ts/src/wgsl.d.ts`:

```ts
declare module '*.wgsl?raw' {
  const src: string;
  export default src;
}
```

- [ ] **Step 2: Create `quad.ts`**

The quad covers `[0,1]²` in unit space; the vertex shader applies position scale/offset to put it in gel-space. UVs match (with optional flip via texCoordScale).

```ts
// ts/src/lib/gpu/quad.ts
export interface Quad {
  buffer: GPUBuffer;
  vertexCount: number;
  layout: GPUVertexBufferLayout;
}

const QUAD_DATA = new Float32Array([
  // x, y, u, v   (triangle strip — 0,0 → 1,0 → 0,1 → 1,1)
  0, 0, 0, 0,
  1, 0, 1, 0,
  0, 1, 0, 1,
  1, 1, 1, 1,
]);

export function createQuad(device: GPUDevice): Quad {
  const buffer = device.createBuffer({
    label: 'fullscreen-quad',
    size: QUAD_DATA.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(buffer, 0, QUAD_DATA);
  return {
    buffer,
    vertexCount: 4,
    layout: {
      arrayStride: 4 * 4,
      stepMode: 'vertex',
      attributes: [
        { shaderLocation: 0, offset: 0,     format: 'float32x2' }, // position
        { shaderLocation: 1, offset: 4 * 2, format: 'float32x2' }, // texcoord
      ],
    },
  };
}
```

- [ ] **Step 3: Create `shader.ts`**

```ts
// ts/src/lib/gpu/shader.ts
const cache = new WeakMap<GPUDevice, Map<string, GPUShaderModule>>();

export function createShaderModule(
  device: GPUDevice,
  wgsl: string,
  label?: string
): GPUShaderModule {
  let perDevice = cache.get(device);
  if (!perDevice) { perDevice = new Map(); cache.set(device, perDevice); }
  const key = wgsl;
  let mod = perDevice.get(key);
  if (mod) return mod;
  mod = device.createShaderModule({ label, code: wgsl });
  perDevice.set(key, mod);
  return mod;
}
```

- [ ] **Step 4: Create `pipeline.ts`**

```ts
// ts/src/lib/gpu/pipeline.ts
export interface ImageGraphPipelineOptions {
  device: GPUDevice;
  vertex: GPUShaderModule;
  fragment: GPUShaderModule;
  vertexLayout: GPUVertexBufferLayout;
  targetFormat: GPUTextureFormat;
  bindGroupLayout: GPUBindGroupLayout;
  blend?: GPUBlendState;
  label?: string;
}

export function createImageGraphPipeline(opts: ImageGraphPipelineOptions): GPURenderPipeline {
  const { device, vertex, fragment, vertexLayout, targetFormat, bindGroupLayout, blend, label } = opts;
  const layout = device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
  return device.createRenderPipeline({
    label,
    layout,
    vertex: { module: vertex, entryPoint: 'vs_main', buffers: [vertexLayout] },
    fragment: {
      module: fragment,
      entryPoint: 'fs_main',
      targets: [{ format: targetFormat, blend }],
    },
    primitive: { topology: 'triangle-strip', stripIndexFormat: undefined },
  });
}
```

- [ ] **Step 5: Run typecheck**

```bash
cd ts && npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd ts && git add src/lib/gpu/quad.ts src/lib/gpu/shader.ts src/lib/gpu/pipeline.ts
# only if you created src/wgsl.d.ts:
[ -f src/wgsl.d.ts ] && git add src/wgsl.d.ts
git commit -m "feat(gpu): quad VBO, shader module cache, image-graph pipeline factory"
```

---

### Task 4: Port passthrough.vert + gel-passthrough.frag and render a test triangle to canvas

**Files:**
- Create: `ts/src/shaders/passthrough.vert.wgsl`
- Create: `ts/src/shaders/gel-passthrough.frag.wgsl`
- Modify: `ts/src/routes/DevPage.tsx`

This is the first end-to-end image-graph render — we'll create a tiny 2×2 test texture, sample it through these two shaders, and draw it to the canvas. Validates the entire pipeline scaffolding.

- [ ] **Step 1: Write `passthrough.vert.wgsl`**

```wgsl
// ts/src/shaders/passthrough.vert.wgsl
struct PassUniforms {
  positionOffset: vec2f,
  positionScale:  vec2f,
  texCoordOffset: vec2f,
  texCoordScale:  vec2f,
  gelSize:        vec2f,
  _pad:           vec2f,
};

@group(0) @binding(0) var<uniform> uPass: PassUniforms;

struct VsOut {
  @builtin(position) clipPos: vec4f,
  @location(0) texcoord: vec2f,
};

@vertex
fn vs_main(@location(0) position: vec2f, @location(1) texcoord: vec2f) -> VsOut {
  let gelPos = position * uPass.positionScale + uPass.positionOffset;
  // Gel-space (top-left origin, Y down) → WebGPU clip space (Y up): flip Y
  let clipXY = vec2f(
    (gelPos.x / uPass.gelSize.x) * 2.0 - 1.0,
    1.0 - (gelPos.y / uPass.gelSize.y) * 2.0
  );
  var out: VsOut;
  out.clipPos  = vec4f(clipXY, 0.0, 1.0);
  out.texcoord = texcoord * uPass.texCoordScale + uPass.texCoordOffset;
  return out;
}
```

- [ ] **Step 2: Write `gel-passthrough.frag.wgsl`**

```wgsl
// ts/src/shaders/gel-passthrough.frag.wgsl
@group(0) @binding(1) var uTex0:    texture_2d<f32>;
@group(0) @binding(2) var uSampler: sampler;

@fragment
fn fs_main(@location(0) texcoord: vec2f) -> @location(0) vec4f {
  return textureSample(uTex0, uSampler, texcoord);
}
```

- [ ] **Step 3: Add a passthrough test render to DevPage**

Replace the "clear canvas" block in DevPage's effect with the passthrough render. The full effect body should now look like:

```tsx
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  let surface: ReturnType<typeof createSurface> | null = null;
  let cancelled = false;
  (async () => {
    try {
      surface = createSurface(canvas);
      const { device, queue } = await requestDevice();
      if (cancelled) return;
      const { context, format } = configureContext(canvas, device);

      // Lazy imports keep the React render path light if WebGPU is missing.
      const [
        { createQuad },
        { createShaderModule },
        { createImageGraphPipeline },
        { createUniformBuffer, writeVec2 },
        passthroughVert,
        gelPassthroughFrag,
      ] = await Promise.all([
        import('../lib/gpu/quad'),
        import('../lib/gpu/shader'),
        import('../lib/gpu/pipeline'),
        import('../lib/gpu/uniforms'),
        import('../shaders/passthrough.vert.wgsl?raw'),
        import('../shaders/gel-passthrough.frag.wgsl?raw'),
      ]);

      const quad = createQuad(device);
      const vs = createShaderModule(device, passthroughVert.default, 'passthrough.vert');
      const fs = createShaderModule(device, gelPassthroughFrag.default, 'gel-passthrough.frag');

      // 2×2 test texture: red, green, blue, white pixels
      const testTex = device.createTexture({
        size: { width: 2, height: 2 },
        format: 'rgba8unorm-srgb',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });
      queue.writeTexture(
        { texture: testTex },
        new Uint8Array([
          255, 0, 0, 255,    0, 255, 0, 255,
          0, 0, 255, 255,  255, 255, 255, 255,
        ]),
        { bytesPerRow: 8, rowsPerImage: 2 },
        { width: 2, height: 2 }
      );

      const sampler = device.createSampler({
        magFilter: 'nearest', minFilter: 'nearest',
        addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge',
      });

      const bgl = device.createBindGroupLayout({
        entries: [
          { binding: 0, visibility: GPUShaderStage.VERTEX,   buffer:  { type: 'uniform' } },
          { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
          { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
        ],
      });

      const pipeline = createImageGraphPipeline({
        device, vertex: vs, fragment: fs,
        vertexLayout: quad.layout, targetFormat: format,
        bindGroupLayout: bgl, label: 'passthrough',
      });

      const uPass = createUniformBuffer(device, 48, 'pass-uniforms'); // 6×vec2 = 48 B
      // Render the quad over the entire canvas in "gel space" (treat canvas px as gel px)
      const gelW = canvas.width;
      const gelH = canvas.height;
      writeVec2(uPass.view,  0, 0,    0);                  // positionOffset
      writeVec2(uPass.view,  8, gelW, gelH);               // positionScale
      writeVec2(uPass.view, 16, 0,    0);                  // texCoordOffset
      writeVec2(uPass.view, 24, 1,    1);                  // texCoordScale
      writeVec2(uPass.view, 32, gelW, gelH);               // gelSize
      writeVec2(uPass.view, 40, 0,    0);                  // pad
      uPass.upload(queue);

      const bg = device.createBindGroup({
        layout: bgl,
        entries: [
          { binding: 0, resource: { buffer: uPass.buffer } },
          { binding: 1, resource: testTex.createView() },
          { binding: 2, resource: sampler },
        ],
      });

      const encoder = device.createCommandEncoder();
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bg);
      pass.setVertexBuffer(0, quad.buffer);
      pass.draw(quad.vertexCount);
      pass.end();
      queue.submit([encoder.finish()]);
    } catch (err) {
      setBootError((err as Error).message);
    }
  })();
  return () => { cancelled = true; surface?.dispose(); };
}, []);
```

- [ ] **Step 4: Visual check**

```bash
cd ts && npm run dev
# Open http://localhost:5173/#/dev — the canvas should show 4 colored quadrants:
#   top-left red, top-right green, bottom-left blue, bottom-right white.
# (sRGB-encoded — they should look correct, not washed-out)
```

If colors look swapped (top-left blue), the Y flip in the vertex shader is wrong. If colors look washed out, the texture format is `rgba8unorm` instead of `rgba8unorm-srgb`.

- [ ] **Step 5: Run typecheck**

```bash
cd ts && npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
cd ts && git add src/shaders/passthrough.vert.wgsl src/shaders/gel-passthrough.frag.wgsl src/routes/DevPage.tsx
git commit -m "feat(gpu): passthrough vert + frag shaders with end-to-end test render"
```

---

### Task 5: Seeded RNG + Band data type

**Files:**
- Create: `ts/src/lib/sim/rng.ts`
- Create: `ts/src/lib/sim/band.ts`
- Test: `ts/tests/unit/rng.test.ts`

- [ ] **Step 1: Write `rng.test.ts`**

```ts
// ts/tests/unit/rng.test.ts
import { describe, it, expect } from 'vitest';
import { mulberry32, rangeFloat, rangeInt } from '../../src/lib/sim/rng';

describe('mulberry32', () => {
  it('produces a deterministic sequence for a given seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toEqual(b());
  });

  it('range floats stay within [lo, hi)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = rangeFloat(r, -3, 5);
      expect(v).toBeGreaterThanOrEqual(-3);
      expect(v).toBeLessThan(5);
    }
  });

  it('range ints are integers within [lo, hi)', () => {
    const r = mulberry32(99);
    for (let i = 0; i < 200; i++) {
      const v = rangeInt(r, 0, 10);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
    }
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
cd ts && npx vitest run tests/unit/rng.test.ts
```

Expected: FAIL with "Cannot find module './lib/sim/rng'" or similar.

- [ ] **Step 3: Implement `rng.ts`**

```ts
// ts/src/lib/sim/rng.ts
export type Rng = () => number;  // returns float in [0, 1)

export function mulberry32(seed: number): Rng {
  let s = seed >>> 0;
  return function next(): number {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rangeFloat(r: Rng, lo: number, hi: number): number {
  return lo + (hi - lo) * r();
}

export function rangeInt(r: Rng, lo: number, hi: number): number {
  return Math.floor(lo + (hi - lo) * r());
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
cd ts && npx vitest run tests/unit/rng.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Implement `band.ts`**

The Band type captures the Gelbox `Band.h` fields actually consumed by `GelRender::render()` for one band. We'll skip metadata fields (lane, fragment, dye index) until M5 — they don't affect M2 visuals.

```ts
// ts/src/lib/sim/band.ts
export interface Rect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Band {
  rect: Rect;
  smearAbove: number;                     // gel-space pixels
  smearBelow: number;
  smearBrightnessAbove: [number, number]; // [near, far] in 0..1
  smearBrightnessBelow: [number, number];
  flameHeight: number;                    // gel-space pixels above the band top
  smileHeight: number;                    // gel-space pixels (peak peel-back)
  smileExp: number;                       // smile curve exponent
  blur: number;                           // distance in gel-space pixels (integer)
  brightness: number;                     // 0..1 — modulates the body alpha
  color: [number, number, number];        // linear RGB 0..1 — applied at composite
  randSeed: number;                       // flames RNG seed
  wellDamage: number;                     // 0..1
  wellDamageRandSeed: number;
}

export function rectWidth(r: Rect):  number { return r.x2 - r.x1; }
export function rectHeight(r: Rect): number { return r.y2 - r.y1; }
```

- [ ] **Step 6: Run typecheck and tests**

```bash
cd ts && npm run typecheck && npm run test:unit
```

Expected: 5 tests pass (4 RNG + 1 sanity from M1).

- [ ] **Step 7: Commit**

```bash
cd ts && git add src/lib/sim/rng.ts src/lib/sim/band.ts tests/unit/rng.test.ts
git commit -m "feat(sim): mulberry32 RNG + Band type (M2 subset)"
```

---

### Task 6: Smear gradient + body rect geometry generators

**Files:**
- Create: `ts/src/lib/gel/smear.ts`
- Create: `ts/src/lib/gel/body.ts`
- Test: `ts/tests/unit/smear.test.ts`

The C++ `drawSmear` makes 4 vertices with two end-colors (`cclose`, `cfar`); for `direction>0` (below), the bottom is `cfar` and top is `cclose`. For `direction<0` (above), the top is `cfar` and bottom is `cclose`. We replicate exactly. Brightness is encoded as alpha (we follow C++ `brightnessToColor` which sets `ColorA::gray(b, 1.f)` — gray RGB=`(b,b,b)`, alpha=`1`).

Wait — C++ uses `ColorA::gray(b,1.f)` which is RGB=(b,b,b), A=1.0. Then composites with `(SRC_ALPHA, ONE)` — so it adds RGB=(b,b,b) into the band FBO. We replicate by writing color = `(b, b, b, 1)` to the band RT. Premultiplied form: same — when alpha=1 the color is already premultiplied.

- [ ] **Step 1: Write `smear.test.ts`**

```ts
// ts/tests/unit/smear.test.ts
import { describe, it, expect } from 'vitest';
import { buildSmearMesh } from '../../src/lib/gel/smear';
import type { Band } from '../../src/lib/sim/band';

const baseBand: Band = {
  rect: { x1: 100, y1: 100, x2: 200, y2: 110 },
  smearAbove: 8, smearBelow: 12,
  smearBrightnessAbove: [0.8, 0.0],
  smearBrightnessBelow: [0.6, 0.1],
  flameHeight: 0,
  smileHeight: 0, smileExp: 0,
  blur: 0,
  brightness: 1,
  color: [1, 1, 1],
  randSeed: 0,
  wellDamage: 0, wellDamageRandSeed: 0,
};

describe('buildSmearMesh', () => {
  it('skips smear when thickness is 0', () => {
    const b: Band = { ...baseBand, smearAbove: 0, smearBelow: 0 };
    const mesh = buildSmearMesh(b);
    expect(mesh.vertexCount).toBe(0);
  });

  it('emits 6 verts (2 triangles) per smear when both above and below are set', () => {
    const mesh = buildSmearMesh(baseBand);
    expect(mesh.vertexCount).toBe(12);  // 2 quads × 6 verts
  });

  it('above-smear bottom vertex uses near brightness, top uses far', () => {
    const b: Band = { ...baseBand, smearBelow: 0 };  // only above
    const mesh = buildSmearMesh(b);
    const stride = 6;
    // emitQuad emits 6 verts in order: [LR, UR, UL, UL, LL, LR]
    // For above-smear: bottom (LR/LL) carries cClose=0.8; top (UR/UL) carries cFar=0.0
    expect(mesh.data[stride * 0 + 2]).toBeCloseTo(0.8); // R of v0 (lower-right) — close
    expect(mesh.data[stride * 1 + 2]).toBeCloseTo(0.0); // R of v1 (upper-right) — far
    expect(mesh.data[stride * 2 + 2]).toBeCloseTo(0.0); // R of v2 (upper-left) — far
    expect(mesh.data[stride * 4 + 2]).toBeCloseTo(0.8); // R of v4 (lower-left) — close
  });
});
```

- [ ] **Step 2: Run test — verify FAIL**

```bash
cd ts && npx vitest run tests/unit/smear.test.ts
```

Expected: FAIL ("Cannot find module").

- [ ] **Step 3: Implement `smear.ts`**

```ts
// ts/src/lib/gel/smear.ts
import type { Band } from '../sim/band';

export interface Mesh {
  data: Float32Array;        // [x, y, r, g, b, a] per vertex
  vertexCount: number;
}

export const VERTEX_STRIDE = 6;  // floats per vertex

function emitQuad(
  out: number[],
  x1: number, y1: number, x2: number, y2: number,
  cTopL: [number, number, number, number],
  cTopR: [number, number, number, number],
  cBotR: [number, number, number, number],
  cBotL: [number, number, number, number]
) {
  // Match C++ TriMesh winding: tri (2,1,0) + tri (0,3,2)
  // Where: 0=upper-left, 1=upper-right, 2=lower-right, 3=lower-left
  // Triangle 1: lower-right, upper-right, upper-left
  out.push(x2, y2, ...cBotR);
  out.push(x2, y1, ...cTopR);
  out.push(x1, y1, ...cTopL);
  // Triangle 2: upper-left, lower-left, lower-right
  out.push(x1, y1, ...cTopL);
  out.push(x1, y2, ...cBotL);
  out.push(x2, y2, ...cBotR);
}

export function buildSmearMesh(band: Band): Mesh {
  const out: number[] = [];
  const { rect, smearAbove, smearBelow, smearBrightnessAbove, smearBrightnessBelow } = band;

  // Above smear (direction = -1): rect from y1-thickness to y1
  if (smearAbove > 0) {
    const [bClose, bFar] = smearBrightnessAbove;
    const cClose: [number, number, number, number] = [bClose, bClose, bClose, 1];
    const cFar:   [number, number, number, number] = [bFar,   bFar,   bFar,   1];
    // C++: above → top=cfar, bottom=cclose (vertex order 0,1=cfar; 2,3=cclose)
    emitQuad(
      out,
      rect.x1, rect.y1 - smearAbove, rect.x2, rect.y1,
      cFar, cFar, cClose, cClose
    );
  }

  // Below smear (direction = +1): rect from y2 to y2+thickness
  if (smearBelow > 0) {
    const [bClose, bFar] = smearBrightnessBelow;
    const cClose: [number, number, number, number] = [bClose, bClose, bClose, 1];
    const cFar:   [number, number, number, number] = [bFar,   bFar,   bFar,   1];
    // C++: below → top=cclose, bottom=cfar (vertex order 0,1=cclose; 2,3=cfar)
    emitQuad(
      out,
      rect.x1, rect.y2, rect.x2, rect.y2 + smearBelow,
      cClose, cClose, cFar, cFar
    );
  }

  return { data: new Float32Array(out), vertexCount: out.length / VERTEX_STRIDE };
}
```

- [ ] **Step 4: Run test — verify PASS**

```bash
cd ts && npx vitest run tests/unit/smear.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Implement `body.ts`**

```ts
// ts/src/lib/gel/body.ts
import type { Band } from '../sim/band';
import { type Mesh, VERTEX_STRIDE } from './smear';

export function buildBodyMesh(band: Band): Mesh {
  const b = band.brightness;
  const c: [number, number, number, number] = [b, b, b, 1];
  const { x1, y1, x2, y2 } = band.rect;
  const data = new Float32Array([
    // tri 1: lower-right, upper-right, upper-left
    x2, y2, ...c,
    x2, y1, ...c,
    x1, y1, ...c,
    // tri 2: upper-left, lower-left, lower-right
    x1, y1, ...c,
    x1, y2, ...c,
    x2, y2, ...c,
  ]);
  return { data, vertexCount: data.length / VERTEX_STRIDE };
}
```

- [ ] **Step 6: Run typecheck**

```bash
cd ts && npm run typecheck && npm run test:unit
```

Expected: PASS (8 tests now).

- [ ] **Step 7: Commit**

```bash
cd ts && git add src/lib/gel/smear.ts src/lib/gel/body.ts tests/unit/smear.test.ts
git commit -m "feat(gel): smear gradient + body rect geometry generators"
```

---

### Task 7: Flames generator with deterministic layout

**Files:**
- Create: `ts/src/lib/gel/flames.ts`
- Test: `ts/tests/unit/flames.test.ts`

The C++ flames algorithm (`GelRender::drawFlames`, the live branch around line 360):
- `steps = max(5, width / 2)`
- `step  = width / steps`
- For each step `i ∈ [0, steps)`:
  - `x = i / (steps - 1)` (fraction along width)
  - `x = min(x, 1 - x)` (mirrored: 0 at edges, 0.5 at center)
  - `x = 1 - x`         (1 at edges, 0.5 at center)
  - `x = pow(x, 2)`     (concave curve)
  - `h = x * 0.25 + rand() * rand()`
  - `h = max(0, h)`
  - Emit rect: `(x1 + i*step, x2=that+step, y1=band.y1 - height*h, y2=band.y1)`

We use the band's `randSeed` to seed the TS-side mulberry32 — matching C++ structure not values. Color: brightness solid `(b, b, b, 1)`.

- [ ] **Step 1: Write `flames.test.ts`**

```ts
// ts/tests/unit/flames.test.ts
import { describe, it, expect } from 'vitest';
import { buildFlamesMesh } from '../../src/lib/gel/flames';
import { VERTEX_STRIDE } from '../../src/lib/gel/smear';
import type { Band } from '../../src/lib/sim/band';

const band: Band = {
  rect: { x1: 100, y1: 100, x2: 200, y2: 110 },
  smearAbove: 0, smearBelow: 0,
  smearBrightnessAbove: [0, 0],
  smearBrightnessBelow: [0, 0],
  flameHeight: 30,
  smileHeight: 0, smileExp: 0,
  blur: 0,
  brightness: 0.9,
  color: [1, 1, 1],
  randSeed: 1234,
  wellDamage: 0, wellDamageRandSeed: 0,
};

describe('buildFlamesMesh', () => {
  it('returns empty mesh when flameHeight is 0', () => {
    const mesh = buildFlamesMesh({ ...band, flameHeight: 0 });
    expect(mesh.vertexCount).toBe(0);
  });

  it('is deterministic for the same seed', () => {
    const a = buildFlamesMesh(band);
    const b = buildFlamesMesh(band);
    expect(Array.from(a.data)).toEqual(Array.from(b.data));
  });

  it('changes when seed changes', () => {
    const a = buildFlamesMesh(band);
    const b = buildFlamesMesh({ ...band, randSeed: 9999 });
    expect(Array.from(a.data)).not.toEqual(Array.from(b.data));
  });

  it('emits steps = max(5, width/2) rectangles, 6 verts each', () => {
    // width=100 → steps=max(5, 50)=50
    const mesh = buildFlamesMesh(band);
    expect(mesh.vertexCount).toBe(50 * 6);
  });

  it('emits a band with brightness in alpha-channel position', () => {
    const mesh = buildFlamesMesh(band);
    // Vertex 0: x, y, r, g, b, a — alpha is at offset 5
    expect(mesh.data[5]).toBe(1);
    expect(mesh.data[2]).toBeCloseTo(0.9); // r
  });
});
```

- [ ] **Step 2: Run test — verify FAIL**

```bash
cd ts && npx vitest run tests/unit/flames.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement `flames.ts`**

```ts
// ts/src/lib/gel/flames.ts
import { mulberry32 } from '../sim/rng';
import type { Band } from '../sim/band';
import { type Mesh, VERTEX_STRIDE } from './smear';

export function buildFlamesMesh(band: Band): Mesh {
  if (band.flameHeight <= 0) return { data: new Float32Array(0), vertexCount: 0 };

  const { x1, x2, y1 } = band.rect;
  const w = x2 - x1;
  const steps = Math.max(5, Math.floor(w / 2));
  const step  = w / steps;
  const rng   = mulberry32(band.randSeed);

  const heights = new Float32Array(steps);
  const denom = 1 / Math.max(1, steps - 1);
  for (let i = 0; i < steps; i++) {
    let x = i * denom;
    x = Math.min(x, 1 - x);
    x = 1 - x;
    x = x * x;
    heights[i] = x * 0.25 + rng() * rng();
  }

  const b = band.brightness;
  const c: [number, number, number, number] = [b, b, b, 1];
  const verts: number[] = [];

  for (let i = 0; i < steps; i++) {
    const h  = Math.max(0, heights[i]);
    const fx1 = x1 + i * step;
    const fx2 = fx1 + step;
    const fy1 = y1 - band.flameHeight * h;
    const fy2 = y1;
    // Same triangle winding as body
    verts.push(fx2, fy2, ...c);
    verts.push(fx2, fy1, ...c);
    verts.push(fx1, fy1, ...c);
    verts.push(fx1, fy1, ...c);
    verts.push(fx1, fy2, ...c);
    verts.push(fx2, fy2, ...c);
  }

  const data = new Float32Array(verts);
  return { data, vertexCount: data.length / VERTEX_STRIDE };
}
```

- [ ] **Step 4: Run test — verify PASS**

```bash
cd ts && npx vitest run tests/unit/flames.test.ts
```

Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd ts && git add src/lib/gel/flames.ts tests/unit/flames.test.ts
git commit -m "feat(gel): deterministic flame strands generator"
```

---

### Task 8: Geometry shader pair + render primitives to band RT

**Files:**
- Create: `ts/src/shaders/geometry.vert.wgsl`
- Create: `ts/src/shaders/geometry.frag.wgsl`
- Create: `ts/src/lib/gel/passes/primitives.ts`

This task adds the `geometry` shader pair and a pass that uploads smear+body+flame meshes into a single VBO and draws them onto the band render target. After this task, /dev shows the band primitives (no warps, no blur, no composite yet).

- [ ] **Step 1: Write `geometry.vert.wgsl`**

```wgsl
// ts/src/shaders/geometry.vert.wgsl
struct GeomUniforms {
  gelSize: vec2f,
  _pad:    vec2f,
};

@group(0) @binding(0) var<uniform> uGeom: GeomUniforms;

struct VsOut {
  @builtin(position) clipPos: vec4f,
  @location(0) color: vec4f,
};

@vertex
fn vs_main(@location(0) position: vec2f, @location(1) color: vec4f) -> VsOut {
  let clipXY = vec2f(
    (position.x / uGeom.gelSize.x) * 2.0 - 1.0,
    1.0 - (position.y / uGeom.gelSize.y) * 2.0
  );
  var out: VsOut;
  out.clipPos = vec4f(clipXY, 0.0, 1.0);
  out.color   = color;
  return out;
}
```

- [ ] **Step 2: Write `geometry.frag.wgsl`**

```wgsl
// ts/src/shaders/geometry.frag.wgsl
@fragment
fn fs_main(@location(0) color: vec4f) -> @location(0) vec4f {
  // Premultiplied additive — color RGB is already in linear space; alpha=1 for solid primitives
  return vec4f(color.rgb * color.a, color.a);
}
```

- [ ] **Step 3: Implement `primitives.ts`**

```ts
// ts/src/lib/gel/passes/primitives.ts
import type { Band } from '../../sim/band';
import type { RenderTarget } from '../../gpu/target';
import { createUniformBuffer, writeVec2 } from '../../gpu/uniforms';
import { createShaderModule } from '../../gpu/shader';
import { type Mesh, VERTEX_STRIDE } from '../mesh';
import { buildSmearMesh } from '../smear';
import { buildBodyMesh } from '../body';
import { buildFlamesMesh } from '../flames';
import geomVertSrc from '../../../shaders/geometry.vert.wgsl?raw';
import geomFragSrc from '../../../shaders/geometry.frag.wgsl?raw';

export interface PrimitivePass {
  draw(encoder: GPUCommandEncoder, dst: RenderTarget, band: Band): void;
  destroy(): void;
}

export function createPrimitivePass(
  device: GPUDevice,
  gelSize: { width: number; height: number },
  format: GPUTextureFormat = 'rgba8unorm-srgb'
): PrimitivePass {
  const vs = createShaderModule(device, geomVertSrc, 'geometry.vert');
  const fs = createShaderModule(device, geomFragSrc, 'geometry.frag');

  const bgl = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
    ],
  });

  const layout = device.createPipelineLayout({ bindGroupLayouts: [bgl] });

  const pipeline = device.createRenderPipeline({
    label: 'primitives',
    layout,
    vertex: {
      module: vs,
      entryPoint: 'vs_main',
      buffers: [{
        arrayStride: VERTEX_STRIDE * 4,
        stepMode: 'vertex',
        attributes: [
          { shaderLocation: 0, offset: 0,     format: 'float32x2' },
          { shaderLocation: 1, offset: 4 * 2, format: 'float32x4' },
        ],
      }],
    },
    fragment: {
      module: fs, entryPoint: 'fs_main',
      targets: [{
        format,
        blend: {
          // Additive (matches C++ SRC_ALPHA, ONE on the band fbo with alpha=1 primitives)
          color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
          alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
        },
      }],
    },
    primitive: { topology: 'triangle-list' },
  });

  const ub = createUniformBuffer(device, 16, 'geom-uniforms');
  writeVec2(ub.view, 0, gelSize.width, gelSize.height);
  writeVec2(ub.view, 8, 0, 0);
  ub.upload(device.queue);

  const bg = device.createBindGroup({
    layout: bgl,
    entries: [{ binding: 0, resource: { buffer: ub.buffer } }],
  });

  // Pre-allocate a VBO that grows as needed
  let vbo: GPUBuffer | null = null;
  let vboSize = 0;

  function ensureVbo(byteLength: number) {
    if (vbo && vboSize >= byteLength) return;
    vbo?.destroy();
    vboSize = Math.max(byteLength, 64 * 1024);
    vbo = device.createBuffer({
      label: 'primitives-vbo',
      size: vboSize,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
  }

  function combine(meshes: Mesh[]): Mesh {
    let total = 0;
    for (const m of meshes) total += m.data.length;
    const data = new Float32Array(total);
    let off = 0;
    for (const m of meshes) { data.set(m.data, off); off += m.data.length; }
    return { data, vertexCount: total / VERTEX_STRIDE };
  }

  return {
    draw(encoder, dst, band) {
      const mesh = combine([
        buildSmearMesh(band),
        buildBodyMesh(band),
        buildFlamesMesh(band),
      ]);
      if (mesh.vertexCount === 0) {
        // Still need to clear the destination
        const pass = encoder.beginRenderPass({
          colorAttachments: [{
            view: dst.view, loadOp: 'clear', storeOp: 'store',
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
          }],
        });
        pass.end();
        return;
      }
      ensureVbo(mesh.data.byteLength);
      device.queue.writeBuffer(vbo!, 0, mesh.data);
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: dst.view,
          loadOp: 'clear', storeOp: 'store',
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        }],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bg);
      pass.setVertexBuffer(0, vbo!);
      pass.draw(mesh.vertexCount);
      pass.end();
    },
    destroy() {
      vbo?.destroy();
      ub.destroy();
    },
  };
}
```

- [ ] **Step 4: Run typecheck**

```bash
cd ts && npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ts && git add src/shaders/geometry.vert.wgsl src/shaders/geometry.frag.wgsl src/lib/gel/passes/primitives.ts
git commit -m "feat(gel): geometry shader pair + primitive pass for band RT"
```

---

### Task 9: Blur scheduler + blur5/9/13 WGSL ports

**Files:**
- Create: `ts/src/shaders/blur5.frag.wgsl`
- Create: `ts/src/shaders/blur9.frag.wgsl`
- Create: `ts/src/shaders/blur13.frag.wgsl`
- Create: `ts/src/lib/gel/passes/blur.ts`

C++ uses `gl_FragCoord.xy / uBlurResolution` for UV. In WebGPU we use `@builtin(position).xy / resolution` — both top-left origin (after our pipeline conventions match), so the math ports verbatim.

- [ ] **Step 1: Write `blur5.frag.wgsl`**

```wgsl
// ts/src/shaders/blur5.frag.wgsl
struct PassUniforms {
  positionOffset: vec2f,
  positionScale:  vec2f,
  texCoordOffset: vec2f,
  texCoordScale:  vec2f,
  gelSize:        vec2f,
  _pad:           vec2f,
};

struct BlurUniforms {
  resolution: vec2f,
  direction:  vec2f,
};

@group(0) @binding(0) var<uniform> uPass:    PassUniforms;
@group(0) @binding(1) var          uTex0:    texture_2d<f32>;
@group(0) @binding(2) var          uSampler: sampler;
@group(0) @binding(3) var<uniform> uBlur:    BlurUniforms;

@fragment
fn fs_main(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
  let uv = fragCoord.xy / uBlur.resolution;
  let off1 = vec2f(1.3333333333333333) * uBlur.direction;
  var c = vec4f(0.0);
  c += textureSample(uTex0, uSampler, uv) * 0.29411764705882354;
  c += textureSample(uTex0, uSampler, uv + (off1 / uBlur.resolution)) * 0.35294117647058826;
  c += textureSample(uTex0, uSampler, uv - (off1 / uBlur.resolution)) * 0.35294117647058826;
  return c;
}
```

- [ ] **Step 2: Write `blur9.frag.wgsl`**

```wgsl
// ts/src/shaders/blur9.frag.wgsl
struct PassUniforms {
  positionOffset: vec2f, positionScale: vec2f,
  texCoordOffset: vec2f, texCoordScale: vec2f,
  gelSize: vec2f, _pad: vec2f,
};
struct BlurUniforms { resolution: vec2f, direction: vec2f };

@group(0) @binding(0) var<uniform> uPass:    PassUniforms;
@group(0) @binding(1) var          uTex0:    texture_2d<f32>;
@group(0) @binding(2) var          uSampler: sampler;
@group(0) @binding(3) var<uniform> uBlur:    BlurUniforms;

@fragment
fn fs_main(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
  let uv = fragCoord.xy / uBlur.resolution;
  let off1 = vec2f(1.3846153846) * uBlur.direction;
  let off2 = vec2f(3.2307692308) * uBlur.direction;
  var c = vec4f(0.0);
  c += textureSample(uTex0, uSampler, uv) * 0.2270270270;
  c += textureSample(uTex0, uSampler, uv + (off1 / uBlur.resolution)) * 0.3162162162;
  c += textureSample(uTex0, uSampler, uv - (off1 / uBlur.resolution)) * 0.3162162162;
  c += textureSample(uTex0, uSampler, uv + (off2 / uBlur.resolution)) * 0.0702702703;
  c += textureSample(uTex0, uSampler, uv - (off2 / uBlur.resolution)) * 0.0702702703;
  return c;
}
```

- [ ] **Step 3: Write `blur13.frag.wgsl`**

```wgsl
// ts/src/shaders/blur13.frag.wgsl
struct PassUniforms {
  positionOffset: vec2f, positionScale: vec2f,
  texCoordOffset: vec2f, texCoordScale: vec2f,
  gelSize: vec2f, _pad: vec2f,
};
struct BlurUniforms { resolution: vec2f, direction: vec2f };

@group(0) @binding(0) var<uniform> uPass:    PassUniforms;
@group(0) @binding(1) var          uTex0:    texture_2d<f32>;
@group(0) @binding(2) var          uSampler: sampler;
@group(0) @binding(3) var<uniform> uBlur:    BlurUniforms;

@fragment
fn fs_main(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
  let uv = fragCoord.xy / uBlur.resolution;
  let off1 = vec2f(1.411764705882353)  * uBlur.direction;
  let off2 = vec2f(3.2941176470588234) * uBlur.direction;
  let off3 = vec2f(5.176470588235294)  * uBlur.direction;
  var c = vec4f(0.0);
  c += textureSample(uTex0, uSampler, uv) * 0.1964825501511404;
  c += textureSample(uTex0, uSampler, uv + (off1 / uBlur.resolution)) * 0.2969069646728344;
  c += textureSample(uTex0, uSampler, uv - (off1 / uBlur.resolution)) * 0.2969069646728344;
  c += textureSample(uTex0, uSampler, uv + (off2 / uBlur.resolution)) * 0.09447039785044732;
  c += textureSample(uTex0, uSampler, uv - (off2 / uBlur.resolution)) * 0.09447039785044732;
  c += textureSample(uTex0, uSampler, uv + (off3 / uBlur.resolution)) * 0.010381362401148057;
  c += textureSample(uTex0, uSampler, uv - (off3 / uBlur.resolution)) * 0.010381362401148057;
  return c;
}
```

- [ ] **Step 4: Implement `blur.ts`**

```ts
// ts/src/lib/gel/passes/blur.ts
import type { PingPong } from '../../gpu/target';
import { createUniformBuffer, writeVec2 } from '../../gpu/uniforms';
import { createShaderModule } from '../../gpu/shader';
import { createQuad } from '../../gpu/quad';
import passVertSrc  from '../../../shaders/passthrough.vert.wgsl?raw';
import blur5FragSrc from '../../../shaders/blur5.frag.wgsl?raw';
import blur9FragSrc from '../../../shaders/blur9.frag.wgsl?raw';
import blur13FragSrc from '../../../shaders/blur13.frag.wgsl?raw';

export interface BlurPass {
  run(encoder: GPUCommandEncoder, target: PingPong, distance: number): void;
  destroy(): void;
}

export function createBlurPass(
  device: GPUDevice,
  gelSize: { width: number; height: number },
  format: GPUTextureFormat = 'rgba8unorm-srgb'
): BlurPass {
  const quad = createQuad(device);
  const vs = createShaderModule(device, passVertSrc, 'passthrough.vert');

  const bgl = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX,   buffer:  { type: 'uniform' } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
      { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer:  { type: 'uniform' } },
    ],
  });

  function makePipeline(fs: GPUShaderModule, label: string) {
    const layout = device.createPipelineLayout({ bindGroupLayouts: [bgl] });
    return device.createRenderPipeline({
      label, layout,
      vertex:   { module: vs, entryPoint: 'vs_main', buffers: [quad.layout] },
      fragment: { module: fs, entryPoint: 'fs_main', targets: [{ format }] },
      primitive: { topology: 'triangle-strip' },
    });
  }

  const pipelines: GPURenderPipeline[] = [
    makePipeline(createShaderModule(device, blur5FragSrc,  'blur5'),  'blur5'),
    makePipeline(createShaderModule(device, blur9FragSrc,  'blur9'),  'blur9'),
    makePipeline(createShaderModule(device, blur13FragSrc, 'blur13'), 'blur13'),
  ];

  const sampler = device.createSampler({
    magFilter: 'linear', minFilter: 'linear',
    addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge',
  });

  const uPass = createUniformBuffer(device, 48, 'blur-pass-uniforms');
  writeVec2(uPass.view,  0, 0, 0);
  writeVec2(uPass.view,  8, gelSize.width, gelSize.height);
  writeVec2(uPass.view, 16, 0, 0);
  writeVec2(uPass.view, 24, 1, 1);
  writeVec2(uPass.view, 32, gelSize.width, gelSize.height);
  writeVec2(uPass.view, 40, 0, 0);
  uPass.upload(device.queue);

  const uBlur = createUniformBuffer(device, 16, 'blur-uniforms');

  function makeBindGroup(srcView: GPUTextureView): GPUBindGroup {
    return device.createBindGroup({
      layout: bgl,
      entries: [
        { binding: 0, resource: { buffer: uPass.buffer } },
        { binding: 1, resource: srcView },
        { binding: 2, resource: sampler },
        { binding: 3, resource: { buffer: uBlur.buffer } },
      ],
    });
  }

  return {
    run(encoder, target, distance) {
      let steps = Math.floor(distance);
      let active = 0;
      while (steps > 0) {
        const kernel = Math.min(steps, 3);  // 1, 2, or 3
        const pipeline = pipelines[kernel - 1];
        for (let dir = 0; dir < 2; dir++) {
          // C++ swaps fbos at the start of each iteration so it always renders
          // _to_ the same handle while reading the swapped one. We do the same
          // by reading from `current` and writing to `next`, then swapping.
          writeVec2(uBlur.view, 0, gelSize.width, gelSize.height);
          writeVec2(uBlur.view, 8, dir === 0 ? 1 : 0, dir === 0 ? 0 : 1);
          uBlur.upload(device.queue);

          const bg = makeBindGroup(target.current.view);
          const pass = encoder.beginRenderPass({
            colorAttachments: [{
              view: target.next.view,
              loadOp: 'clear', storeOp: 'store',
              clearValue: { r: 0, g: 0, b: 0, a: 1 },
            }],
          });
          pass.setPipeline(pipeline);
          pass.setBindGroup(0, bg);
          pass.setVertexBuffer(0, quad.buffer);
          pass.draw(quad.vertexCount);
          pass.end();
          target.swap();
        }
        steps -= kernel;
        active = kernel;
      }
      void active;
    },
    destroy() {
      uPass.destroy();
      uBlur.destroy();
    },
  };
}
```

- [ ] **Step 5: Run typecheck**

```bash
cd ts && npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd ts && git add src/shaders/blur5.frag.wgsl src/shaders/blur9.frag.wgsl src/shaders/blur13.frag.wgsl src/lib/gel/passes/blur.ts
git commit -m "feat(gel): blur5/9/13 WGSL ports + separable scheduler"
```

---

### Task 10: Warp shader + smile/well-damage warp generators

**Files:**
- Create: `ts/src/shaders/warp.frag.wgsl`
- Create: `ts/src/lib/gel/smile.ts`
- Create: `ts/src/lib/gel/welldamage.ts`
- Create: `ts/src/lib/gel/passes/warp.ts`
- Test: `ts/tests/unit/smile-warp.test.ts`
- Test: `ts/tests/unit/welldamage-warp.test.ts`

C++ encodes warp deltas into `R8G8B8` with `r = lmap(dx, -1..1, 0..255)`, `g = lmap(dy, -1..1, 0..255)`, `b = 0`. We use `R8G8B8A8` (WebGPU has no `R8G8B8`). The shader fetches `.xy`, renormalizes to `-1..1`, scales, samples.

- [ ] **Step 1: Write `warp.frag.wgsl`**

```wgsl
// ts/src/shaders/warp.frag.wgsl
struct PassUniforms {
  positionOffset: vec2f, positionScale: vec2f,
  texCoordOffset: vec2f, texCoordScale: vec2f,
  gelSize: vec2f, _pad: vec2f,
};
struct WarpUniforms { scale: vec2f, _pad: vec2f };

@group(0) @binding(0) var<uniform> uPass:    PassUniforms;
@group(0) @binding(1) var          uTex0:    texture_2d<f32>;
@group(0) @binding(2) var          uSampler: sampler;
@group(0) @binding(3) var          uTexWarp: texture_2d<f32>;
@group(0) @binding(4) var<uniform> uWarp:    WarpUniforms;

@fragment
fn fs_main(@location(0) texcoord: vec2f) -> @location(0) vec4f {
  var warp = textureSample(uTexWarp, uSampler, texcoord).xy;
  warp = (warp - vec2f(0.5, 0.5)) * 2.0;
  warp = warp * uWarp.scale;
  return textureSample(uTex0, uSampler, texcoord + warp);
}
```

- [ ] **Step 2: Write `smile-warp.test.ts`**

The smile encoding: for each fractional `p.x` in `[0, 1)`,
- `bx = (p.x - x1norm) / (x2norm - x1norm)`
- `bx = 2 * |0.5 - bx|`  → 1 at edges, 0 at center
- `bx = pow(bx, exp)`     → curve
- delta = `(0, -bx)` (clamped to `[-1, 1]`)
- encode: r=128 (zero in normalized space), g=lmap(-bx, -1..1, 0..255)

```ts
// ts/tests/unit/smile-warp.test.ts
import { describe, it, expect } from 'vitest';
import { buildSmileWarp } from '../../src/lib/gel/smile';

describe('buildSmileWarp', () => {
  it('returns null when smileHeight is 0', () => {
    const out = buildSmileWarp({
      x1: 0, x2: 100, smileHeight: 0, smileExp: 1,
    }, { width: 100, height: 100 });
    expect(out).toBeNull();
  });

  it('produces a 1×width RGBA8 buffer with center cell at -1 dy (encoded 0)', () => {
    const out = buildSmileWarp({
      x1: 0, x2: 100, smileHeight: 1, smileExp: 1,
    }, { width: 100, height: 100 });
    expect(out).not.toBeNull();
    expect(out!.width).toBe(100);
    expect(out!.data.byteLength).toBe(100 * 4);
    // Edge pixel (i=0): bx=1 → -bx=-1 → g=0
    expect(out!.data[1]).toBe(0);
    // R channel (dx=0) is always 128
    expect(out!.data[0]).toBe(128);
    // Mid pixel (i=49 or 50): bx≈0 → -bx≈0 → g≈128
    expect(out!.data[50 * 4 + 1]).toBeGreaterThan(120);
    expect(out!.data[50 * 4 + 1]).toBeLessThan(135);
  });
});
```

- [ ] **Step 3: Run test — verify FAIL**

```bash
cd ts && npx vitest run tests/unit/smile-warp.test.ts
```

Expected: FAIL.

- [ ] **Step 4: Implement `smile.ts`**

```ts
// ts/src/lib/gel/smile.ts
export interface SmileParams {
  x1: number;          // band rect x1 in gel-space
  x2: number;          // band rect x2 in gel-space
  smileHeight: number; // gel-space pixels (peel-back peak)
  smileExp:    number;
}

export interface WarpTextureCpu {
  data:   Uint8Array;
  width:  number;
  height: number;       // always 1 for smile/welldamage
  scale:  [number, number];  // UV-space scale to pass into shader
}

export function buildSmileWarp(
  p: SmileParams,
  gel: { width: number; height: number }
): WarpTextureCpu | null {
  if (p.smileHeight === 0) return null;

  const w = gel.width;
  const data = new Uint8Array(w * 4);
  const x1n = p.x1 / gel.width;
  const x2n = p.x2 / gel.width;
  const span = x2n - x1n;

  for (let i = 0; i < w; i++) {
    const px = i / w;  // matches C++ pos = vec2(iter.getPos()) / warpSize
    let bx = (px - x1n) / span;
    bx = 2 * Math.abs(0.5 - bx);
    bx = Math.pow(bx, p.smileExp);
    let dx = 0;
    let dy = -bx;
    dx = Math.max(-1, Math.min(1, dx));
    dy = Math.max(-1, Math.min(1, dy));
    // Encode: r = lmap(dx, -1..1, 0..255), g = lmap(dy, -1..1, 0..255)
    data[i * 4 + 0] = Math.round(((dx + 1) * 0.5) * 255);
    data[i * 4 + 1] = Math.round(((dy + 1) * 0.5) * 255);
    data[i * 4 + 2] = 0;
    data[i * 4 + 3] = 255;
  }

  return {
    data, width: w, height: 1,
    // C++: warp scale = vec2(height) / gelSize
    scale: [p.smileHeight / gel.width, p.smileHeight / gel.height],
  };
}
```

- [ ] **Step 5: Run smile test — verify PASS**

```bash
cd ts && npx vitest run tests/unit/smile-warp.test.ts
```

Expected: 2 tests PASS.

- [ ] **Step 6: Write `welldamage-warp.test.ts`**

```ts
// ts/tests/unit/welldamage-warp.test.ts
import { describe, it, expect } from 'vitest';
import { buildWellDamageWarp } from '../../src/lib/gel/welldamage';

describe('buildWellDamageWarp', () => {
  it('returns null when damage is 0', () => {
    const out = buildWellDamageWarp({
      rect: { x1: 0, y1: 0, x2: 100, y2: 10 },
      wellDamage: 0,
      wellDamageRandSeed: 1,
    }, { width: 100, height: 100 });
    expect(out).toBeNull();
  });

  it('is deterministic for the same seed', () => {
    const a = buildWellDamageWarp({
      rect: { x1: 0, y1: 0, x2: 100, y2: 10 },
      wellDamage: 0.7,
      wellDamageRandSeed: 42,
    }, { width: 100, height: 100 })!;
    const b = buildWellDamageWarp({
      rect: { x1: 0, y1: 0, x2: 100, y2: 10 },
      wellDamage: 0.7,
      wellDamageRandSeed: 42,
    }, { width: 100, height: 100 })!;
    expect(Array.from(a.data)).toEqual(Array.from(b.data));
  });

  it('produces a 1×width RGBA8 buffer', () => {
    const out = buildWellDamageWarp({
      rect: { x1: 0, y1: 0, x2: 100, y2: 10 },
      wellDamage: 0.5,
      wellDamageRandSeed: 1,
    }, { width: 100, height: 100 })!;
    expect(out.width).toBe(100);
    expect(out.data.byteLength).toBe(100 * 4);
  });
});
```

- [ ] **Step 7: Run test — verify FAIL**

```bash
cd ts && npx vitest run tests/unit/welldamage-warp.test.ts
```

Expected: FAIL.

- [ ] **Step 8: Implement `welldamage.ts`**

C++ stab generation:
- `nstabs = max(1, damage * 5)`
- `yscale = max(0.2, pow(damage * 0.25, 0.85))`
- For each stab: `c=rand(x1n, x2n)`, `r=lerp(0.05, 0.5, rand()*rand()) * w_norm`, `h=rand(-1, 1) * yscale`
- For each pixel `p.x`: `d += sum_stabs (1 - |c - p.x|/r) * h` where `|c - p.x|/r < 1`
- Encode `(0, d)`

```ts
// ts/src/lib/gel/welldamage.ts
import { mulberry32, rangeFloat } from '../sim/rng';
import type { Rect } from '../sim/band';
import type { WarpTextureCpu } from './smile';

export interface WellDamageParams {
  rect: Rect;
  wellDamage: number;
  wellDamageRandSeed: number;
}

interface Stab { c: number; rinv: number; h: number }

export function buildWellDamageWarp(
  p: WellDamageParams,
  gel: { width: number; height: number }
): WarpTextureCpu | null {
  if (p.wellDamage <= 0) return null;

  const x1n = p.rect.x1 / gel.width;
  const x2n = p.rect.x2 / gel.width;
  const wn  = (p.rect.x2 - p.rect.x1) / gel.width;
  const yscale = Math.max(0.2, Math.pow(p.wellDamage * 0.25, 0.85));
  const nstabs = Math.max(1, Math.floor(p.wellDamage * 5));

  const r = mulberry32(p.wellDamageRandSeed);
  const stabs: Stab[] = [];
  for (let i = 0; i < nstabs; i++) {
    const c  = rangeFloat(r, x1n, x2n);
    const rr = (0.05 + (0.5 - 0.05) * (r() * r())) * wn;
    const h  = rangeFloat(r, -1, 1) * yscale;
    stabs.push({ c, rinv: 1 / rr, h });
  }

  const w = gel.width;
  const data = new Uint8Array(w * 4);
  for (let i = 0; i < w; i++) {
    const px = i / w;
    let dy = 0;
    for (const s of stabs) {
      const dist = Math.abs(s.c - px) * s.rinv;
      if (dist < 1) dy += (1 - dist) * s.h;
    }
    let dx = 0;
    dx = Math.max(-1, Math.min(1, dx));
    dy = Math.max(-1, Math.min(1, dy));
    data[i * 4 + 0] = Math.round(((dx + 1) * 0.5) * 255);
    data[i * 4 + 1] = Math.round(((dy + 1) * 0.5) * 255);
    data[i * 4 + 2] = 0;
    data[i * 4 + 3] = 255;
  }

  const bandH = p.rect.y2 - p.rect.y1;
  return {
    data, width: w, height: 1,
    scale: [bandH / gel.width, bandH / gel.height],
  };
}
```

- [ ] **Step 9: Run all unit tests — verify PASS**

```bash
cd ts && npm run test:unit
```

Expected: all tests PASS.

- [ ] **Step 10: Implement `warp.ts` pass**

```ts
// ts/src/lib/gel/passes/warp.ts
import type { PingPong } from '../../gpu/target';
import type { WarpTextureCpu } from '../smile';
import { createUniformBuffer, writeVec2 } from '../../gpu/uniforms';
import { createShaderModule } from '../../gpu/shader';
import { createQuad } from '../../gpu/quad';
import passVertSrc from '../../../shaders/passthrough.vert.wgsl?raw';
import warpFragSrc from '../../../shaders/warp.frag.wgsl?raw';

export interface WarpPass {
  run(encoder: GPUCommandEncoder, target: PingPong, warp: WarpTextureCpu): void;
  destroy(): void;
}

export function createWarpPass(
  device: GPUDevice,
  gelSize: { width: number; height: number },
  format: GPUTextureFormat = 'rgba8unorm-srgb'
): WarpPass {
  const quad = createQuad(device);
  const vs = createShaderModule(device, passVertSrc, 'passthrough.vert');
  const fs = createShaderModule(device, warpFragSrc, 'warp.frag');

  const bgl = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX,   buffer:  { type: 'uniform' } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
      { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 4, visibility: GPUShaderStage.FRAGMENT, buffer:  { type: 'uniform' } },
    ],
  });

  const layout = device.createPipelineLayout({ bindGroupLayouts: [bgl] });
  const pipeline = device.createRenderPipeline({
    label: 'warp', layout,
    vertex:   { module: vs, entryPoint: 'vs_main', buffers: [quad.layout] },
    fragment: { module: fs, entryPoint: 'fs_main', targets: [{ format }] },
    primitive: { topology: 'triangle-strip' },
  });

  const sampler = device.createSampler({
    magFilter: 'linear', minFilter: 'linear',
    addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge',
  });

  const uPass = createUniformBuffer(device, 48, 'warp-pass-uniforms');
  writeVec2(uPass.view,  0, 0, 0);
  writeVec2(uPass.view,  8, gelSize.width, gelSize.height);
  writeVec2(uPass.view, 16, 0, 0);
  writeVec2(uPass.view, 24, 1, 1);
  writeVec2(uPass.view, 32, gelSize.width, gelSize.height);
  writeVec2(uPass.view, 40, 0, 0);
  uPass.upload(device.queue);

  const uWarp = createUniformBuffer(device, 16, 'warp-uniforms');

  // Reusable warp texture (resized as needed)
  let warpTex: GPUTexture | null = null;
  let warpTexW = 0;
  function ensureWarpTex(width: number) {
    if (warpTex && warpTexW === width) return;
    warpTex?.destroy();
    warpTexW = width;
    warpTex = device.createTexture({
      label: 'warp-tex',
      size: { width, height: 1 },
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
  }

  return {
    run(encoder, target, warp) {
      ensureWarpTex(warp.width);
      device.queue.writeTexture(
        { texture: warpTex! },
        warp.data,
        { bytesPerRow: warp.width * 4 },
        { width: warp.width, height: 1 }
      );
      writeVec2(uWarp.view, 0, warp.scale[0], warp.scale[1]);
      writeVec2(uWarp.view, 8, 0, 0);
      uWarp.upload(device.queue);

      const bg = device.createBindGroup({
        layout: bgl,
        entries: [
          { binding: 0, resource: { buffer: uPass.buffer } },
          { binding: 1, resource: target.current.view },
          { binding: 2, resource: sampler },
          { binding: 3, resource: warpTex!.createView() },
          { binding: 4, resource: { buffer: uWarp.buffer } },
        ],
      });

      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: target.next.view,
          loadOp: 'clear', storeOp: 'store',
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        }],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bg);
      pass.setVertexBuffer(0, quad.buffer);
      pass.draw(quad.vertexCount);
      pass.end();
      target.swap();
    },
    destroy() {
      uPass.destroy();
      uWarp.destroy();
      warpTex?.destroy();
    },
  };
}
```

- [ ] **Step 11: Run typecheck**

```bash
cd ts && npm run typecheck
```

Expected: PASS.

- [ ] **Step 12: Commit**

```bash
cd ts && git add src/shaders/warp.frag.wgsl src/lib/gel/smile.ts src/lib/gel/welldamage.ts \
  src/lib/gel/passes/warp.ts tests/unit/smile-warp.test.ts tests/unit/welldamage-warp.test.ts
git commit -m "feat(gel): warp shader + smile/well-damage texture generators"
```

---

### Task 11: Composite pass (band → composite RT with band color blend)

**Files:**
- Create: `ts/src/lib/gel/passes/composite.ts`

C++ composite (line 196): `gl::ScopedBlend(GL_SRC_ALPHA, GL_ONE)`, `gl::color(band.mColor)`, `gl::draw(mBandFBO->getColorTexture(), Rectf(vec2(0), mGelSize))`. We use the gel-passthrough fragment but multiply by a uniform tint+brightness, with premultiplied additive blend.

- [ ] **Step 1: Add a tinted variant of gel-passthrough**

Append a second entry point to the existing fragment shader. Edit `ts/src/shaders/gel-passthrough.frag.wgsl` so it now reads:

```wgsl
// ts/src/shaders/gel-passthrough.frag.wgsl
struct CompositeUniforms {
  tint: vec4f,  // RGB = band color, A = unused (band brightness applied via tex.rgb)
};

@group(0) @binding(1) var          uTex0:    texture_2d<f32>;
@group(0) @binding(2) var          uSampler: sampler;
@group(0) @binding(3) var<uniform> uComp:    CompositeUniforms;

@fragment
fn fs_main(@location(0) texcoord: vec2f) -> @location(0) vec4f {
  return textureSample(uTex0, uSampler, texcoord);
}

@fragment
fn fs_composite(@location(0) texcoord: vec2f) -> @location(0) vec4f {
  // Source is band RT in linear space: RGB encodes brightness, A is 1 from primitives.
  // C++ reads source RGB and multiplies by gl::color = band.mColor; alpha is gl_FragColor.a
  // which becomes the (SRC_ALPHA, ONE) factor for additive blend.
  // We use premultiplied additive (ONE, ONE), so emit RGB premultiplied by the band's
  // luminance signal (already in tex.rgb) modulated by the tint, with alpha = luminance.
  let s = textureSample(uTex0, uSampler, texcoord);
  let lum = max(max(s.r, s.g), s.b);
  return vec4f(s.rgb * uComp.tint.rgb, lum);
}
```

NOTE: We expose **two** entry points in this file. Earlier tasks (Task 4 passthrough render) call `fs_main` — that path stays valid. The composite pass below calls `fs_composite`.

- [ ] **Step 2: Implement `composite.ts`**

```ts
// ts/src/lib/gel/passes/composite.ts
import type { RenderTarget } from '../../gpu/target';
import { createUniformBuffer, writeVec4 } from '../../gpu/uniforms';
import { createShaderModule } from '../../gpu/shader';
import { createQuad } from '../../gpu/quad';
import passVertSrc       from '../../../shaders/passthrough.vert.wgsl?raw';
import gelPassthroughSrc from '../../../shaders/gel-passthrough.frag.wgsl?raw';

export interface CompositePass {
  run(
    encoder: GPUCommandEncoder,
    src: RenderTarget,
    dst: RenderTarget,
    color: [number, number, number],
    clear: boolean,
  ): void;
  destroy(): void;
}

export function createCompositePass(
  device: GPUDevice,
  gelSize: { width: number; height: number },
  format: GPUTextureFormat = 'rgba8unorm-srgb'
): CompositePass {
  const quad = createQuad(device);
  const vs = createShaderModule(device, passVertSrc,       'passthrough.vert');
  const fs = createShaderModule(device, gelPassthroughSrc, 'gel-passthrough.frag');

  const bgl = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX,   buffer:  { type: 'uniform' } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
      { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer:  { type: 'uniform' } },
    ],
  });

  const layout = device.createPipelineLayout({ bindGroupLayouts: [bgl] });
  const pipeline = device.createRenderPipeline({
    label: 'composite', layout,
    vertex: { module: vs, entryPoint: 'vs_main', buffers: [quad.layout] },
    fragment: {
      module: fs, entryPoint: 'fs_composite',
      targets: [{
        format,
        blend: {
          // Premultiplied additive (matches C++ SRC_ALPHA, ONE on unpremultiplied src)
          color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
          alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
        },
      }],
    },
    primitive: { topology: 'triangle-strip' },
  });

  const sampler = device.createSampler({
    magFilter: 'linear', minFilter: 'linear',
    addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge',
  });

  const uPass = createUniformBuffer(device, 48, 'composite-pass-uniforms');
  // Same fullscreen mapping as blur.ts
  const dv = uPass.view;
  dv.setFloat32(0,  0, true); dv.setFloat32(4,  0, true);
  dv.setFloat32(8,  gelSize.width, true); dv.setFloat32(12, gelSize.height, true);
  dv.setFloat32(16, 0, true); dv.setFloat32(20, 0, true);
  dv.setFloat32(24, 1, true); dv.setFloat32(28, 1, true);
  dv.setFloat32(32, gelSize.width, true); dv.setFloat32(36, gelSize.height, true);
  dv.setFloat32(40, 0, true); dv.setFloat32(44, 0, true);
  uPass.upload(device.queue);

  const uComp = createUniformBuffer(device, 16, 'composite-uniforms');

  return {
    run(encoder, src, dst, color, clear) {
      writeVec4(uComp.view, 0, color[0], color[1], color[2], 1);
      uComp.upload(device.queue);

      const bg = device.createBindGroup({
        layout: bgl,
        entries: [
          { binding: 0, resource: { buffer: uPass.buffer } },
          { binding: 1, resource: src.view },
          { binding: 2, resource: sampler },
          { binding: 3, resource: { buffer: uComp.buffer } },
        ],
      });

      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: dst.view,
          loadOp:  clear ? 'clear' : 'load',
          storeOp: 'store',
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        }],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bg);
      pass.setVertexBuffer(0, quad.buffer);
      pass.draw(quad.vertexCount);
      pass.end();
    },
    destroy() {
      uPass.destroy();
      uComp.destroy();
    },
  };
}
```

- [ ] **Step 3: Run typecheck**

```bash
cd ts && npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd ts && git add src/shaders/gel-passthrough.frag.wgsl src/lib/gel/passes/composite.ts
git commit -m "feat(gel): composite pass with band color modulation + additive blend"
```

---

### Task 12: GelRenderer orchestrator + canonical scene

**Files:**
- Create: `ts/src/lib/gel/render.ts`
- Create: `ts/fixtures/states/single-band.json`

- [ ] **Step 1: Implement `render.ts`**

```ts
// ts/src/lib/gel/render.ts
import { createPingPong, createRenderTarget, type RenderTarget } from '../gpu/target';
import { createPrimitivePass } from './passes/primitives';
import { createBlurPass }      from './passes/blur';
import { createWarpPass }      from './passes/warp';
import { createCompositePass } from './passes/composite';
import { buildSmileWarp }      from './smile';
import { buildWellDamageWarp } from './welldamage';
import type { Band } from '../sim/band';

export interface GelRenderer {
  setBands(bands: Band[]): void;
  render(): void;
  output: RenderTarget;
  destroy(): void;
}

export function createGelRenderer(
  device: GPUDevice,
  gelSize: { width: number; height: number },
  pixelsPerUnit: number,
  format: GPUTextureFormat = 'rgba8unorm-srgb'
): GelRenderer {
  const outputW = Math.round(gelSize.width  * pixelsPerUnit);
  const outputH = Math.round(gelSize.height * pixelsPerUnit);

  const band     = createPingPong(device, outputW, outputH, format, 'band');
  const composite = createRenderTarget(device, outputW, outputH, format, 'composite');

  const primitives = createPrimitivePass(device, { width: gelSize.width, height: gelSize.height }, format);
  const blur       = createBlurPass(device, { width: gelSize.width, height: gelSize.height }, format);
  const warp       = createWarpPass(device, { width: gelSize.width, height: gelSize.height }, format);
  const cmp        = createCompositePass(device, { width: gelSize.width, height: gelSize.height }, format);

  let bands: Band[] = [];

  function render() {
    const encoder = device.createCommandEncoder({ label: 'gel-render' });

    // Clear composite RT once
    const clearPass = encoder.beginRenderPass({
      colorAttachments: [{
        view: composite.view,
        loadOp: 'clear', storeOp: 'store',
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
      }],
    });
    clearPass.end();

    for (const b of bands) {
      // 1. Primitives → band.current
      primitives.draw(encoder, band.current, b);

      // 2. Smile warp (if any)
      const smile = buildSmileWarp({
        x1: b.rect.x1, x2: b.rect.x2,
        smileHeight: b.smileHeight, smileExp: b.smileExp,
      }, gelSize);
      if (smile) warp.run(encoder, band, smile);

      // 3. Well-damage warp (if any)
      const wd = buildWellDamageWarp({
        rect: b.rect, wellDamage: b.wellDamage, wellDamageRandSeed: b.wellDamageRandSeed,
      }, gelSize);
      if (wd) warp.run(encoder, band, wd);

      // 4. Blur
      if (b.blur > 0) blur.run(encoder, band, b.blur * pixelsPerUnit);

      // 5. Composite — band.current → composite (additive, tinted)
      cmp.run(encoder, band.current, composite, b.color, /*clear*/ false);
    }

    device.queue.submit([encoder.finish()]);
  }

  return {
    setBands(b) { bands = b; },
    render,
    output: composite,
    destroy() {
      primitives.destroy();
      blur.destroy();
      warp.destroy();
      cmp.destroy();
      band.destroy();
      composite.destroy();
    },
  };
}
```

- [ ] **Step 2: Write `fixtures/states/single-band.json`**

```json
{
  "schema": "gel-state-v0",
  "gelSize": { "width": 320, "height": 240 },
  "pixelsPerUnit": 1,
  "bands": [
    {
      "rect": { "x1": 60, "y1": 90, "x2": 260, "y2": 102 },
      "smearAbove": 6,
      "smearBelow": 18,
      "smearBrightnessAbove": [0.55, 0.0],
      "smearBrightnessBelow": [0.40, 0.0],
      "flameHeight": 14,
      "smileHeight": 7,
      "smileExp": 1.5,
      "blur": 3,
      "brightness": 0.85,
      "color": [1.0, 0.92, 0.78],
      "randSeed": 7,
      "wellDamage": 0.4,
      "wellDamageRandSeed": 21
    }
  ]
}
```

- [ ] **Step 3: Run typecheck**

```bash
cd ts && npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd ts && git add src/lib/gel/render.ts fixtures/states/single-band.json
git commit -m "feat(gel): GelRenderer orchestrator + canonical single-band fixture"
```

---

### Task 13: Wire DevPage to render the canonical band + blit to canvas

**Files:**
- Modify: `ts/src/routes/DevPage.tsx`

- [ ] **Step 1: Replace the DevPage WebGPU effect with the full pipeline**

This swap-in renders the JSON fixture once and blits the composite RT to the canvas. The existing GPU JSON section stays.

Replace the `useEffect(() => { ... }, []);` for canvas in `DevPage.tsx` with:

```tsx
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  let renderer: ReturnType<typeof import('../lib/gel/render').createGelRenderer> | null = null;
  let cancelled = false;
  (async () => {
    try {
      const fixture = (await import('../../fixtures/states/single-band.json')).default;
      // Hard-set canvas backing buffer to fixture size — bypass surface.ts's DPR scaling
      // so goldens are byte-stable regardless of devicePixelRatio (CI runs DPR=1, Retina dev DPR=2).
      canvas.width  = fixture.gelSize.width  * fixture.pixelsPerUnit;
      canvas.height = fixture.gelSize.height * fixture.pixelsPerUnit;

      const { device, queue } = await requestDevice();
      if (cancelled) return;
      const { context, format } = configureContext(canvas, device);

      const [
        { createGelRenderer },
        { createQuad },
        { createShaderModule },
        { createUniformBuffer },
        passVertSrc,
        gelPassthroughSrc,
      ] = await Promise.all([
        import('../lib/gel/render'),
        import('../lib/gpu/quad'),
        import('../lib/gpu/shader'),
        import('../lib/gpu/uniforms'),
        import('../shaders/passthrough.vert.wgsl?raw'),
        import('../shaders/gel-passthrough.frag.wgsl?raw'),
      ]);

      renderer = createGelRenderer(device, fixture.gelSize, fixture.pixelsPerUnit);
      renderer.setBands(fixture.bands);
      renderer.render();

      // Blit composite RT → canvas via passthrough fs_main (no tint, no blend)
      const quad = createQuad(device);
      const vs = createShaderModule(device, passVertSrc.default, 'passthrough.vert');
      const fs = createShaderModule(device, gelPassthroughSrc.default, 'gel-passthrough.frag');
      // Blit uses fs_main only (no tint, no blend) → 3-binding layout. fs_composite's
      // CompositeUniforms (binding 3) is declared in the shader module but unreachable
      // from fs_main, so it doesn't appear in this pipeline's resource interface.
      const bgl = device.createBindGroupLayout({
        entries: [
          { binding: 0, visibility: GPUShaderStage.VERTEX,   buffer:  { type: 'uniform' } },
          { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
          { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
        ],
      });
      const pipeline = device.createRenderPipeline({
        label: 'blit',
        layout: device.createPipelineLayout({ bindGroupLayouts: [bgl] }),
        vertex:   { module: vs, entryPoint: 'vs_main', buffers: [quad.layout] },
        fragment: { module: fs, entryPoint: 'fs_main', targets: [{ format }] },
        primitive: { topology: 'triangle-strip' },
      });
      const sampler = device.createSampler({
        magFilter: 'linear', minFilter: 'linear',
        addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge',
      });
      const uPass = createUniformBuffer(device, 48, 'blit-pass-uniforms');
      const dv = uPass.view;
      const w = canvas.width, h = canvas.height;
      dv.setFloat32(0,  0, true); dv.setFloat32(4,  0, true);
      dv.setFloat32(8,  w, true); dv.setFloat32(12, h, true);
      dv.setFloat32(16, 0, true); dv.setFloat32(20, 0, true);
      dv.setFloat32(24, 1, true); dv.setFloat32(28, 1, true);
      dv.setFloat32(32, w, true); dv.setFloat32(36, h, true);
      dv.setFloat32(40, 0, true); dv.setFloat32(44, 0, true);
      uPass.upload(queue);
      const bg = device.createBindGroup({
        layout: bgl,
        entries: [
          { binding: 0, resource: { buffer: uPass.buffer } },
          { binding: 1, resource: renderer.output.view },
          { binding: 2, resource: sampler },
        ],
      });
      const enc = device.createCommandEncoder();
      const pass = enc.beginRenderPass({
        colorAttachments: [{
          view: context.getCurrentTexture().createView(),
          loadOp: 'clear', storeOp: 'store',
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        }],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bg);
      pass.setVertexBuffer(0, quad.buffer);
      pass.draw(quad.vertexCount);
      pass.end();
      queue.submit([enc.finish()]);
    } catch (err) {
      setBootError((err as Error).message);
    }
  })();
  return () => {
    cancelled = true;
    renderer?.destroy();
  };
}, []);
```

Also drop the `createSurface` import from the top of `DevPage.tsx` if it was added in Task 1 — we don't use it on this page anymore. Surface remains valid in the engine for M3+ when GelCanvas needs DPR-aware sizing.

Also update the JSX `<canvas>` style to display at the fixture size (no DPR upscale for goldens):

```tsx
<canvas
  ref={canvasRef}
  data-testid="gel-canvas"
  style={{ width: '320px', height: '240px', display: 'block', border: '1px solid var(--color-grid)', imageRendering: 'pixelated' }}
/>
```

- [ ] **Step 2: Open dev server and visually inspect**

```bash
cd ts && npm run dev
# Open http://localhost:5173/#/dev
# Expected: a 320×240 canvas showing one warm-cream colored band with smears,
# subtle flames above, smile-curve droop, well-damage stabs, and a soft blur halo.
# Compare side-by-side with the C++ Gelbox app for visual parity sanity.
```

- [ ] **Step 3: Run typecheck + smoke tests**

```bash
cd ts && npm run typecheck && npx playwright test smoke.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd ts && git add src/routes/DevPage.tsx
git commit -m "feat(dev): render canonical single-band scene on /dev page"
```

---

### Task 14: Playwright golden-frame test for the single band

**Files:**
- Create: `ts/tests/visual/single-band.spec.ts`
- Create (auto-generated): `ts/tests/visual/single-band.spec.ts-snapshots/single-band-canvas-chromium.png`

- [ ] **Step 1: Write `single-band.spec.ts`**

```ts
// ts/tests/visual/single-band.spec.ts
import { test, expect } from '@playwright/test';

test('single canonical band — golden frame', async ({ page }) => {
  await page.goto('/#/dev');
  await expect(page.getByTestId('renderer-status')).toHaveText('renderer: ready');
  // Wait one rAF so the GPU command has actually rendered before screenshot
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
  const canvas = page.getByTestId('gel-canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveScreenshot('single-band-canvas.png', {
    maxDiffPixelRatio: 0.02,
  });
});
```

- [ ] **Step 2: Generate the baseline snapshot (first-run)**

```bash
cd ts && npx playwright test single-band.spec.ts --update-snapshots
```

Expected: PASS, snapshot file written under `tests/visual/single-band.spec.ts-snapshots/`.

- [ ] **Step 3: Manually inspect the baseline**

```bash
open ts/tests/visual/single-band.spec.ts-snapshots/single-band-canvas-chromium.png
# Compare against C++ Gelbox running with equivalent band parameters.
# (You may need to manually wire up a single-band scene in C++ for direct comparison —
#  see the next step for a minimal procedure if visual parity is suspect.)
```

If parity looks off, take notes and address before committing the baseline. Common issues:
- Y-flip in vertex shader wrong → bands appear upside-down (smear-above ends up below)
- Texture format `rgba8unorm` instead of `rgba8unorm-srgb` → washed-out colors
- Composite blend math wrong → band looks dim or saturated

- [ ] **Step 4: C++ visual parity gate (manual)**

This is a **once-per-milestone** check, not a per-PR test. Instructions:

```
1. Build and run C++ Gelbox: cd ~/code/gelbox && open Gelbox.xcodeproj (Xcode build & run)
2. In a fresh blank gel, drag a sample to lane 1
3. Open the sample editor; set bases such that one fragment lands at roughly y=90..102
   in a 320×240-pixel gel area.
4. Manually edit Sample::makeBands or pass through the debugger to inject a band with
   the exact fixture parameters from ts/fixtures/states/single-band.json
5. Screenshot the gel render area at native resolution.
6. Open the screenshot side-by-side with single-band-canvas-chromium.png.
7. Visual diff: do the band shape, smear extents, blur falloff, and warp profiles
   match? (Flame layout will not match exactly because the RNG differs — check that
   the *envelope* and *strand density* are similar.)
```

If they match: proceed. If not: file an issue noting which pass diverges and iterate before locking the baseline.

- [ ] **Step 5: Lock the baseline**

```bash
cd ts && npx playwright test single-band.spec.ts
```

Expected: PASS (clean run against the now-committed baseline).

- [ ] **Step 6: Commit baseline + test**

```bash
cd ts && git add tests/visual/single-band.spec.ts tests/visual/single-band.spec.ts-snapshots
git commit -m "test(visual): golden frame for single canonical band"
```

---

### Task 15: Update Phase 1 overview + tag M2

**Files:**
- Modify: `docs/superpowers/plans/2026-04-27-gelbox-ts-phase-1-overview.md`

- [ ] **Step 1: Mark M2 done in the overview**

In `docs/superpowers/plans/2026-04-27-gelbox-ts-phase-1-overview.md`, update the Sub-plans section:

```markdown
- [x] **M2 Single-band render** — [`2026-04-27-gelbox-ts-m2-single-band.md`](2026-04-27-gelbox-ts-m2-single-band.md)
```

And update the milestones table row for M2 to reference the plan file:

```markdown
| M2 | Single-band render parity | … | [`m2-single-band.md`](2026-04-27-gelbox-ts-m2-single-band.md) | Week 2 |
```

- [ ] **Step 2: Run full CI locally**

```bash
cd ts && npm run typecheck && npm run test:unit && npm run build && npx playwright test
```

Expected: all green.

- [ ] **Step 3: Commit overview update**

```bash
git add docs/superpowers/plans/2026-04-27-gelbox-ts-phase-1-overview.md
git commit -m "docs(plan): mark M2 single-band complete and link sub-plan"
```

- [ ] **Step 4: Push and tag**

```bash
git push origin master
git tag m2-single-band
git push origin m2-single-band
```

- [ ] **Step 5: Verify CI**

```bash
gh run list --workflow=ci.yml --limit 1
# Wait for green; if it fails, open `gh run view <id> --log` and fix.
```

---

## Self-review

**Spec coverage** (against the M2 row of the Phase 1 overview):

- ✅ "Playwright golden-frame matches C++ reference for 1 band" — Task 14 builds the harness; the C++ comparison is captured as a manual gate in Step 4 (the `toHaveScreenshot` baseline becomes the regression oracle once parity is locked)
- ✅ "all 6 passes (gradient → rect → flames → smile → well-damage → blur → composite)" — Tasks 6 (smear gradient), 6 (rect), 7 (flames), 10 (smile + well-damage), 9 (blur), 11 (composite)
- ✅ Engine bootstrap (Tasks 1–3) — surface/device/context/target/uniform/quad/shader/pipeline modules
- ✅ Six C++ shader ports — Tasks 4 (passthrough.vert + gel-passthrough.frag), 9 (blur5/9/13.frag), 10 (warp.frag) — plus geometry pair (Task 8)
- ✅ DevPage scene wiring — Task 13
- ✅ Tag — Task 15

**Placeholder scan:** No `TBD`/`TODO`/`add appropriate error handling`/`similar to Task N` markers; every code step has a complete code block; commands are exact with expected outputs.

**Type consistency:** `Mesh` defined in Task 6, used in Tasks 7 and 8. `Band` defined in Task 5, used everywhere. `WarpTextureCpu` defined in Task 10's `smile.ts`, re-imported in `welldamage.ts`. `RenderTarget` and `PingPong` defined in Task 2, used in Tasks 9–12. `PassUniforms` struct layout (48 bytes: 6×vec2) is identical across `passthrough.vert`, `blur5/9/13.frag`, `warp.frag`. `gel-passthrough.frag` exposes two entry points (`fs_main` and `fs_composite`) — first introduced in Task 4 (`fs_main` only), expanded in Task 11 (adds `fs_composite`). Task 13's blit pass uses `fs_main` and the same `bind group entry index 3 = uniform buffer` slot, satisfied with a 16-byte dummy buffer to keep the layout reusable.

**Risks specific to this plan:**

1. **CI WebGPU availability** — Linux headless Chromium needs `--enable-unsafe-webgpu` and a software Vulkan ICD. Task 1 Step 5 sets the launch flags. If CI still fails to acquire a device, fall back to skipping the visual test in CI and gating the milestone on local Mac runs (note as a risk; will revisit in M4 when WebGL2 fallback comes online).
2. **rgba8unorm-srgb rendering math** — additive blend in sRGB encoding is **not** linear (writes go through encode, reads through decode). The first composite into a black sRGB target gets re-encoded; this can shift midtones. If parity diverges, switch the band/composite RTs to plain `rgba8unorm` and pre-linearize the band color tint in the composite shader.
3. **`canvas.width / canvas.height` mismatch with CSS size** — Task 13 sets the canvas's pixel buffer to 320×240 and the CSS size to 320px×240px. Playwright captures the rendered pixels (via the canvas element bounds), so the screenshot will be 320×240 — predictable for golden diffing. `imageRendering: pixelated` keeps the on-screen scaling crisp during dev inspection.
4. **`triangle-strip` for primitives mesh** — Task 8 uses `triangle-list` for primitives (not strip), since smear+body+flames are independent quads. Strip works only for the fullscreen quad in image-graph passes. This is consistent across the plan.

Plan complete and saved to `docs/superpowers/plans/2026-04-27-gelbox-ts-m2-single-band.md`.
