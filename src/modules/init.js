import * as THREE from "three";
import { maxY, minY } from "./constValues";
import { planetData } from "./constValues";

import {
  AfterimagePass,
  BokehPass,
  EffectComposer,
  OutlinePass,
  OutputPass,
  RenderPass,
  UnrealBloomPass,
} from "three/examples/jsm/Addons.js";
import { SSAARenderPass } from "three/addons/postprocessing/SSAARenderPass.js";
import { createDetailedDescription } from "./planets";

export function initScene() {
  return new THREE.Scene();
}

export function initCamera() {
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 50);
  const light = new THREE.PointLight(0xffffff, 500, 50);
  camera.add(light);
  return camera;
}

export function initRenderer() {
  const renderer = new THREE.WebGLRenderer({
    powerPreference: "high-performance",
    antialias: false,
    depth: false,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.top = "0";
  renderer.domElement.style.left = "0";
  renderer.domElement.style.zIndex = 50;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.shadowMap.enabled = true;

  return renderer;
}

export function initLights(scene) {
  const sunLight = new THREE.DirectionalLight(0xffffff, 3.0);
  sunLight.castShadow = true;
  sunLight.shadow.camera.far = 500;
  sunLight.shadow.camera.near = 0.1;
  sunLight.shadow.mapSize.set(1024, 1024);

  sunLight.position.set(0.5, 0.5, 1);
  scene.add(sunLight);
}

/**
 * @param {scene} scene
 * @param {camera} camera
 * @returns {{mesh: THREE.Mesh, lights: THREE.Mesh, clouds: THREE.Mesh, glow: THREE.Mesh, group: THREE.Group, label: CSS3DObject, name: string}}
 * **/
export async function createPlanets(scene) {
  const planets = [];
  await planetData.forEach(
    async (
      { size, position, name, createFunction, tech: techUsed, description },
      index
    ) => {
      const planet = await createFunction(
        scene,
        position,
        size,
        name,
        techUsed,
        description,
        index
      );
      createDetailedDescription(name, techUsed, description, index);

      planetData[index].documentSectionEl = document.getElementById(name);
      planets.push(planet);
    }
  );
  return planets;
}

export function addStar(scene, options = {}) {
  const {
    size = 0.25, // Default star size
    spread = 100, // Default spread range
    color = 0xffffff, // Default color
    speed = 0.01, // Default rotation speed
    movementSpeed = 0.01, // Default movement speed
    movementRange = 10, // Default movement range
  } = options;

  const geometry = new THREE.SphereGeometry(size, 8, 8);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color).offsetHSL(Math.random() * 0.1, 0, 0),
    emissive: color,
    emissiveIntensity: 0.5,
  });

  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(spread));

  star.position.set(x, y, z);

  // Add properties for rotation and movement
  star.rotationSpeed = speed;
  star.movementSpeed = movementSpeed;
  star.movementRange = movementRange;
  star.originalPosition = new THREE.Vector3(x, y, z);

  scene.add(star);

  return star; // Return the star object for further manipulation
}

export function addStars(scene, count = 750, options = {}) {
  const {
    size = 0.25, // Default star size
    spread = 500, // Default spread range
    color = 0xffffff, // Default color
  } = options;

  const geometry = new THREE.SphereGeometry(size, 8, 8);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color).offsetHSL(Math.random() * 0.1, 0, 0), // Slight color variation
    emissive: color, // Makes stars glow
    emissiveIntensity: 0.5,
  });

  const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i++) {
    const x = THREE.MathUtils.randFloatSpread(500);
    const y = THREE.MathUtils.randInt(-50, spread);
    const z = THREE.MathUtils.randInt(-15, (-1 * spread) / 2);

    dummy.position.set(x, y, z);
    dummy.rotation.set(
      Math.random() * 2 * Math.PI,
      Math.random() * 2 * Math.PI,
      Math.random() * 2 * Math.PI
    );
    dummy.updateMatrix();

    instancedMesh.setMatrixAt(i, dummy.matrix);
  }

  scene.add(instancedMesh);

  return instancedMesh; // Return the instanced mesh for further manipulation
}

export function randomAsteroids(scene, count = 50, spread = 250) {
  const asteroidGeometry = new THREE.DodecahedronGeometry(0.5, 0);
  const asteroidMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });

  const instancedMesh = new THREE.InstancedMesh(
    asteroidGeometry,
    asteroidMaterial,
    count
  );
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i++) {
    const [x, y, z] = Array(3)
      .fill()
      .map(() => THREE.MathUtils.randFloatSpread(spread));

    dummy.position.set(x, y, z);
    dummy.rotation.set(
      Math.random() * 2 * Math.PI,
      Math.random() * 2 * Math.PI,
      Math.random() * 2 * Math.PI
    );
    dummy.updateMatrix();

    instancedMesh.setMatrixAt(i, dummy.matrix);
  }

  instancedMesh.instanceMatrix.needsUpdate = true; // Ensure the instance matrix is updated
  scene.add(instancedMesh);

  const offsetZ = -100;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-200, -25, offsetZ),
    new THREE.Vector3(-0, 25, offsetZ),
    new THREE.Vector3(200, -25, offsetZ),
  ]);

  return { curve, instancedMesh };
}

export function postProccesing(scene, camera, renderer, selection) {
  // Postprocessing
  const composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);

  const bloomEffect = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.35,
    0.5,
    0.4
  );

  const outlinePass = new OutlinePass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    scene,
    camera
  );
  outlinePass.edgeStrength = 0.8;
  outlinePass.edgeGlow = 0;
  outlinePass.edgeThickness = 1;
  outlinePass.visibleEdgeColor.set(0xffffff);
  outlinePass.hiddenEdgeColor.set(0x000000);
  outlinePass.selectedObjects = selection;

  // const smaaPass = new SMAAPass(
  //   window.innerWidth * renderer.getPixelRatio(),
  //   window.innerHeight * renderer.getPixelRatio()
  // );

  const ssaaPass = new SSAARenderPass(scene, camera);
  ssaaPass.sampleLevel = 1;

  let bokehPass = new BokehPass(scene, camera, {
    focus: 13.5,
    aperture: 0.000001,
    maxblur: 0.03,
  });

  const afterimage = new AfterimagePass();
  afterimage.uniforms["damp"].value = 0.6;

  composer.addPass(renderPass);
  composer.addPass(ssaaPass);
  // composer.addPass(smaaPass);
  composer.addPass(bloomEffect);
  composer.addPass(bokehPass);
  composer.addPass(outlinePass);
  composer.addPass(afterimage);

  composer.addPass(new OutputPass());

  return { composer, bokehPass };
}
