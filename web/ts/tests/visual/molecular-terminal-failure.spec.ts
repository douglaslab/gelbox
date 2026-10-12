import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1365, height: 768 } });

for (const phase of ['initialization', 'frame']) test(`terminal molecular ${phase} failure releases resources before retry`, async ({ page }, info) => {
  const backend = info.project.name.endsWith('webgl2') ? 'webgl2' : 'webgpu';
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(({ backend, phase }) => {
    localStorage.setItem('gelBackend', backend);
    const live = new Set<object>();
    const contexts: WebGL2RenderingContext[] = [];
    const configured = new Set<GPUCanvasContext>();
    Object.assign(window, { __molecularLive: live, __molecularContexts: contexts,
      __molecularConfigured: configured, __failMolecular: false });
    if (typeof GPUDevice !== 'undefined') {
      for (const [create, prototype] of [['createBuffer', GPUBuffer.prototype], ['createTexture', GPUTexture.prototype]] as const) {
        const original = (GPUDevice.prototype as any)[create];
        (GPUDevice.prototype as any)[create] = function(...args: any[]) {
          const resource = original.apply(this, args); live.add(resource); return resource;
        };
        const destroy = prototype.destroy;
        prototype.destroy = function() { live.delete(this); return destroy.call(this as any); };
      }
      const pipeline = GPUDevice.prototype.createRenderPipeline;
      GPUDevice.prototype.createRenderPipeline = function(desc) {
        if (phase === 'initialization' && desc.label === 'gel-presentation-base' && (window as any).__failMolecular) throw Error('Injected molecular initialization failure');
        return pipeline.call(this, desc);
      };
      const encoder = GPUDevice.prototype.createCommandEncoder;
      GPUDevice.prototype.createCommandEncoder = function(desc) {
        if (desc?.label === 'molsim' && (window as any).__failMolecular) throw Error('Injected molecular frame failure');
        return encoder.call(this, desc);
      };
      const configure = GPUCanvasContext.prototype.configure;
      const unconfigure = GPUCanvasContext.prototype.unconfigure;
      GPUCanvasContext.prototype.configure = function(desc) { configure.call(this, desc); configured.add(this); };
      GPUCanvasContext.prototype.unconfigure = function() { configured.delete(this); return unconfigure.call(this); };
    }
    const p = WebGL2RenderingContext.prototype as any;
    for (const kind of ['Buffer', 'Texture', 'Framebuffer', 'Renderbuffer', 'Program', 'Shader', 'VertexArray']) {
      const create = p['create' + kind], destroy = p['delete' + kind];
      p['create' + kind] = function(...args: any[]) {
        const resource = create.apply(this, args); if (resource) live.add(resource); return resource;
      };
      p['delete' + kind] = function(resource: object) { live.delete(resource); return destroy.call(this, resource); };
    }
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type: any, options: any) {
      const context = getContext.call(this, type, options);
      if (context) this.setAttribute('data-probe-context', type);
      if (type === 'webgl2' && this.dataset.testid === 'molecular-sim-canvas') contexts.push(context as WebGL2RenderingContext);
      return context;
    } as typeof getContext;
    const compile = p.compileShader;
    p.compileShader = function(...args: any[]) {
      if (phase === 'initialization' && this.canvas.dataset.testid === 'molecular-sim-canvas' && (window as any).__failMolecular) throw Error('Injected molecular initialization failure');
      return compile.apply(this, args);
    };
    const clear = p.clear;
    p.clear = function(...args: any[]) {
      if (this.canvas.dataset.testid === 'molecular-sim-canvas' && (window as any).__failMolecular) throw Error('Injected molecular frame failure');
      return clear.apply(this, args);
    };
  }, { backend, phase });
  await page.goto('/#/gel');
  await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-probe-context', backend);
  await page.getByTestId('gel-canvas').screenshot();
  const resources = () => page.evaluate(() => (window as any).__molecularLive.size);
  const configurations = () => page.evaluate(() => (window as any).__molecularConfigured.size);
  const baseline = await resources(), configuredBaseline = await configurations();
  if (phase === 'initialization') await page.evaluate(() => { (window as any).__failMolecular = true; });
  await page.getByTestId('microtube-0').click();
  const canvas = page.getByTestId('molecular-sim-canvas');
  if (phase === 'frame') {
    await expect(canvas).toHaveAttribute('data-probe-context', backend);
    await expect.poll(resources).toBeGreaterThan(baseline);
    await page.evaluate(() => { (window as any).__failMolecular = true; });
  }
  const save = async () => {
    const settings = page.getByRole('button', { name: 'Application settings' });
    await settings.click();
    const pending = page.waitForEvent('download');
    await page.getByTestId('save-sample-btn').click();
    const download = await pending;
    const sample = JSON.parse(await readFile((await download.path())!, 'utf8'));
    return sample;
  };
  const failure = page.getByTestId('molecular-sim-canvas-error');
  await expect(failure).toBeVisible();
  await expect.poll(resources).toBe(baseline);
  await expect.poll(configurations).toBe(configuredBaseline);
  await expect.poll(() => page.evaluate(() => (window as any).__molecularContexts.every((gl: WebGL2RenderingContext) => gl.isContextLost()))).toBe(true);
  const savedWhileFailed = await save();
  await page.evaluate(() => { (window as any).__failMolecular = false; });
  await failure.getByRole('button', { name: 'Retry graphics' }).click();
  await expect(failure).toHaveCount(0);
  await expect(canvas).toHaveAttribute('data-probe-context', backend);
  await expect.poll(async () => Number(await canvas.getAttribute('data-alive-count'))).toBeGreaterThan(0);
  await expect(page.locator('[data-testid^="band-"]')).toHaveCount(11);
  expect(await save()).toEqual(savedWhileFailed);
  await page.evaluate(() => { location.hash = '/dev/slider'; });
  await expect(canvas).toHaveCount(0);
  await expect.poll(resources).toBe(0);
  await expect.poll(configurations).toBe(0);
  expect(errors).toEqual([]);
});
