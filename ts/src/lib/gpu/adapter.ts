export type GpuBackend = 'webgpu' | 'webgl2' | 'none';

export interface GpuCapability {
  backend: GpuBackend;
  adapterInfo?: GPUAdapterInfo;
  features?: string[];
  limits?: Record<string, number>;
  reasons: string[];
}

export async function detectGpuCapability(): Promise<GpuCapability> {
  const reasons: string[] = [];

  if (typeof navigator === 'undefined') {
    return { backend: 'none', reasons: ['no navigator (Node?)'] };
  }

  if ('gpu' in navigator && navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        const info = (adapter as unknown as { info?: GPUAdapterInfo }).info;
        const features = Array.from(adapter.features ?? []);
        const limits: Record<string, number> = {};
        for (const key of Object.keys(adapter.limits ?? {})) {
          const v = (adapter.limits as unknown as Record<string, unknown>)[key];
          if (typeof v === 'number') limits[key] = v;
        }
        return {
          backend: 'webgpu',
          adapterInfo: info,
          features,
          limits,
          reasons: ['navigator.gpu.requestAdapter resolved'],
        };
      }
      reasons.push('navigator.gpu present but requestAdapter returned null');
    } catch (err) {
      reasons.push(`navigator.gpu.requestAdapter threw: ${(err as Error).message}`);
    }
  } else {
    reasons.push('navigator.gpu missing');
  }

  if (typeof document !== 'undefined') {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2');
    if (gl) {
      return {
        backend: 'webgl2',
        reasons: [...reasons, 'webgl2 context created'],
      };
    }
    reasons.push('webgl2 context creation failed');
  } else {
    reasons.push('no document');
  }

  return { backend: 'none', reasons };
}
