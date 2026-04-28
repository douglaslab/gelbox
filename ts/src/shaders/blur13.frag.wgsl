struct PassUniforms {
  positionOffset: vec2f, positionScale: vec2f,
  texCoordOffset: vec2f, texCoordScale: vec2f,
  gelSize: vec2f, _pad: vec2f,
};
struct BlurUniforms { resolution: vec2f, direction: vec2f };

@group(0) @binding(0) var<uniform> uPass:    PassUniforms;
@group(0) @binding(1) var          uTex0:    texture_2d<f32>;
@group(0) @binding(2) var          uSampler: sampler;
@group(0) @binding(3) var<uniform> uBlur:    BlurUniforms;

@fragment
fn fs_main(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
  let uv = fragCoord.xy / uBlur.resolution;
  let off1 = vec2f(1.411764705882353)  * uBlur.direction;
  let off2 = vec2f(3.2941176470588234) * uBlur.direction;
  let off3 = vec2f(5.176470588235294)  * uBlur.direction;
  var c = vec4f(0.0);
  c += textureSample(uTex0, uSampler, uv) * 0.1964825501511404;
  c += textureSample(uTex0, uSampler, uv + (off1 / uBlur.resolution)) * 0.2969069646728344;
  c += textureSample(uTex0, uSampler, uv - (off1 / uBlur.resolution)) * 0.2969069646728344;
  c += textureSample(uTex0, uSampler, uv + (off2 / uBlur.resolution)) * 0.09447039785044732;
  c += textureSample(uTex0, uSampler, uv - (off2 / uBlur.resolution)) * 0.09447039785044732;
  c += textureSample(uTex0, uSampler, uv + (off3 / uBlur.resolution)) * 0.010381362401148057;
  c += textureSample(uTex0, uSampler, uv - (off3 / uBlur.resolution)) * 0.010381362401148057;
  return c;
}
