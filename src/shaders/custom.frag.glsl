precision mediump float;

uniform sampler2D lightmap;
uniform sampler2D baseTexture;
uniform vec2 floorSize;
uniform vec3 modelPosition;
uniform vec3 baseColor;
uniform vec2 textureResolution;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
    vec2 lightmapUV = (modelPosition.xz + floorSize / 2.0) / floorSize;
    vec3 lightColor = texture2D(lightmap, lightmapUV).rgb;
    vec2 ditheredUV = floor(vUv * textureResolution) / textureResolution;
    vec3 texColor = texture2D(baseTexture, ditheredUV).rgb;
    vec3 finalColor = texColor * lightColor * baseColor;
    gl_FragColor = vec4(finalColor, 1.0);
}
