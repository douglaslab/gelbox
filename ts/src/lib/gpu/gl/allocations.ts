/**
 * Roll back a synchronous renderer constructor on a borrowed context. Successful
 * constructors keep their normal ownership; no hooks survive the constructor.
 */
export function withGlAllocationRollback<T>(gl: WebGL2RenderingContext, build: () => T): T {
  const pending = new Map<object, () => void>();
  const restore: (() => void)[] = [];
  const methods = gl as unknown as Record<string, (...args: any[]) => any>;
  function replace(name: string, value: (...args: any[]) => any) {
    const descriptor = Object.getOwnPropertyDescriptor(gl, name);
    Object.defineProperty(gl, name, { configurable: true, writable: true, value });
    restore.push(() => {
      if (descriptor) Object.defineProperty(gl, name, descriptor);
      else delete methods[name];
    });
  }
  try {
    for (const kind of ['Buffer', 'Texture', 'Framebuffer', 'Renderbuffer', 'VertexArray', 'Shader', 'Program', 'Sampler']) {
      const create = methods[`create${kind}`], destroy = methods[`delete${kind}`];
      replace(`create${kind}`, (...args: any[]) => {
        const resource = create.apply(gl, args);
        if (resource) pending.set(resource, () => destroy.call(gl, resource));
        return resource;
      });
      replace(`delete${kind}`, (resource: object | null) => {
        if (resource) pending.delete(resource);
        destroy.call(gl, resource);
      });
    }
    return build();
  } catch (error) {
    for (const destroy of [...pending.values()].reverse()) destroy();
    throw error;
  } finally {
    for (const undo of restore.reverse()) undo();
  }
}
