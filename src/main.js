import * as THREE from "three";
import gsap from "gsap";

import {
  initScene,
  initCamera,
  initRenderer,
  initLights,
  createPlanets,
  randomAsteroids,
  initSlider,
  addStars,
  postProccesing,
} from "./modules/init";
import { CSS3DRenderer } from "three/addons/renderers/CSS3DRenderer.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { createDialog } from "./modules/dialog";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  handleResize,
  handleScroll,
  handleClick,
} from "./modules/eventHandlers";
import { dialogData } from "./modules/constValues";
import { isInBetween } from "./modules/utils";
import { moveAstronaut, updateAstronaut } from "./modules/astronaut";


import {
  initTechStackSection,
  updateTechPosition,
  updateTechRotation,
} from "./modules/techStack";
import { createBeacon, moveBeacon } from "./modules/contactme";
import { loadAstronaut } from "./modules/astronaut";

/**
 * keep hold of the current focus
 * -1 means on astronaut
 * -2 means on dialog
 * n means on planet n
 * **/
const state = {
  canMove: true,
  currentFocus: -1, // -1 means on astronaut, -2 means on dialog, n means on planet n,
  contactShown: false,
};

// Scene Setup
const scene = initScene();
const renderer = initRenderer();
const camera = initCamera();
scene.add(camera);

const renderer3D = new CSS3DRenderer();
renderer3D.setSize(window.innerWidth, window.innerHeight);
renderer3D.domElement.id = "renderer3D";

// Ensure pointer events for all children are none
renderer3D.domElement.childNodes.forEach((child) => {
  child.style.pointerEvents = "none";
});

// Append to DOM
document.body.appendChild(renderer3D.domElement);
document.body.appendChild(renderer.domElement);
// document.body.appendChild(labelRenderer.domElement);

// // orbit control
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = false;

// Helpers
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// Lights
initLights(scene);

// Background - HDR Space Texture
const loader = new THREE.TextureLoader();
loader.load("./textures/space_blue.png", (texture) => {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.setScalar(1);
  texture.encoding = THREE.sRGBEncoding;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.encoding = THREE.sRGBEncoding;

  scene.environment = texture;
  scene.background = texture;

  const aspectRatio = texture.image.width / texture.image.height;
  const geometry = new THREE.PlaneGeometry(1000 * aspectRatio, 1000);
  const material = new THREE.MeshBasicMaterial({ map: texture });

  const backgroundPlane = new THREE.Mesh(geometry, material);
  backgroundPlane.position.set(0, 0, -500); // Adjust as needed
  scene.add(backgroundPlane);
});

// Stars
let stars = addStars(scene, 2000);
function moveStars(currentTime) {
  const deltaX = Math.sin(currentTime);
  const deltaY = Math.cos(currentTime);
  const deltaZ = Math.sin(currentTime);
  stars.position.x += deltaX * 0.001;
  stars.position.y += deltaY * 0.001;
  stars.position.z += deltaZ * 0.001;
}

// Load Astronaut Model
const { astronaut, animations } = await loadAstronaut(scene);

// Planets
const planets = await createPlanets(scene, camera);

// Contact Section
const beacon = await createBeacon(scene, new THREE.Vector3(-10, 233, -15));
document.getElementById("close-sos").addEventListener("click", () => {
  state.contactShown = false;
  const element = document.getElementById("sos-interface");
  element.classList.remove("visible");
  element.classList.add("hidden");
});

// astroids
let animateAstrroProgress = 0;
const { curve, instancedMesh } = randomAsteroids(scene, 200);

// techStack
const techStack = await initTechStackSection(scene, camera);
let selection = [];

techStack.children.forEach((stack) => {
  selection.push(stack.children[0]);
});
selection.push(beacon);

// Post Processing
const { composer, bokehPass } = postProccesing(
  scene,
  camera,
  renderer,
  selection
);

// Stats
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

// Slider for Astronaut Position Y
const slider = initSlider(astronaut, camera);

// Event Listeners
slider.addEventListener("input", (event) => {
  if (astronaut) {
    const targetPosition = new THREE.Vector3().copy(astronaut.position);
    targetPosition.y = event.target.value;
    moveAstronaut(astronaut, camera, targetPosition);
  }
});

window.addEventListener("resize", () =>
  handleResize(camera, renderer, renderer3D)
);

window.addEventListener("wheel", (event) =>
  handleScroll(event, astronaut, camera, state, bokehPass)
);

window.addEventListener("click", (event) =>
  handleClick(event, camera, planets, state, techStack, bokehPass, beacon)
);

gsap.to(camera.position, {
  ease: "power4.out",
  duration: 1,
  x: 0,
  y: astronaut.position.y + 2,
  z: astronaut.position.z + 15,
});

// astronaut animations
const animation = animations[0];
console.log(animation);
const mixer = new THREE.AnimationMixer(astronaut);
const action = mixer.clipAction(animation);
action.play();

// animate needed data
/** @type {CSS3DObject[]} **/
let allDialogsShown = [];

let astroHeight = 0;
let lastDialogId = -1;
let idsToshow = {};
dialogData.forEach((dialog) => {
  idsToshow[dialog.id] = false;
});
const startTime = Date.now();
let currentTime = 0;

const boundingBox = new THREE.Box3().setFromObject(astronaut);
astroHeight = boundingBox.max.y - boundingBox.min.y;
// Animation Loop
function animate() {
  stats.begin();
  mixer.update(0.01);
  currentTime = (currentTime + Date.now() - startTime) / 1000;

  planets.forEach((planet) => {
    if (planet.mesh) planet.mesh.rotation.y += 0.002;
    if (planet.lights) planet.lights.rotation.y += 0.002;
    if (planet.clouds) planet.clouds.rotation.y += 0.0023;
    if (planet.glowMesh) planet.glowMesh.rotation.y += 0.002;
    if (planet.orbitAnimation) {
      planet.orbitAnimation.forEach((animateFunction) => {
        animateFunction(currentTime, camera);
      });
    }
  });

  moveStars(currentTime);

  // asteroids
  animateAstrroProgress = (animateAstrroProgress + 0.0001) % 1;
  const position = curve.getPointAt(animateAstrroProgress);
  instancedMesh.position.copy(position);
  instancedMesh.instanceMatrix.needsUpdate = true;

  // Dialogs
  dialogData.forEach((dialog) => {
    const dialogVisible = isInBetween(
      dialog.dialogPosition.y,
      astronaut.position.y - 2,
      astronaut.position.y + 2
    );

    if (dialogVisible) {
      if (!allDialogsShown[dialog.id]) {
        allDialogsShown[dialog.id] = createDialog(scene, dialog.text, {
          x: dialog.dialogPosition.x,
          y: dialog.dialogPosition.y + astroHeight / 2,
          z: astronaut.position.z,
        });

        setTimeout(() => {
          idsToshow[dialog.id] = true;
          allDialogsShown[dialog.id].element.className = "user-dialog visible";
        }, 50);
      }

      allDialogsShown[dialog.id].position.y +=
        0.001 * Math.sin(currentTime * 1.5);
      allDialogsShown[dialog.id].position.x += 0.00025 * Math.cos(currentTime);
      allDialogsShown[dialog.id].position.z += 0.0005 * Math.sin(currentTime);

      if (lastDialogId !== dialog.id) {
        lastDialogId = dialog.id;
        state.canMove = false;
        const targetPosition = new THREE.Vector3().copy(astronaut.position);
        targetPosition.y = dialog.dialogPosition.y;

        moveAstronaut(astronaut, camera, targetPosition);
      }
      if (allDialogsShown[dialog.id] && idsToshow[dialog.id]) {
        allDialogsShown[dialog.id].element.className = "user-dialog visible";
      }
    } else {
      if (allDialogsShown[dialog.id]) {
        allDialogsShown[dialog.id].element.className = "user-dialog hidden";
      }
    }

    if (lastDialogId === dialog.id && !dialogVisible) {
      lastDialogId = -1;
      state.canMove = true;
    }
  });

  moveBeacon(beacon, currentTime);

  // techStack
  techStack.children.forEach((stack, index) => {
    updateTechPosition(stack, currentTime, index);
    updateTechRotation(stack.children[0], currentTime, index);
  });

  updateAstronaut(astronaut,camera,state);
  

  // render
  renderer.render(scene, camera);
  renderer3D.render(scene, camera);
  // labelRenderer.render(scene, camera);
  stats.end();
  // controls.update();
  composer.render();
  requestAnimationFrame(animate);
}

animate();
