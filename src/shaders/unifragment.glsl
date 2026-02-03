precision highp float;

in vec2 vTextureCoord;
in vec3 vVertexPosition;

uniform float time;
uniform vec2 uMousePos;
uniform vec2 uResolution;
uniform vec3 uColor[5];

out vec4 fragColor;

const float PI = 3.14159265359;
const float TAU = 6.28318530718;

uvec2 pcg2d(uvec2 v) {
    v = v * 1664525u + 1013904223u;
    v.x += v.y * v.y * 1664525u + 1013904223u;
    v.y += v.x * v.x * 1664525u + 1013904223u;
    v ^= v >> 16;
    v.x += v.y * v.y * 1664525u + 1013904223u;
    v.y += v.x * v.x * 1664525u + 1013904223u;
    return v;
}

float randFibo(vec2 p) {
    uvec2 v = floatBitsToUint(p);
    v = pcg2d(v);
    uint r = v.x ^ v.y;
    return float(r) / float(0xffffffffu);
}

vec3 anchoredPal(float t, vec3 col1, vec3 col2) {
    vec3 mid = 0.5 * (col1 + col2);
    vec3 axisAmp = 0.5 * (col2 - col1);
    vec3 base = mid + axisAmp * cos(TAU * t);
    vec3 col = clamp(base, -10.0, 10.0);
    col = 1.0 / (1.0 + exp(-col * 4.0 + 0.25) * 7.5);
    return clamp(col, 0.0, 1.0);
}

mat2 rot(float a) {
    return mat2(cos(a), -sin(a), sin(a), cos(a));
}

vec3 hash3(vec2 p) {
    vec3 q = vec3(dot(p, vec2(127.1, 311.7)),
                  dot(p, vec2(269.5, 183.3)),
                  dot(p, vec2(419.2, 371.9)));
    return fract(sin(q) * 43758.5453);
}

float voronoise(vec2 uv, float uTime) {
    float u = 1.0;
    float v = 1.0;
    vec2 drift = vec2(0.0, uTime * 0.008);
    vec2 skew = vec2(0.5, 0.5);
    
    vec2 x = (uv * skew * 2.0) - drift * mix(1.0, 14.0, 0.12) * 2.0;
    vec2 p = floor(x);
    vec2 f = fract(x);
    float k = 1.0 + 63.0 * pow(1.0 - v, 4.0);
    float va = 0.0;
    float wt = 0.0;
    
    for (int j = -2; j <= 2; j++) {
        for (int i = -2; i <= 2; i++) {
            vec2 g = vec2(float(i), float(j));
            vec3 o = hash3(p + g) * vec3(u, u, 1.0);
            o.xy += 0.5 * vec2(
                sin(uTime * 0.1 + o.x * 6.28),
                cos(uTime * 0.1 + o.y * 6.28)
            );
            vec2 r = g - f + o.xy;
            float d = dot(r, r);
            float ww = pow(1.0 - smoothstep(0.0, 1.414, sqrt(d)), k);
            va += o.z * ww;
            wt += ww;
        }
    }
    return va / max(wt, 1e-5);
}

float getNoise(vec2 uv, float uTime) {
    float turb = 0.54 * 2.5;
    float noise = voronoise(uv, uTime);
    return mix(0.5, noise, turb);
}

void main() {
    vec2 uv = vTextureCoord;
    float uTime = time * 0.001; // Convert ms to seconds
    
    float aspectRatio = uResolution.x / max(uResolution.y, 1.0);
    vec2 aspect = vec2(aspectRatio, 1.0);
    
    vec2 pos = vec2(0.5, 0.5);
    float scale = mix(1.0, 14.0, 0.12);
    mat2 rotation = rot(0.0);
    
    vec2 st = (uv - pos) * aspect * scale * rotation;
    float noise = getNoise(st, uTime);
    
    float shift = 0.31;
    vec3 noiseColor = anchoredPal(noise + shift, uColor[0], uColor[2]);
    
    float dither = (randFibo(gl_FragCoord.xy) - 0.5) / 255.0;
    noiseColor += dither * 0.5;
    
    fragColor = vec4(clamp(noiseColor, 0.0, 1.0), 1.0);
}