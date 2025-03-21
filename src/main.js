import * as THREE from "three";
import gsap from "gsap";
import {
  initScene,
  initCamera,
  initRenderer,
  initLights,
  createPlanets,
  randomAsteroids,
  addStars,
  postProccesing,
} from "./modules/init";
import { CSS3DRenderer } from "three/addons/renderers/CSS3DRenderer.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { createDialog, initInstructions } from "./modules/dialog";
import {
  handleResize,
  handleScroll,
  handleClick,
} from "./modules/eventHandlers";
import { dialogData, sectionCoordinates } from "./modules/constValues";
import { isInBetween } from "./modules/utils";
import { setAstronautVelocity, updateAstronaut } from "./modules/astronaut";

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
  goToSection: -1, // -1 mean no section, n mean go to section n
};

// Scene Setup
const scene = initScene();
const renderer = initRenderer();
const camera = initCamera();
scene.add(camera);

const renderer3D = new CSS3DRenderer();
renderer3D.setSize(window.innerWidth, window.innerHeight);
renderer3D.domElement.id = "renderer3D";

// Append to DOM
document.body.appendChild(renderer3D.domElement);
document.body.appendChild(renderer.domElement);
// document.body.appendChild(labelRenderer.domElement);

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
  const material = new THREE.MeshBasicMaterial({
    map: texture,
  });

  const backgroundPlane = new THREE.Mesh(geometry, material);
  backgroundPlane.position.set(40, 250, -400); // Adjust as needed
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

const currentDownloaderElement = document.getElementById("current-download");

// Load Astronaut Model
currentDownloaderElement.innerText = "Downloading Astronaut Model";
const { astronaut, animations } = await loadAstronaut(scene);

// Planets
currentDownloaderElement.innerText = "Downloading Planets";
const planets = await createPlanets(scene, camera);

// Contact Section
currentDownloaderElement.innerText = "Downloading Beacon";
const beacon = await createBeacon(scene, new THREE.Vector3(-10, 460, -15));
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
currentDownloaderElement.innerText = "Downloading TechStacks";
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

// function for navigation
let isMovingToSection = false;
const handleGoto = (minY, maxY) => {
  const isInside = isInBetween(astronaut.position.y, minY, maxY);
  if (isInside && isMovingToSection === false) {
    state.goToSection = -1;
    return;
  }

  isMovingToSection = true;
  const targetPosition = new THREE.Vector3().copy(astronaut.position);
  targetPosition.y = minY + 1;
  setAstronautVelocity(0);
  astronaut.position.y = astronaut.position.lerp(targetPosition, 0.05).y;
  camera.position.y = astronaut.position.y + 2;

  if (
    isInBetween(
      astronaut.position.y,
      targetPosition.y - 0.1,
      targetPosition.y + 0.1
    )
  ) {
    isMovingToSection = false;
  }
};

window.addEventListener("resize", () =>
  handleResize(camera, renderer, renderer3D)
);

window.addEventListener("wheel", (event) =>
  handleScroll(event, astronaut, camera, state, bokehPass)
);

window.addEventListener("click", (event) =>
  handleClick(event, camera, planets, state, techStack, bokehPass, beacon)
);

const navItems = document.querySelectorAll(".nav-item");
navItems.forEach((navItem, index) => {
  navItem.addEventListener("click", () => {
    if (
      state.canMove === false ||
      state.contactShown ||
      state.currentFocus !== -1
    )
      return;
    navItems.forEach((item) => item.classList.remove("active"));
    navItem.classList.add("active");
    state.goToSection = index;
  });
});

// astronaut animations
const animation = animations[0];
const mixer = new THREE.AnimationMixer(astronaut);
const action = mixer.clipAction(animation);
action.play();

// pointer events for all children are none
renderer3D.domElement.childNodes.forEach((child) => {
  child.style.pointerEvents = "none";
});

{
  const tempElement = document.getElementById("loading");
  tempElement.style.opacity = 0;
  tempElement.style.transform = "TranslateY(100%)";

  setTimeout(() => {
    tempElement.style.display = "none";
  }, 1500);
}

// Camera Animation to astronaut
gsap.to(camera.position, {
  ease: "power4.out",
  duration: 1,
  x: 0,
  y: astronaut.position.y + 2,
  z: astronaut.position.z + 15,
});

scene.add(initInstructions());

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
const clock = new THREE.Clock();
// Animation Loop
function animate() {
  stats.begin();
  mixer.update(0.01);
  currentTime = (currentTime + Date.now() - startTime) / 1000;
  const deltaTime = clock.getDelta();

  if (state.goToSection > -1) {
    const position = sectionCoordinates[state.goToSection];
    handleGoto(position.minY, position.maxY);
  } else {
    sectionCoordinates.forEach((position, index) => {
      navItems[index].classList.remove("active");
      if (isInBetween(astronaut.position.y, position.minY, position.maxY)) {
        if (!navItems[index].classList.contains("active"))
          navItems[index].classList.add("active");
      }
    });
  }

  // planets
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

  // stars
  moveStars(currentTime);

  // asteroids
  animateAstrroProgress = (animateAstrroProgress + 0.0001 * deltaTime) % 1;
  const position = curve.getPointAt(animateAstrroProgress);
  instancedMesh.position.copy(position);
  instancedMesh.instanceMatrix.needsUpdate = true;

  // beacon
  moveBeacon(beacon, currentTime);

  // techStack
  techStack.children.forEach((stack, index) => {
    updateTechPosition(stack, currentTime, index);
    updateTechRotation(stack.children[0], currentTime, index);
  });

  if (state.goToSection === -1) {
    if (state.canMove) {
      // astronaut
      updateAstronaut(astronaut, camera, state, deltaTime);
    }

    // Dialogs
    dialogData.forEach((dialog) => {
      const dialogVisible = isInBetween(
        dialog.dialogPosition.y,
        astronaut.position.y - 2,
        astronaut.position.y + 2
      );

      if (dialogVisible) {
        // first time dialog is shown
        if (!allDialogsShown[dialog.id]) {
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

        // animate dialog
        allDialogsShown[dialog.id].position.y +=
          0.001 * Math.sin(currentTime * 1.5);
        allDialogsShown[dialog.id].position.x +=
          0.00025 * Math.cos(currentTime);
        allDialogsShown[dialog.id].position.z += 0.0005 * Math.sin(currentTime);

        // set the last dialog id
        if (lastDialogId !== dialog.id) {
          lastDialogId = dialog.id;
          state.canMove = false;
        }
        // move astronaut to dialog
        if (state.canMove === false) {
          const targetPosition = new THREE.Vector3().copy(astronaut.position);
          targetPosition.y = dialog.dialogPosition.y - 1;
          setAstronautVelocity(0);
          astronaut.position.y = astronaut.position.lerp(
            targetPosition,
            0.05
          ).y;
          camera.position.y = astronaut.position.y + 2;
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

  // render
  renderer.render(scene, camera);
  renderer3D.render(scene, camera);
  // labelRenderer.render(scene, camera);
  // controls.update();
  composer.render();
  stats.end();

  requestAnimationFrame(animate);
}

animate();
