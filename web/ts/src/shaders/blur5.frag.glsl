uniform sampler2D uTex0;
uniform vec2 uResolution;
uniform vec2 uDirection;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 off1 = vec2(1.3333333333333333) * uDirection;
  vec4 c = vec4(0.0);
  c += texture(uTex0, uv) * 0.29411764705882354;
  c += texture(uTex0, uv + (off1 / uResolution)) * 0.35294117647058826;
  c += texture(uTex0, uv - (off1 / uResolution)) * 0.35294117647058826;
  fragColor = c;
}
