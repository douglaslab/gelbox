import { useEffect, useRef } from 'react';
import type { Band } from '../../lib/sim/band';
import { selectBackend } from '../../lib/gel/backend';

interface GelCanvasProps {
  bands:        Band[];
  gelSize:      { width: number; height: number };
  pixelsPerUnit: number;
}

type GpuRenderer = ReturnType<typeof import('../../lib/gel/render').createGelRenderer>;
type GlRenderer  = ReturnType<typeof import('../../lib/gel/render-gl').createGlGelRenderer>;

export function GelCanvas({ bands, gelSize, pixelsPerUnit }: GelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    rendererGpu: GpuRenderer | null;
    rendererGl:  GlRenderer  | null;
    blitFn:      ((output: GpuRenderer | GlRenderer) => void) | null;
  }>({ rendererGpu: null, rendererGl: null, blitFn: null });

  // Mount once; teardown on unmount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    canvas.width  = gelSize.width  * pixelsPerUnit;
    canvas.height = gelSize.height * pixelsPerUnit;

    (async () => {
      try {
        const backend = selectBackend();
        if (backend === 'webgl2') {
          const { configureGl2Context } = await import('../../lib/gpu/gl/context');
          const { gl } = configureGl2Context(canvas);
          if (cancelled) return;
          const [
            { createGlGelRenderer },
            { createGlProgram },
            { createGlQuad, bindQuadAttribs },
            passVertSrc, gelPassthroughSrc,
          ] = await Promise.all([
            import('../../lib/gel/render-gl'),
            import('../../lib/gpu/gl/program'),
            import('../../lib/gpu/gl/quad'),
            import('../../shaders/passthrough.vert.glsl?raw'),
            import('../../shaders/gel-passthrough.frag.glsl?raw'),
          ]);
          const renderer = createGlGelRenderer(gl, gelSize, pixelsPerUnit);
          stateRef.current.rendererGl = renderer;
          const blit = createGlProgram(gl, passVertSrc.default, gelPassthroughSrc.default, 'gl-blit');
          const quad = createGlQuad(gl);
          stateRef.current.blitFn = () => {
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
            gl.uniform2f(blit.uniform('uPositionScale'), gelSize.width, gelSize.height);
            gl.uniform2f(blit.uniform('uTexCoordOffset'), 0, 0);
            gl.uniform2f(blit.uniform('uTexCoordScale'), 1, 1);
            gl.uniform2f(blit.uniform('uGelSize'), gelSize.width, gelSize.height);
            bindQuadAttribs(gl, quad.buffer, blit.attrib('aPos'), blit.attrib('aTexCoord'));
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          };
        } else {
          const { requestDevice } = await import('../../lib/gpu/device');
          const { configureContext } = await import('../../lib/gpu/context');
          const { device, queue } = await requestDevice();
          if (cancelled) return;
          const { context, format } = configureContext(canvas, device);
          const [
            { createGelRenderer },
            { createQuad },
            { createShaderModule },
            { createUniformBuffer },
            passVertSrc, gelPassthroughSrc,
          ] = await Promise.all([
            import('../../lib/gel/render'),
            import('../../lib/gpu/quad'),
            import('../../lib/gpu/shader'),
            import('../../lib/gpu/uniforms'),
            import('../../shaders/passthrough.vert.wgsl?raw'),
            import('../../shaders/gel-passthrough.frag.wgsl?raw'),
          ]);
          const renderer = createGelRenderer(device, gelSize, pixelsPerUnit);
          stateRef.current.rendererGpu = renderer;
          const quad = createQuad(device);
          const vs = createShaderModule(device, passVertSrc.default, 'passthrough.vert');
          const fs = createShaderModule(device, gelPassthroughSrc.default, 'gel-passthrough.frag');
          const bgl = device.createBindGroupLayout({
            entries: [
              { binding: 0, visibility: GPUShaderStage.VERTEX,   buffer:  { type: 'uniform' } },
              { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
              { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
            ],
          });
          const pipeline = device.createRenderPipeline({
            label: 'gel-canvas-blit',
            layout: device.createPipelineLayout({ bindGroupLayouts: [bgl] }),
            vertex: { module: vs, entryPoint: 'vs_main', buffers: [quad.layout] },
            fragment: { module: fs, entryPoint: 'fs_main', targets: [{ format }] },
            primitive: { topology: 'triangle-strip' },
          });
          const sampler = device.createSampler({
            magFilter: 'linear', minFilter: 'linear',
            addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge',
          });
          const uPass = createUniformBuffer(device, 48, 'gel-canvas-blit-pass');
          const dv = uPass.view, w = canvas.width, h = canvas.height;
          dv.setFloat32(0, 0, true); dv.setFloat32(4, 0, true);
          dv.setFloat32(8, w, true); dv.setFloat32(12, h, true);
          dv.setFloat32(16, 0, true); dv.setFloat32(20, 0, true);
          dv.setFloat32(24, 1, true); dv.setFloat32(28, 1, true);
          dv.setFloat32(32, w, true); dv.setFloat32(36, h, true);
          dv.setFloat32(40, 0, true); dv.setFloat32(44, 0, true);
          uPass.upload(queue);
          stateRef.current.blitFn = () => {
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
              colorAttachments: [{ view: context.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 1 } }],
            });
            pass.setPipeline(pipeline);
            pass.setBindGroup(0, bg);
            pass.setVertexBuffer(0, quad.buffer);
            pass.draw(quad.vertexCount);
            pass.end();
            queue.submit([enc.finish()]);
          };
        }
      } catch (err) {
        console.error('GelCanvas mount failed:', err);
      }
    })();

    return () => {
      cancelled = true;
      stateRef.current.rendererGpu?.destroy();
      stateRef.current.rendererGl?.destroy();
      stateRef.current.rendererGpu = null;
      stateRef.current.rendererGl  = null;
      stateRef.current.blitFn = null;
    };
  }, [gelSize.width, gelSize.height, pixelsPerUnit]);

  // Re-render whenever bands prop changes
  useEffect(() => {
    const { rendererGpu, rendererGl, blitFn } = stateRef.current;
    const renderer = rendererGpu ?? rendererGl;
    if (!renderer || !blitFn) return;
    renderer.setBands(bands);
    renderer.render();
    blitFn(renderer);
  }, [bands]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="gel-canvas"
      style={{
        width:  `${gelSize.width  * pixelsPerUnit}px`,
        height: `${gelSize.height * pixelsPerUnit}px`,
        display: 'block',
        border: '1px solid var(--color-grid)',
        imageRendering: 'pixelated',
      }}
    />
  );
}
