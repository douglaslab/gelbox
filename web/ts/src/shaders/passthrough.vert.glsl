in vec2 aPos;
in vec2 aTexCoord;

uniform vec2 uPositionOffset;
uniform vec2 uPositionScale;
uniform vec2 uTexCoordOffset;
uniform vec2 uTexCoordScale;
uniform vec2 uGelSize;

out vec2 vTexCoord;

void main() {
  vec2 gelPos = aPos * uPositionScale + uPositionOffset;
  // Gel-space (top-left origin, Y down) → clip space (Y up): flip Y
  vec2 clipXY = vec2(
    (gelPos.x / uGelSize.x) * 2.0 - 1.0,
    1.0 - (gelPos.y / uGelSize.y) * 2.0
  );
  gl_Position = vec4(clipXY, 0.0, 1.0);
  vTexCoord = aTexCoord * uTexCoordScale + uTexCoordOffset;
}
