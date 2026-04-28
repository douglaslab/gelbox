in vec4 vColor;
out vec4 fragColor;

void main() {
  // Premultiplied additive — color RGB is already in linear space; alpha=1 for solid primitives
  fragColor = vec4(vColor.rgb * vColor.a, vColor.a);
}
