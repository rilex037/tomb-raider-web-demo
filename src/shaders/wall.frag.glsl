precision mediump float;

uniform sampler2D lightmap;
uniform sampler2D wallTexture;
uniform vec2 textureResolution;
varying vec2 vUv;

void main() {
    vec3 lightColor = texture2D(lightmap, vUv).rgb;
    vec2 ditheredUV = vec2(floor(vUv.x * textureResolution.x) / textureResolution.x, vUv.y);
    vec3 wallColor = texture2D(wallTexture, ditheredUV * vec2(2.0, 1.0)).rgb;
    vec3 finalColor = wallColor * lightColor;
    gl_FragColor = vec4(finalColor, 1.0);
}