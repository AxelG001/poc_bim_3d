uniform float time;
uniform float uIntensity;
  varying vec3 vColor;
  varying vec2 uUv;
  precision mediump float;

// Convert linear to sRGB
vec3 linearToSRGB(vec3 color) {
  return pow(color, vec3(1.0 / 2.2));
}

 void main() {
  // Clamp intensity to prevent over-bright values
  vec3 finalColor = clamp(vColor * uIntensity, 0.0, 1.0);
  gl_FragColor = vec4(finalColor, 1.0);
}