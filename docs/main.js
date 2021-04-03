import * as THREE from "three";
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
  scene,
  texture1,
  texture2,
  camera,
  canvas,
  composer,
  currentTex,
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

  // currentTex = 0;
  // canvas.addEventListener("click", onClick, false);
}

function update() {
  requestAnimationFrame(update);

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    composer.setSize(canvas.width, canvas.height);
  }

  mat.uniforms.time.value = clock.getElapsedTime();

  composer.render(clock.getDelta());
}

function addGUI() {
  gui = new GUI();
  gui.width = 300;

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
  gui.add(param, "transitionValue", 0.0, 1.0).onChange((value) => {
    mat.uniforms.transitionValue.value = value;
  });
}

function easeInOutQuart(x) {
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
}

function transitionTexture() {}

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
  camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 100);
  camera.position.set(0, 0, 0);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
}

function onClick(e) {
  console.log(e);
}

async function addPlane() {
  const loader = new THREE.TextureLoader();
  texture1 = await Promise.resolve(loader.loadAsync("./resources/test01.jpg"));
  texture2 = await Promise.resolve(loader.loadAsync("./resources/test02.jpg"));

  mat = new THREE.ShaderMaterial({
    uniforms: {
      currentTex: { value: texture1 },
      transitionTex: { value: texture2 },
      time: { value: 0.0 },
      speed: { value: 1.5 },
      distortionStrength: { value: 0.3 },
      distortionWidth: { value: 0.2 },
      distortionInterval: { value: 1.0 },
      blockNoiseOffset: { value: 0.15 },
      blockNoiseAmount: { value: 0.25 },
      blockThickness: { value: 5.0 },
      transitionValue: { value: 0.0 },
    },
    vertexShader: simpleVert,
    fragmentShader: glitchFrag,
  });

  const geometry = new THREE.PlaneGeometry(8, 8);
  plane = new THREE.Mesh(geometry, mat);
  plane.name = "plane";
  plane.position.z = -10;
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
