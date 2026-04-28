uniform sampler2D uTex0;
uniform vec2 uResolution;
uniform vec2 uDirection;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 off1 = vec2(1.411764705882353)  * uDirection;
  vec2 off2 = vec2(3.2941176470588234) * uDirection;
  vec2 off3 = vec2(5.176470588235294)  * uDirection;
  vec4 c = vec4(0.0);
  c += texture(uTex0, uv) * 0.1964825501511404;
  c += texture(uTex0, uv + (off1 / uResolution)) * 0.2969069646728344;
  c += texture(uTex0, uv - (off1 / uResolution)) * 0.2969069646728344;
  c += texture(uTex0, uv + (off2 / uResolution)) * 0.09447039785044732;
  c += texture(uTex0, uv - (off2 / uResolution)) * 0.09447039785044732;
  c += texture(uTex0, uv + (off3 / uResolution)) * 0.010381362401148057;
  c += texture(uTex0, uv - (off3 / uResolution)) * 0.010381362401148057;
  fragColor = c;
}
