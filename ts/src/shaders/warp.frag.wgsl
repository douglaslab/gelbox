struct PassUniforms {
  positionOffset: vec2f, positionScale: vec2f,
  texCoordOffset: vec2f, texCoordScale: vec2f,
  gelSize: vec2f, _pad: vec2f,
};
struct WarpUniforms { scale: vec2f, _pad: vec2f };

@group(0) @binding(0) var<uniform> uPass:    PassUniforms;
@group(0) @binding(1) var          uTex0:    texture_2d<f32>;
@group(0) @binding(2) var          uSampler: sampler;
@group(0) @binding(3) var          uTexWarp: texture_2d<f32>;
@group(0) @binding(4) var<uniform> uWarp:    WarpUniforms;

@fragment
fn fs_main(@location(0) texcoord: vec2f) -> @location(0) vec4f {
  var warp = textureSample(uTexWarp, uSampler, texcoord).xy;
  warp = (warp - vec2f(0.5, 0.5)) * 2.0;
  warp = warp * uWarp.scale;
  return textureSample(uTex0, uSampler, texcoord + warp);
}
