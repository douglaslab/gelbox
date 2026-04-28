uniform sampler2D uTex0;
uniform sampler2D uTexWarp;
uniform vec2 uWarpScale;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec2 warp = texture(uTexWarp, vTexCoord).xy;
  warp = (warp - vec2(0.5, 0.5)) * 2.0;
  warp = warp * uWarpScale;
  fragColor = texture(uTex0, vTexCoord + warp);
}
