import GUI from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { Howl } from "howler";

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Audio Setup with Howler.js
 */
const sound = new Howl({
  src: ["troll_music.mp3"],
  volume: 0.3,
  autoplay: true,
  loop: true,
  onloaderror: function (id, error) {
    console.error("Error loading audio:", error);
  },
});

/**
 * Loaders
 */
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/");

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Model
 */
let whiteFish = null;
let purpleFish = null;
let rocket = null;
let fire = null;
let rocketBaseY = null;
let fermArm = null;
let arm = null;
let head = null;

gltfLoader.load("phineas_compressed.glb", (gltf) => {
  gltf.scene.traverse((child) => {
    if (child.name === "White_Fish") {
      whiteFish = child;
    } else if (child.name === "Purple_Fish") {
      purpleFish = child;
    } else if (child.name === "Rocket") {
      rocket = child;
      rocketBaseY = child.position.y;
    } else if (child.name === "fire") {
      fire = child;
      fire.visible = false;
    } else if (child.name === "ferm_arm") {
      fermArm = child;
    } else if (child.name === "arm") {
      arm = child;
    } else if (child.name === "head") {
      head = child;
    }

    if (child.isMesh) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      child.material = materials.map((mat) => {
        const basic = new THREE.MeshBasicMaterial();

        if (mat.map) basic.map = mat.map;
        else if (mat.color) basic.color = mat.color;

        if (mat.transparent) {
          basic.transparent = mat.transparent;
          basic.opacity = mat.opacity;
          basic.alphaMap = mat.alphaMap;
        }

        basic.side = mat.side;
        mat.dispose();
        return basic;
      });

      if (!Array.isArray(child.material) || child.material.length === 1) {
        child.material = Array.isArray(child.material)
          ? child.material[0]
          : child.material;
      }
    }
  });

  scene.add(gltf.scene);
});

scene.background = new THREE.Color(0x000000);

/**
 * Scroll Handling
 */
const scrollState = {
  targetY: 0,
  currentY: 0,
};

const ROCKET_MAX_Y = 45;
const SCROLL_SPEED = 0.01;

window.addEventListener("wheel", (event) => {
  scrollState.targetY += event.deltaY * SCROLL_SPEED;
  scrollState.targetY = Math.max(
    0,
    Math.min(ROCKET_MAX_Y, scrollState.targetY),
  );
});

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
const CAMERA_BASE_POSITION = new THREE.Vector3(
  -10.39179673171055,
  2.7233475263359805,
  0.24856013604615687,
);
const CONTROLS_BASE_TARGET = new THREE.Vector3(
  2.7504822780636977,
  1.5199821333314436,
  0.4028514328745653,
);

const camera = new THREE.PerspectiveCamera(
  50,
  sizes.width / sizes.height,
  0.1,
  1000,
);
camera.position.copy(CAMERA_BASE_POSITION);
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enableZoom = false;
controls.target.copy(CONTROLS_BASE_TARGET);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Smooth scroll interpolation
  scrollState.currentY += (scrollState.targetY - scrollState.currentY) * 0.08;

  // Apply rocket scroll movement + update fire/rocket visibility
  if (rocket && rocketBaseY !== null) {
    const newY = rocketBaseY + scrollState.currentY;
    rocket.position.y = newY;

    const launched = scrollState.currentY >= ROCKET_MAX_Y - 0.05;

    rocket.visible = !launched;

    if (fire) {
      fire.position.copy(rocket.position);
      fire.visible = launched;
    }
  }

  // Move camera and orbit target up/down with the rocket's smoothed Y offset
  camera.position.y = CAMERA_BASE_POSITION.y + scrollState.currentY;
  controls.target.y = CONTROLS_BASE_TARGET.y + scrollState.currentY;

  // Animate fish floating up and down
  if (whiteFish) {
    whiteFish.position.y += Math.sin(elapsedTime * 0.8) * 0.006;
  }

  if (purpleFish) {
    purpleFish.position.y +=
      Math.sin(elapsedTime * 1.2 + Math.PI * 0.5) * 0.006;
  }

  if (fermArm) {
    fermArm.rotation.x = Math.sin(elapsedTime * 1.0) * 0.3;
  }

  if (arm) {
    arm.rotation.x = Math.sin(elapsedTime * 1.0 + Math.PI * 0.3) * 0.3;
  }

  if (head) {
    head.rotation.y = Math.sin(elapsedTime * 1.2) * 0.3;
  }

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
