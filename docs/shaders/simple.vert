#include <common>

varying vec3 pos;
varying vec2 texcoord;

void main() {
      pos = position;
      texcoord = uv;
      vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
      vec4 mvPosition =  viewMatrix * worldPosition;
      gl_Position = projectionMatrix * mvPosition;
}