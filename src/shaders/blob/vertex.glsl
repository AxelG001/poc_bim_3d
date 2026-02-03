uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform float uTime;

attribute vec3 position;
attribute float aRandom;

varying float vRandom;

void main() {
     vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    
    // Deform on Y axis (visible height) with reasonable frequency
    modelPosition.z += sin(modelPosition.x * 2.0 + uTime) * 0.5;
    
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    vRandom = aRandom;
}