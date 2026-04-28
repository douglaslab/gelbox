@fragment
fn fs_main(@location(0) color: vec4f) -> @location(0) vec4f {
  // Premultiplied additive — color RGB is already in linear space; alpha=1 for solid primitives
  return vec4f(color.rgb * color.a, color.a);
}
