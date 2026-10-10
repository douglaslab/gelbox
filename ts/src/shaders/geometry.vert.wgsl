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

// Reflect the primitive before rasterization so top-left WebGPU coverage
// becomes native OpenGL bottom-left coverage after the exact pixel flip.
@vertex
fn vs_flipped(@location(0) position: vec2f, @location(1) color: vec4f) -> VsOut {
  var out: VsOut;
  out.clipPos = vec4f(
    (position.x / uGeom.gelSize.x) * 2.0 - 1.0,
    (position.y / uGeom.gelSize.y) * 2.0 - 1.0,
    0.0, 1.0
  );
  out.color = color;
  return out;
}
