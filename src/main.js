import * as THREE from "three";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer";
import gsap from "gsap";

import {
  initScene,
  initCamera,
  initRenderer,
  initLights,
  loadAstronaut,
  createPlanets,
  randomAsteroids,
  initSlider,
  initContactSection,
  initSkybox,
  initSkyBox2,
  addStars,
  postProccesing,
} from "./modules/init";
import {
  CSS3DObject,
  CSS3DRenderer,
} from "three/addons/renderers/CSS3DRenderer.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { createDialog } from "./modules/dialog";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  handleResize,
  handleScroll,
  handleClick,
} from "./modules/eventHandlers";
import { dialogData, techStackDirection } from "./modules/constValues";
import { moveAstronaut } from "./modules/movement";
import { isInBetween } from "./modules/utils";

import {
  initTechStackSection,
  updateTechPosition,
  updateTechRotation,
} from "./modules/techStack";

/**
 * keep hold of the current focus
 * -1 means on astronaut
 * -2 means on dialog
 * n means on planet n
 * **/
const state = {
  canMove: true,
  currentFocus: -1, // -1 means on astronaut, -2 means on dialog, n means on planet n
};

// Scene Setup
const scene = initScene();
const renderer = initRenderer();
const camera = initCamera();
scene.add(camera);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.id = "labelRenderer";

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
  scene.environment = texture;
  scene.background = texture;

  const aspectRatio = texture.image.width / texture.image.height;
  const geometry = new THREE.PlaneGeometry(1000 * aspectRatio, 1000);
  const material = new THREE.MeshBasicMaterial({ map: texture });

  const backgroundPlane = new THREE.Mesh(geometry, material);
  backgroundPlane.position.set(0, 0, -500); // Adjust as needed
  scene.add(backgroundPlane);
});

/*
OLD STARS
Array(600)
  .fill()
  .forEach(() => {
    let star = addStar(scene, {
      size: Math.random() * 0.5, // Random star size
      spread: 300, // Default spread range
      color: 0xffffff, // Default color
      speed: Math.random() * 0.02, // Random rotation speed
      movementSpeed: Math.random() * 0.02, // Random movement speed
      movementRange: Math.random() * 30, // Random movement range
    });
    stars.push(star);
  }); */

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
/** @type {THREE.Group<THREE.Object3DEventMap>} **/
let astronaut;
loadAstronaut(scene, (loadedAstronaut) => {
  astronaut = loadedAstronaut;
  gsap.to(camera.position, {
    ease: "power4.out",
    duration: 1,
    x: 0,
    y: astronaut.position.y + 2,
    z: astronaut.position.z + 15,
  });
});

// Planets
const planets = createPlanets(scene);

// Contact Section
initContactSection(scene);

// astroids
let animateAstrroProgress = 0;
const { curve, instancedMesh } = randomAsteroids(scene, 200);

// techStack
const techStack = await initTechStackSection(scene, camera);
console.log(techStack);
let selection = [];

console.log("techStack.children", techStack.children);

techStack.children.forEach((stack, index) => {
  selection.push(stack.children[0]);
});

console.log("selectionmain", selection);
// Post Processing
const { composer, depthOfFieldEffect } = postProccesing(
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
    moveAstronaut(astronaut, camera, parseInt(event.target.value));
  }
});

window.addEventListener("resize", () =>
  handleResize(camera, renderer, labelRenderer)
);

window.addEventListener("wheel", (event) =>
  handleScroll(event, astronaut, camera, depthOfFieldEffect, state)
);

window.addEventListener("click", (event) =>
  handleClick(event, camera, planets, depthOfFieldEffect, state, techStack)
);

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
// Animation Loop
function animate() {
  stats.begin();
  currentTime = (currentTime + Date.now() - startTime)  / 1000;
  console.log(currentTime);
  

  if (astronaut && astroHeight === 0) {
    const boundingBox = new THREE.Box3().setFromObject(astronaut);
    astroHeight = boundingBox.max.y - boundingBox.min.y;
  }

  planets.forEach((planet) => {
    if (planet.mesh) planet.mesh.rotation.y += 0.002;
    if (planet.lights) planet.lights.rotation.y += 0.002;
    if (planet.clouds) planet.clouds.rotation.y += 0.0023;
    if (planet.glowMesh) planet.glowMesh.rotation.y += 0.002;
  });

  // stars.forEach((star) => {
  //   star.rotation.x += star.rotationSpeed;
  //   star.rotation.y += star.rotationSpeed;

  //   // Move the star within a range
  //   const deltaX =
  //     Math.sin(currentTime * star.movementSpeed) * star.movementRange;
  //   const deltaY =
  //     Math.cos(currentTime * star.movementSpeed) * star.movementRange;
  //   const deltaZ =
  //     Math.sin(currentTime * star.movementSpeed) * star.movementRange;

  //   star.position.set(
  //     star.originalPosition.x + deltaX,
  //     star.originalPosition.y + deltaY,
  //     star.originalPosition.z + deltaZ
  //   );
  // });
  moveStars(currentTime);

  // asteroids
  animateAstrroProgress = (animateAstrroProgress + 0.0001) % 1;
  const position = curve.getPointAt(animateAstrroProgress);
  instancedMesh.position.copy(position);
  instancedMesh.instanceMatrix.needsUpdate = true;

  if (astronaut && astroHeight) {
    dialogData.forEach((dialog) => {
      const dialogVisible = isInBetween(
        dialog.dialogPosition.y,
        astronaut.position.y - 2,
        astronaut.position.y + 2
      );

      if (dialogVisible) {
        if (!allDialogsShown[dialog.id]) {
          console.log(dialog.text);
          allDialogsShown[dialog.id] = createDialog(scene, dialog.text, {
            x: dialog.dialogPosition.x,
            y: dialog.dialogPosition.y + astroHeight / 2,
            z: astronaut.position.z,
          });

          setTimeout(() => {
            idsToshow[dialog.id] = true;
            allDialogsShown[dialog.id].element.className =
              "user-dialog visible";
          }, 50);
        }

        allDialogsShown[dialog.id].position.y +=
          0.001 * Math.sin(currentTime * 1.5);

        if (lastDialogId !== dialog.id) {
          lastDialogId = dialog.id;
          state.canMove = false;
          moveAstronaut(astronaut, camera, dialog.dialogPosition.y);
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
  }

  // techStack
  techStack.children.forEach((stack, index) => {
    updateTechPosition(stack, currentTime, index);
    updateTechRotation(stack.children[0], currentTime, index);
  });

  // render
  renderer.render(scene, camera);
  renderer3D.render(scene, camera);
  // labelRenderer.render(scene, camera);
  stats.end();
  // controls.update();
  requestAnimationFrame(animate);
  composer.render();
}

animate();
