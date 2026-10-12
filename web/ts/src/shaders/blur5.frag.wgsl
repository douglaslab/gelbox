struct PassUniforms {
  positionOffset: vec2f,
  positionScale:  vec2f,
  texCoordOffset: vec2f,
  texCoordScale:  vec2f,
  gelSize:        vec2f,
  _pad:           vec2f,
};

struct BlurUniforms {
  resolution: vec2f,
  direction:  vec2f,
};

@group(0) @binding(0) var<uniform> uPass:    PassUniforms;
@group(0) @binding(1) var          uTex0:    texture_2d<f32>;
@group(0) @binding(2) var          uSampler: sampler;
@group(0) @binding(3) var<uniform> uBlur:    BlurUniforms;

@fragment
fn fs_main(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
  let uv = fragCoord.xy / uBlur.resolution;
  let off1 = vec2f(1.3333333333333333) * uBlur.direction;
  var c = vec4f(0.0);
  c += textureSample(uTex0, uSampler, uv) * 0.29411764705882354;
  c += textureSample(uTex0, uSampler, uv + (off1 / uBlur.resolution)) * 0.35294117647058826;
  c += textureSample(uTex0, uSampler, uv - (off1 / uBlur.resolution)) * 0.35294117647058826;
  return c;
}
