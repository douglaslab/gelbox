export type GpuBackend = 'webgpu' | 'webgl2' | 'none';

export interface AdapterInfoPlain {
  vendor: string;
  architecture: string;
  device: string;
  description: string;
}

export interface GpuCapability {
  backend: GpuBackend;
  adapterInfo?: AdapterInfoPlain;
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
        const features = Array.from(adapter.features ?? []);
        const adapterInfo = extractAdapterInfo(adapter);
        const limits = extractLimits(adapter.limits);
        return {
          backend: 'webgpu',
          adapterInfo,
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

// GPUAdapterInfo exposes vendor/architecture/device/description as getter
// properties on the prototype, so JSON.stringify on the object yields {}.
// Read each field explicitly into a plain object.
function extractAdapterInfo(adapter: GPUAdapter): AdapterInfoPlain | undefined {
  const raw = (adapter as unknown as { info?: GPUAdapterInfo }).info;
  if (!raw) return undefined;
  return {
    vendor: raw.vendor ?? '',
    architecture: raw.architecture ?? '',
    device: raw.device ?? '',
    description: raw.description ?? '',
  };
}

// GPUSupportedLimits exposes each limit (e.g. maxTextureDimension2D) as a
// getter property on the prototype, not an own property. Object.keys returns
// []. Walk the prototype chain to enumerate them and copy the numeric values.
function extractLimits(limits: GPUSupportedLimits | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  if (!limits) return out;
  const seen = new Set<string>();
  let proto: object | null = Object.getPrototypeOf(limits);
  while (proto && proto !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === 'constructor' || seen.has(key)) continue;
      seen.add(key);
      const v = (limits as unknown as Record<string, unknown>)[key];
      if (typeof v === 'number') out[key] = v;
    }
    proto = Object.getPrototypeOf(proto);
  }
  return out;
}
