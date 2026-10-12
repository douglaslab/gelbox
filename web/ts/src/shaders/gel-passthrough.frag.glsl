uniform sampler2D uTex0;
#ifdef GEL_COMPOSITE
uniform vec3 uTint;
#endif

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
#ifdef GEL_COMPOSITE
  vec4 s = texture(uTex0, vTexCoord);
  float lum = max(max(s.r, s.g), s.b);
  fragColor = vec4(s.rgb * uTint, lum);
#else
  fragColor = texture(uTex0, vTexCoord);
#endif
}
