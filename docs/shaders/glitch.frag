#include <common>
#define PI 3.141592653589793

uniform sampler2D currentTex;
uniform sampler2D transitionTex;
uniform float time;
uniform float speed;
uniform float distortionStrength;
uniform float distortionWidth;
uniform float distortionInterval;
uniform float blockNoiseOffset;
uniform float blockNoiseAmount;
uniform float blockThickness;
uniform float transitionValue;
// uniform float distortionT

varying vec3 pos;
varying vec2 texcoord;

float rand2d(vec2 seed){
    return fract(sin(dot(seed * floor(10.0 * speed), vec2(127.1, 311.7))) * 43758.5453123);
}

float rand1d(float seed){
    return rand2d(vec2(seed, 1.0));
}

float hash(vec2 d) {
    float angleY = 311.7;
    float y = 43758.5453123;
    float x = 127.1;
    float m = dot(d, vec2(x,angleY)); // 
    return -1.0 + 2.0*fract(sin(m)*y); // 
}

float noise(vec2 d) {
    vec2 i = floor(d);
    vec2 f = fract(d);
    vec2 u = f*f*(3.0-2.0*f); // 
    return mix(mix(hash( i + vec2(0.0,0.0) ), hash( i + vec2(1.0,0.0) ), u.x), mix( hash( i + vec2(0.0,1.0) ), hash( i + vec2(1.0,1.0) ), u.x), u.y);
}

float noise1(vec2 d) {
    vec2 s = vec2 ( 1.6,  1.2);
    float f  = 0.0;
    for(int i = 1; i < 3; i++){ float mul = 1.0/pow(2.0, float(i)); f += mul*noise(d); d = s*d; }
    return f;
}

vec3 rgb2yuv( vec3 rgb ){
    vec3 yuv;
    yuv.x = dot( rgb, vec3(0.299,0.587,0.114) );
    yuv.y = dot( rgb, vec3(-0.14713, -0.28886, 0.436) );
    yuv.z = dot( rgb, vec3(0.615, -0.51499, -0.10001) );
    return yuv;
}

vec3 yuv2rgb( vec3 yuv ){
    vec3 rgb;
    rgb.r = yuv.x + yuv.z * 1.13983;
    rgb.g = yuv.x + dot( vec2(-0.39465, -0.58060), yuv.yz );
    rgb.b = yuv.x + yuv.y * 2.03211;
    return rgb;
}

float randomTransition(float minmam){
    vec2 grid = vec2(20, 100);

    float _x = floor(texcoord.x * grid.x);
    float _y = floor(texcoord.y * grid.y);

    float v = rand2d(vec2(_x, _y));
    return step(minmam, v);
}

float sat1d( float t ) { return clamp( t, 0.0, 1.0 ); }
vec2 sat2d( vec2 t ) { return clamp( t, 0.0, 1.0 ); }
float _rand( vec2 n ) { return fract(sin(dot(n.xy, vec2(12.9898, 78.233)))* 43758.5453); }
float trunc1d( float x, float num_levels ) { return floor(x * num_levels) / num_levels; }
vec2 trunc2d( vec2 x, vec2 num_levels ) { return floor(x * num_levels) / num_levels; }

void main() {
    float mR = 0.08;
    float _blockNoiseAmount = 1.01 - blockNoiseAmount;
    float _blockThickness = 10.01 - blockThickness;
    float _time = time * speed;

    //distortion
    vec2 uv = texcoord;
    // vec2 hp = vec2(0.0, uv.y);
    // float nh = noise1(hp * 7.0 + _time * speed * 10.0) * (noise(hp + _time * speed * 0.3) * 0.8);
    // nh += noise1(hp * 100.0 + _time * speed * 10.0) * stretch;
    // vec2 _texcoord = texcoord + vec2(nh, 0.08 * mR) * nh * strength;
    vec2 _texcoord = vec2(texcoord.x, texcoord.y);
    float _t = (_time * 0.1  + texcoord.y) * distortionInterval;
    float v = (_t - floor(_t));
    if(v >= 0.0 && v <= distortionWidth * distortionInterval){
        float vv = smoothstep(0.0, distortionWidth * distortionInterval, v);
        vv = sin(vv * PI) * distortionStrength * 0.1;
        _texcoord.x += vv;
    }

    //vec2 _texcoord = vec2(sin(_time+texcoord.y)*0.1+texcoord.x, texcoord.y);

    //block noise
    uv = _texcoord;
    float ct = trunc1d(_time, 4.0);
    float change_rnd = _rand( trunc2d(uv.yy, vec2(16.0, 16.0)) + 150.0 * ct);
    float tf = 24.0 * change_rnd;
    float t = 12.0 * trunc1d(_time, tf);
    float vt_rnd = 0.5 * _rand(trunc2d(uv.yy + t, vec2(11.0 * _blockThickness, 11.0 * _blockThickness)));
    vt_rnd += 0.5 * _rand(trunc2d(uv.yy + t, vec2(7.0, 7.0)));
    vt_rnd = vt_rnd * 2.0 - 1.0;
    vt_rnd = sign(vt_rnd) * sat1d( (abs(vt_rnd) - _blockNoiseAmount) / (0.40));
    vt_rnd = mix(0.0, vt_rnd, blockNoiseOffset);
    vt_rnd = clamp(vt_rnd, 0.0, 1.0);
    vec2 uv_nm = uv;
    uv_nm = sat2d( uv_nm + vec2(0.1 * vt_rnd, 0.0));
    float rn= trunc1d( _time, 2.0 );
    float rnd = _rand( vec2(rn,rn));

    //rgb shift
    float offset_r = noise(vec2(_time, 1.0)) * 0.005;
    float offset_g = noise(vec2(_time, 2.0)) * 0.005;
    float offset_b = noise(vec2(_time, 3.0)) * 0.005;
    float tv = randomTransition(transitionValue);
    float samp_r = mix(texture2D( currentTex, uv_nm + vec2(0, offset_r)).r, texture2D( transitionTex, uv_nm + vec2(0, offset_r)).r, tv);
    float samp_g = mix(texture2D( currentTex, uv_nm - vec2(0, offset_g)).g, texture2D( transitionTex, uv_nm - vec2(0, offset_g)).g, tv);
    float samp_b = mix(texture2D( currentTex, uv_nm + vec2(0, offset_b)).b, texture2D( transitionTex, uv_nm + vec2(0, offset_b)).b, tv);
    vec4 samp = vec4(samp_r, samp_g, samp_b, 1.0);

    // vec4 samp = texture2D( currentTex, uv_nm);
    // vec3 sample_yuv = rgb2yuv(samp.rgb); 
    // sample_yuv.y /= 1.0-3.0 * abs(vt_rnd) * sat1d( 0.5 - vt_rnd);
    // sample_yuv.z += 0.125 * vt_rnd * sat1d( vt_rnd - 0.5);
    // vec4 c = vec4( yuv2rgb(sample_yuv), 1.0);
    gl_FragColor = samp;


    // vec4 c0 = texture2D(currentTex, texcoord);
    // vec4 c1 = texture2D(transitionTex, texcoord);
    // vec4 c2 = mix(c0, c1, randomTransition(transitionValue));
}