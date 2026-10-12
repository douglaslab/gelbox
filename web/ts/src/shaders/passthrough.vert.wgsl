struct PassUniforms {
  positionOffset: vec2f,
  positionScale:  vec2f,
  texCoordOffset: vec2f,
  texCoordScale:  vec2f,
  gelSize:        vec2f,
  _pad:           vec2f,
};

@group(0) @binding(0) var<uniform> uPass: PassUniforms;

struct VsOut {
  @builtin(position) clipPos: vec4f,
  @location(0) texcoord: vec2f,
};

@vertex
fn vs_main(@location(0) position: vec2f, @location(1) texcoord: vec2f) -> VsOut {
  let gelPos = position * uPass.positionScale + uPass.positionOffset;
  // Gel-space (top-left origin, Y down) → WebGPU clip space (Y up): flip Y
  let clipXY = vec2f(
    (gelPos.x / uPass.gelSize.x) * 2.0 - 1.0,
    1.0 - (gelPos.y / uPass.gelSize.y) * 2.0
  );
  var out: VsOut;
  out.clipPos  = vec4f(clipXY, 0.0, 1.0);
  out.texcoord = texcoord * uPass.texCoordScale + uPass.texCoordOffset;
  return out;
}
