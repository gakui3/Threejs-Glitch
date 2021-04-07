import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";
import simpleVert from "./shaders/simple.vert";
import glitchFrag from "./shaders/glitch.frag";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass.js";

let gui,
  mat,
  clock,
  plane,
  planeSize,
  scene,
  camera,
  canvas,
  composer,
  currentTexIndex = 0,
  textures = [],
  renderer;

const param = {
  jitterAmount: 100.0,
  chromaticaberrationAmount: 1.0,

  transitionAmount: 0,
  loopTransition: false,
  effect: "effect1",

  speed: 1.5,
  distortionStrength: 0.2,
  distortionWidth: 0.2,
  distortionInterval: 1.0,
  blockNoiseOffset: 0.15,
  blockNoiseAmount: 0.25,
  blockThickness: 5.0,
  transitionValue: 0.0,
  planeScale: 1.0,
  chromaticAberrationAmount: 1.0,
  onClick: function () {
    transitionTexture();
  },
};

function init() {
  canvas = document.querySelector("#c");
  renderer = new THREE.WebGLRenderer({ canvas });
  //renderer.setSize(800, 600);
  document.body.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  clock = new THREE.Clock();
  clock.start();
}

function update() {
  requestAnimationFrame(update);

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    composer.setSize(canvas.width, canvas.height);
  }

  let time = clock.getElapsedTime();
  mat.uniforms.time.value = time;
  TWEEN.update();
  composer.render(clock.getDelta());
}

function addGUI() {
  gui = new GUI();
  gui.width = 400;

  gui.add(param, "speed", 1.0, 3.0).onChange((value) => {
    mat.uniforms.speed.value = value;
  });
  gui.add(param, "distortionStrength", 0.01, 0.5).onChange((value) => {
    mat.uniforms.distortionStrength.value = value;
  });
  gui.add(param, "distortionWidth", 0.01, 0.5).onChange((value) => {
    mat.uniforms.distortionWidth.value = value;
  });
  gui.add(param, "distortionInterval", 0.5, 2.0).onChange((value) => {
    mat.uniforms.distortionInterval.value = value;
  });
  gui.add(param, "blockNoiseOffset", 0.05, 0.2).onChange((value) => {
    mat.uniforms.blockNoiseOffset.value = value;
  });
  gui.add(param, "blockNoiseAmount", 0.0, 1.0).onChange((value) => {
    mat.uniforms.blockNoiseAmount.value = value;
  });
  gui.add(param, "blockThickness", 0.1, 10.0).onChange((value) => {
    mat.uniforms.blockThickness.value = value;
  });
  gui.add(param, "chromaticAberrationAmount", 0.1, 2.0).onChange((value) => {
    mat.uniforms.chromaticAberrationAmount.value = value;
  });
  gui.add(param, "transitionValue", 0.0, 1.0).onChange((value) => {
    mat.uniforms.transitionValue.value = value;
  });
  gui.add(param, "planeScale", 0.1, 1.0).onChange((value) => {
    plane.scale.set(value, value, 1);
  });
  gui.add(param, "onClick").name("click this to start transition");
}

function transitionTexture() {
  let transitionTexIndex = currentTexIndex;

  //for random texture index
  // while (transitionTexIndex == currentTexIndex) {
  //   transitionTexIndex = Math.floor(Math.random() * textures.length);
  // }

  transitionTexIndex += 1;
  if (transitionTexIndex > textures.length - 1) {
    transitionTexIndex = 0;
  }

  mat.uniforms.transitionTex.value = textures[transitionTexIndex];
  mat.uniforms.transitionTexUvRate.value = calculateUvRate(
    textures[transitionTexIndex]
  );

  const p = { v: 0.0 };
  const tween01 = new TWEEN.Tween(p)
    .to({ v: 1.0 }, 200)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => {
      mat.uniforms.blockNoiseAmount.value = p.v;
    })
    .delay(100)
    .start();

  const tween02 = new TWEEN.Tween(p)
    .to({ v: 1.0 }, 150)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => {
      mat.uniforms.transitionValue.value = p.v;
    })
    .onComplete(() => {
      mat.uniforms.currentTexUvRate.value = calculateUvRate(
        textures[transitionTexIndex]
      );
      mat.uniforms.currentTex.value = textures[transitionTexIndex];
      currentTexIndex = transitionTexIndex;
      mat.uniforms.transitionValue.value = 0;
      mat.uniforms.blockNoiseAmount.value = 0;
    })
    .delay(500)
    .start();
}

function calculateUvRate(tex) {
  let uvRate = new THREE.Vector4(0, 1, 0, 1);

  if (tex.image.height * (planeSize.x / tex.image.width) <= planeSize.y) {
    let v = (tex.image.height * planeSize.x) / planeSize.y;
    v = v / tex.image.width;
    uvRate.x = (1.0 - v) / 2.0;
    uvRate.y = v + (1.0 - v) / 2.0;
  } else {
    let v = (tex.image.width * planeSize.y) / planeSize.x;
    v = v / tex.image.height;
    uvRate.z = (1.0 - v) / 2.0;
    uvRate.w = v + (1.0 - v) / 2.0;
  }

  return uvRate;
}

function addEffect() {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const filmPass = new FilmPass(
    0.15, // noise intensity
    0.025, // scanline intensity
    648, // scanline count
    false
  );
  filmPass.renderToScreen = true;
  composer.addPass(filmPass);
}

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const pixelRatio = window.devicePixelRatio;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

function addCamera() {
  camera = new THREE.PerspectiveCamera(45, 1.0, 0.1, 100);
  camera.position.set(0, 0, 0);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;

  console.log(`${canvas.clientWidth}  ${canvas.clientHeight}`);
}

async function addPlane() {
  const loader = new THREE.TextureLoader();
  let texture1 = await Promise.resolve(
    loader.loadAsync("./resources/test01.jpg")
  );
  let texture2 = await Promise.resolve(
    loader.loadAsync("./resources/test02.jpg")
  );
  let texture3 = await Promise.resolve(
    loader.loadAsync("./resources/test03.jpeg")
  );

  textures.push(texture1);
  textures.push(texture2);
  textures.push(texture3);

  planeSize = new THREE.Vector2(3.5, 5.0);

  let uvRate = calculateUvRate(texture1);

  mat = new THREE.ShaderMaterial({
    uniforms: {
      currentTex: { value: texture1 },
      transitionTex: { value: texture2 },
      currentTexUvRate: { value: uvRate },
      transitionTexUvRate: { value: uvRate },
      time: { value: 0.0 },
      speed: { value: 1.5 },
      distortionStrength: { value: 0.3 },
      distortionWidth: { value: 0.2 },
      distortionInterval: { value: 1.0 },
      blockNoiseOffset: { value: 0.15 },
      blockNoiseAmount: { value: 0.25 },
      blockThickness: { value: 5.0 },
      transitionValue: { value: 0.0 },
      chromaticAberrationAmount: { value: 1.0 },
    },
    vertexShader: simpleVert,
    fragmentShader: glitchFrag,
  });

  const geometry = new THREE.PlaneGeometry(planeSize.x, planeSize.y); //0.75 1.0
  plane = new THREE.Mesh(geometry, mat);
  plane.name = "plane";
  plane.position.z = -7;
  scene.add(plane);
}

(async function () {
  init();
  addCamera();
  await addPlane();
  addEffect();
  addGUI();
  update();
})();
