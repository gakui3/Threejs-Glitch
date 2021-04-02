import * as THREE from "three";
import simpleVert from "./shaders/simple.vert";
import glitchFrag from "./shaders/glitch.frag";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";
import { ShaderMaterial } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass.js";

let gui, mat, clock, plane, scene, texture1, camera, canvas, composer, renderer;

const param = {
  jitterAmount: 100.0,
  chromaticaberrationAmount: 1.0,

  transitionAmount: 0,
  loopTransition: false,
  effect: "effect1",

  speed: 0.2,
  strength: 0.3,
  stretch: 0.02,
  offset: 0.15,
  amount: 0.25,
  thickness: 5.0,
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

  let time = performance.now() * 0.001;
  time = time;
  mat.uniforms.time.value = time;

  //renderer.render(scene, camera);
  composer.render(clock.getDelta());
}

function addGUI() {
  gui = new GUI();
  gui.width = 300;

  gui.add(param, "speed", 0.1, 0.5).onChange((value) => {
    mat.uniforms.speed.value = value;
  });
  gui.add(param, "strength", 0.0, 2.0).onChange((value) => {
    mat.uniforms.strength.value = value;
  });
  gui.add(param, "stretch", 0.0, 0.2).onChange((value) => {
    mat.uniforms.stretch.value = value;
  });
  gui.add(param, "offset", 0.01, 0.2).onChange((value) => {
    mat.uniforms.offset.value = value;
  });
  gui.add(param, "amount", 0.0, 1.0).onChange((value) => {
    mat.uniforms.amount.value = value;
  });
  gui.add(param, "thickness", 0.01, 10.0).onChange((value) => {
    mat.uniforms.thickness.value = value;
  });
}

function easeInOutQuart(x) {
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
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
  camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 100);
  camera.position.set(0, 0, 0);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
}

async function addPlane() {
  const loader = new THREE.TextureLoader();
  texture1 = await Promise.resolve(loader.loadAsync("./resources/test2.jpg"));

  mat = new THREE.ShaderMaterial({
    uniforms: {
      tex1: { value: texture1 },
      time: { value: 1.0 },
      speed: { value: 0.2 },
      strength: { value: 0.3 },
      stretch: { value: 0.02 },
      offset: { value: 0.15 },
      amount: { value: 0.25 },
      thickness: { value: 5.0 },
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
