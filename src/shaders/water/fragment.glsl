uniform vec3 uDepthColor;   // Color 1
uniform vec3 uSurfaceColor; // Color 2
uniform float uColorOffset;
uniform float uColorMultiplier;

varying float vElevation;

void main()
{
    // Mix colors based on elevation noise
    float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
    mixStrength = clamp(mixStrength, 0.0, 1.0); // Ensure it stays in [0, 1] range
    
    vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
    
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
}