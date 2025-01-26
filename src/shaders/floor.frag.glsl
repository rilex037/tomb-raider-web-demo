precision mediump float;

uniform sampler2D lightmap;
uniform sampler2D grassTexture;
uniform vec2 floorSize;
uniform vec2 textureResolution;
varying vec2 vUv;

void main() {
    vec3 lightColor = texture2D(lightmap, vUv).rgb;
    vec2 ditheredUV = floor(vUv * textureResolution) / textureResolution;
    vec3 grassColor = texture2D(grassTexture, ditheredUV * 10.0).rgb;
    vec3 finalColor = grassColor * lightColor;
    gl_FragColor = vec4(finalColor, 1.0);
}
