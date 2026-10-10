import { test, expect } from '@playwright/test';
test('native smile direction and cross-backend warp coordinates', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium-webgpu' || process.platform === 'linux', 'Requires both real GPU backends; run once on macOS');
    await page.goto('/#/gel');
    const result = await page.evaluate(async () => {
        const { createGelRenderer } = await import('/src/lib/gel/render.ts');
        const { createGlGelRenderer } = await import('/src/lib/gel/render-gl.ts');
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter)
            throw Error('Missing GPU adapter');
        const device = await adapter.requestDevice();
        const canvas = document.createElement('canvas'), gl = canvas.getContext('webgl2');
        if (!gl)
            throw Error('Missing WebGL2');
        const width = 128, height = 128, bytesPerRow = width * 4;
        const gpu = createGelRenderer(device, { width, height }, 1), webgl = createGlGelRenderer(gl, { width, height }, 1);
        const base = { rect: { x1: 20, y1: 65, x2: 108, y2: 69 }, smearAbove: 0, smearBelow: 0, smearBrightnessAbove: [0, 0], smearBrightnessBelow: [0, 0], flameHeight: 0, smileHeight: 0, smileExp: 2, blur: 0, brightness: 1, color: [1, 1, 1], randSeed: 1, wellDamage: 0, wellDamageRandSeed: 73, mass: 50, aggregate: 1, degrade: 0 };
        const outputs = [];
        for (const y of [31, 91])
            for (const mode of ['plain', 'smile', 'damage', 'water', 'combined']) {
                const band = { ...base, rect: { ...base.rect, y1: y - 2, y2: y + 2 }, smileHeight: ['smile', 'combined'].includes(mode) ? 10 : 0, wellDamage: ['damage', 'combined'].includes(mode) ? 1 : 0 };
                const water = { h2oDistort: ['water', 'combined'].includes(mode), randSeed: 1 };
                for (const r of [gpu, webgl]) {
                    r.setBands([band]);
                    r.setGlobalWarp(water);
                    r.render();
                }
                const buffer = device.createBuffer({ size: bytesPerRow * height, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
                const enc = device.createCommandEncoder();
                enc.copyTextureToBuffer({ texture: gpu.output.texture }, { buffer, bytesPerRow }, { width, height });
                device.queue.submit([enc.finish()]);
                await buffer.mapAsync(GPUMapMode.READ);
                const a = new Uint8Array(buffer.getMappedRange()).slice();
                buffer.unmap();
                buffer.destroy();
                const b = new Uint8Array(width * height * 4);
                gl.bindFramebuffer(gl.FRAMEBUFFER, webgl.output.framebuffer);
                gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, b);
                // Compare column brightness centroids using matching linear RGBA8 target formats.
                const centers = (data: Uint8Array, flip: boolean) => Array.from({ length: width }, (_, x) => { let sum = 0, total = 0; for (let y = 0; y < height; y++) {
                    const v = data[((flip ? height - 1 - y : y) * width + x) * 4];
                    sum += (y + .5) * v;
                    total += v;
                } return total ? sum / total : null; });
                outputs.push({ mode, y, gpu: centers(a, false), gl: centers(b, true) });
            }
        gpu.destroy();
        webgl.destroy();
        device.destroy();
        return outputs;
    });
    for (const r of result) {
        expect(r.gpu.filter(v => v !== null).length).toBeGreaterThan(70);
        for (let x = 0; x < 128; x++) {
            expect(r.gpu[x] === null, `${r.mode}/${r.y} occupied col ${x}`).toBe(r.gl[x] === null);
            if (r.gpu[x] === null)
                continue;
            expect(Math.abs(r.gpu[x]! - r.gl[x]!), `${r.mode} backend vertical displacement at ${x}`).toBeLessThan(.35);
        }
    }
    for (const plain of result.filter(r => r.mode === 'plain'))
        for (const backend of ['gpu', 'gl'] as const)
            expect(plain[backend][64]).toBeCloseTo(plain.y, 3);
    const smile = result.find(r => r.mode === 'smile')!;
    // Native negative warp.y samples below in gel-space: visible edges curl upward.
    for (const backend of ['gpu', 'gl'] as const)
        expect(smile[backend][25]!).toBeLessThan(smile[backend][64]! - 5);
});
