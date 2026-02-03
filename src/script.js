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
// Texture loader

// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/");

// GLTF loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Textures
 */

/**
 * Model
 */
let whiteFish = null;
let purpleFish = null;

gltfLoader.load("real_trolls.glb", (gltf) => {
  // Find the fish meshes in the loaded model
  gltf.scene.traverse((child) => {
    if (child.name === "White_Fish") {
      whiteFish = child;
    } else if (child.name === "Purple_Fish") {
      purpleFish = child;
    }

    // Update texture filtering for all materials
    if (child.isMesh && child.material) {
      // Handle both single materials and material arrays
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((material) => {
        // Iterate through all possible texture properties
        Object.keys(material).forEach((key) => {
          const value = material[key];

          // Check if this property is a texture
          if (value && value.isTexture) {
            value.minFilter = THREE.LinearFilter;
            value.magFilter = THREE.LinearFilter;
            value.needsUpdate = true;
          }
        });
      });
    }
  });

  scene.add(gltf.scene);
});

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  50,
  sizes.width / sizes.height,
  0.1,
  1000,
);
camera.position.set(
  -10.531037848972133,
  2.8900567700050646,
  0.020307391191941804,
);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(2.3683907718243873, 1.0882903359783558, 2.15332652306971);

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
  console.log(camera.position);
  console.log(controls.target);
  // Animate fish floating up and down
  if (whiteFish) {
    // White fish floats with a slower, gentle motion
    whiteFish.position.y += Math.sin(elapsedTime * 0.8) * 0.006;
  }

  if (purpleFish) {
    purpleFish.position.y +=
      Math.sin(elapsedTime * 1.2 + Math.PI * 0.5) * 0.006;
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
