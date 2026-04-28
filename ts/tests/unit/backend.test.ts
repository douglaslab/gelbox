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
