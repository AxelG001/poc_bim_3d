  uniform float time;
  varying vec3 vColor;
  varying vec2 uUv;

  void main() {
    gl_FragColor = vec4(vColor, 1.0);
  }