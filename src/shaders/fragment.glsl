uniform float time;
uniform float uIntensity;
varying vec3 vColor;
varying vec2 uUv;
precision mediump float;

void main() {
  // Pass color through directly without clamping hard at 1.0 immediately for better HDR-like behavior
  // or clamp just at the end.
  vec3 finalColor = vColor * uIntensity;
  
  // Output color
  gl_FragColor = vec4(finalColor, 1.0);
  
  // OPTIONAL: If using THREE.ColorManagement (which you are), 
  // you might need to output Linear space if the rest of the pipeline expects it.
  // But usually for background skyboxes, standard output is fine.
}