import { allocateTexture, withAllocationRollback } from './allocations';
export interface RenderTarget {
  texture: GPUTexture;
  view: GPUTextureView;
  width: number;
  height: number;
  format: GPUTextureFormat;
  destroy(): void;
}

function createRenderTargetImpl(
  device: GPUDevice,
  width: number,
  height: number,
  format: GPUTextureFormat = 'rgba8unorm-srgb',
  label?: string
): RenderTarget {
  const texture = allocateTexture(device, {
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

function createPingPongImpl(
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

export function createRenderTarget(...args:Parameters<typeof createRenderTargetImpl>):RenderTarget {
  return withAllocationRollback(args[0],()=>createRenderTargetImpl(...args));
}

export function createPingPong(...args:Parameters<typeof createPingPongImpl>):PingPong {
  return withAllocationRollback(args[0],()=>createPingPongImpl(...args));
}
