import { describe, it, expect } from 'vitest';
import { detectGpuCapability } from '../../src/lib/gpu/adapter';

describe('detectGpuCapability (Node smoke)', () => {
  it('returns a Capability object with backend and reasons fields', async () => {
    const cap = await detectGpuCapability();
    expect(cap).toHaveProperty('backend');
    expect(cap).toHaveProperty('reasons');
    expect(Array.isArray(cap.reasons)).toBe(true);
  });

  it('Node environment falls back to "none"', async () => {
    const cap = await detectGpuCapability();
    expect(cap.backend).toBe('none');
  });
});
