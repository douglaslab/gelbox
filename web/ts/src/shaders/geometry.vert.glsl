in vec2 aPos;
in vec4 aColor;

uniform vec2 uGelSize;

out vec4 vColor;

void main() {
  vec2 clipXY = vec2(
    (aPos.x / uGelSize.x) * 2.0 - 1.0,
    1.0 - (aPos.y / uGelSize.y) * 2.0
  );
  gl_Position = vec4(clipXY, 0.0, 1.0);
  vColor = aColor;
}
