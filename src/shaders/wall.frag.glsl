precision mediump float;

uniform sampler2D lightmap;
uniform sampler2D wallTexture;
uniform vec2 textureResolution;
varying vec2 vUv;

void main() {
    vec3 lightColor = texture2D(lightmap, vUv).rgb;
    vec2 ditheredUV = floor(vUv * textureResolution) / textureResolution;
    vec3 wallColor = texture2D(wallTexture, ditheredUV).rgb;
    vec3 finalColor = wallColor * lightColor;
    gl_FragColor = vec4(finalColor, 1.0);
}
