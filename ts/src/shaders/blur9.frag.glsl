uniform sampler2D uTex0;
uniform vec2 uResolution;
uniform vec2 uDirection;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 off1 = vec2(1.3846153846) * uDirection;
  vec2 off2 = vec2(3.2307692308) * uDirection;
  vec4 c = vec4(0.0);
  c += texture(uTex0, uv) * 0.2270270270;
  c += texture(uTex0, uv + (off1 / uResolution)) * 0.3162162162;
  c += texture(uTex0, uv - (off1 / uResolution)) * 0.3162162162;
  c += texture(uTex0, uv + (off2 / uResolution)) * 0.0702702703;
  c += texture(uTex0, uv - (off2 / uResolution)) * 0.0702702703;
  fragColor = c;
}
