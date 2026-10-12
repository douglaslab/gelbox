struct CompositeUniforms {
  tint: vec4f,  // RGB = band color, A = unused (band brightness applied via tex.rgb)
};

@group(0) @binding(1) var          uTex0:    texture_2d<f32>;
@group(0) @binding(2) var          uSampler: sampler;
@group(0) @binding(3) var<uniform> uComp:    CompositeUniforms;

@fragment
fn fs_main(@location(0) texcoord: vec2f) -> @location(0) vec4f {
  return textureSample(uTex0, uSampler, texcoord);
}

@fragment
fn fs_composite(@location(0) texcoord: vec2f) -> @location(0) vec4f {
  // Source is band RT in linear space: RGB encodes brightness, A is whatever
  // the geometry pass accumulated. C++ reads source RGB and multiplies by
  // gl::color = band.mColor; alpha is gl_FragColor.a which becomes the
  // (SRC_ALPHA, ONE) factor for additive blend. We use premultiplied additive
  // (ONE, ONE), so emit RGB premultiplied by the band's luminance signal
  // (already in tex.rgb) modulated by the tint, with alpha = luminance.
  let s = textureSample(uTex0, uSampler, texcoord);
  let lum = max(max(s.r, s.g), s.b);
  return vec4f(s.rgb * uComp.tint.rgb, lum);
}
