import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { astronautPath, maxY, minY } from "./constValues";
import { planetData } from "./constValues";
import { CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";
import { contactData } from "./constValues";

import {
  AfterimagePass,
  BloomPass,
  BokehPass,
  EffectComposer,
  OutlinePass,
  OutputPass,
  RenderPass,
  ShaderPass,
  SMAAPass,
  UnrealBloomPass,
} from "three/examples/jsm/Addons.js";
import { DepthOfFieldEffect, EffectPass, SMAAEffect } from "postprocessing";

export function initScene() {
  return new THREE.Scene();
}

export function initSkybox(scene) {
  let geometry = new THREE.BoxGeometry(1000, 1000, 1000);
  let material = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    map: new THREE.TextureLoader().load("./textures/stars_background.jpg"),
  });
  let skybox = new THREE.Mesh(geometry, material);
  scene.add(skybox);
}

export function initSkyBox2(scene) {
  let geometry = new THREE.SphereGeometry(1000, 32, 32);
  let texture = new THREE.TextureLoader().load("./textures/space_blue.png");

  let material = new THREE.MeshStandardMaterial({
    side: THREE.BackSide,
    map: texture,
    emissive: new THREE.Color(0x222244), // Soft space glow
    emissiveMap: texture, // Use the texture to emit light
    emissiveIntensity: 1.5, // Adjust glow strength
  });

  let skybox = new THREE.Mesh(geometry, material);
  scene.add(skybox);
}

export function initSkyBox3(scene) {
  const loader = new GLTFLoader();
  loader.load(
    "./models/milkyway.glb",
    (gltf) => {
      const spaceStation = gltf.scene;
      spaceStation.position.set(0, 0, 0);
      spaceStation.scale.setScalar(100);

      // Ensure textures update properly
      spaceStation.traverse((child) => {
        if (child.isMesh) {
          child.material.needsUpdate = true;
        }
      });

      scene.add(spaceStation);
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    (error) => {
      console.error("An error happened", error);
    }
  );
}

export function initCamera() {
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
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

export function initSlider(astronaut, camera) {
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = minY;
  slider.max = maxY;
  slider.value = astronaut ? astronaut.position.y : 0;
  slider.style.position = "absolute";
  slider.style.bottom = "0px";
  slider.style.right = "0px";
  slider.style.width = "500px";
  slider.style.height = "20px";
  slider.style.zIndex = "1000";
  return document.body.appendChild(slider);
}

export function loadAstronaut(scene, callback) {
  const loader = new GLTFLoader();
  loader.load(
    astronautPath,
    (gltf) => {
      const astronaut = gltf.scene;
      astronaut.position.set(0, -5, 0);
      astronaut.scale.set(1, 1, 1);

      // Ensure textures update properly
      astronaut.traverse((child) => {
        if (child.isMesh) {
          child.material.needsUpdate = true;
        }
      });

      scene.add(astronaut);
      callback(astronaut);
    },
    (xhr) => {},

    (error) => console.error("Error loading astronaut:", error)
  );
}

/**
 * @param {scene} scene
 * @param {camera} camera
 * @returns {{mesh: THREE.Mesh, lights: THREE.Mesh, clouds: THREE.Mesh, glow: THREE.Mesh, group: THREE.Group, label: CSS3DObject, name: string}}
 * **/
export async function createPlanets(scene, camera) {
  const planets = [];
  await planetData.forEach(
    async ({ size, position, name, createFunction, tech: techUsed }) => {
      const planet = await createFunction(
        scene,
        position,
        size,
        name,
        techUsed
      );
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

export function addStars(scene, count = 1000, options = {}) {
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

export function initContactSection(scene) {
  function createContactSection(contactData) {
    const container = document.createElement("div");
    container.className = "contact-section";

    const titleDiv = document.createElement("div");
    titleDiv.className = "contact-title";
    titleDiv.textContent = contactData.title;
    container.appendChild(titleDiv);

    const descriptionDiv = document.createElement("div");
    descriptionDiv.className = "contact-description";
    descriptionDiv.textContent = contactData.description;
    container.appendChild(descriptionDiv);

    const emailDiv = document.createElement("div");
    emailDiv.className = "contact-email";
    const emailLink = document.createElement("a");
    emailLink.href = `mailto:${contactData.email}`;
    emailLink.textContent = `Email: ${contactData.email}`;
    emailDiv.appendChild(emailLink);
    container.appendChild(emailDiv);

    const linkedInDiv = document.createElement("div");
    linkedInDiv.className = "contact-linkedin";
    const linkedInLink = document.createElement("a");
    linkedInLink.target = "_blank";
    linkedInLink.href = contactData.linkedIn;
    const linkedInImg = document.createElement("img");
    linkedInImg.src = "LinkedIn.png";
    linkedInImg.height = 40;
    linkedInLink.appendChild(linkedInImg);
    linkedInDiv.appendChild(linkedInLink);

    const githubDiv = document.createElement("div");
    githubDiv.className = "contact-github";
    const githubLink = document.createElement("a");
    githubLink.target = "_blank";
    githubLink.href = contactData.github;
    const githubImg = document.createElement("img");
    githubImg.src = "./GitHub.png";
    githubImg.height = 40;
    githubLink.appendChild(githubImg);
    githubDiv.appendChild(githubLink);

    const socials = document.createElement("div");
    socials.className = "contact-socials";
    socials.appendChild(linkedInDiv);
    socials.appendChild(githubDiv);
    container.appendChild(emailDiv);
    container.appendChild(socials);

    return new CSS3DObject(container);
  }

  const contactSection = createContactSection(contactData);
  contactSection.position.set(-7.5, 210, 0);
  contactSection.scale.setScalar(0.013);
  contactSection.rotateY((Math.PI * 6) / 180);

  scene.add(contactSection);
}

export function postProccesing(scene, camera, renderer, selection) {
  // Postprocessing
  const composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);

  const bloomEffect = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.4,
    0.75,
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

  const smaaPass = new SMAAPass(
    window.innerWidth * renderer.getPixelRatio(),
    window.innerHeight * renderer.getPixelRatio()
  );

  let bokehPass = new BokehPass(scene, camera, {
    focus: 13.5,
    aperture: 0.00001,
    maxblur: 0.005,
  });

  const afterimage = new AfterimagePass();
  afterimage.uniforms["damp"].value = 0.6;

  composer.addPass(renderPass);
  composer.addPass(bloomEffect);
  composer.addPass(bokehPass);
  composer.addPass(outlinePass);
  composer.addPass(afterimage);

  composer.addPass(smaaPass);
  composer.addPass(new OutputPass());

  return { composer, bokehPass };
}
