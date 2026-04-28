@group(0) @binding(1) var uTex0:    texture_2d<f32>;
@group(0) @binding(2) var uSampler: sampler;

@fragment
fn fs_main(@location(0) texcoord: vec2f) -> @location(0) vec4f {
  return textureSample(uTex0, uSampler, texcoord);
}
