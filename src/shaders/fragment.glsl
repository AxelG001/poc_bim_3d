 uniform float time;
  uniform float uIntensity;
  varying vec3 vColor;
  varying vec2 uUv;

  void main() {
    gl_FragColor = vec4(vColor * uIntensity, 1.0); 
}