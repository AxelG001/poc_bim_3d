precision mediump float;

out vec2 vTextureCoord;
out vec3 vVertexPosition;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vTextureCoord = uv;
    vVertexPosition = position;
}