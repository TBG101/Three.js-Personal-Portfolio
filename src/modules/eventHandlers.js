import * as THREE from "three";
import gsap from "gsap";
import { maxY, minY, planetData } from "./constValues";
import { moveAstronaut } from "./astronaut";

/**
 * @typedef {Object} Planet
 * @property {THREE.Mesh} mesh
 * @property {THREE.Mesh} lights
 * @property {THREE.Mesh} clouds
 * @property {THREE.Mesh} glow
 * @property {THREE.Group} group
 * @property {CSS3DObject} label
 * @property {string} name
 */

export function handleResize(camera, renderer, labelRenderer) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  labelRenderer.setSize(width, height);
}

/**
 * @param {HTMLElement} astronutLabelDiv
 * @param {THREE.Camera} camera
 * @param {THREE.Mesh} astronaut
 * @param {{canMove: boolean, currentFocus: number, contactShown: boolean}} state
 * @param {BokehPass} bokehPass
 *  **/
export function handleScroll(event, astronaut, camera, state, bokehPass) {
  if (!state.canMove) return;
  if (event.deltaY === 0) return;
  if (!astronaut) return;
  if (state.contactShown) return;

  const cameraDistanceToAstronaut = camera.position.distanceTo(
    astronaut.position
  );
  // const defaultDistanceCameraToAstro = 15.2;

  if (gsap.isTweening(camera.position)) return;

  if (state.currentFocus !== -1) {
    if (gsap.isTweening(astronaut.position)) return;
    if (gsap.isTweening(camera.position)) return;
    gsap.to(camera.position, {
      y: astronaut.position.y + 2,
      z: astronaut.position.z + 15,
      x: astronaut.position.x,
      duration: 0.5,
      ease: "power2",
      onComplete: () => {
        state.currentFocus = -1;
        state.canMove = true;
      },
    });
    gsap.to(bokehPass.uniforms["focus"], {
      value: cameraDistanceToAstronaut,
      duration: 0.5,
      ease: "power2",
    });

    planetData.forEach((planet) => {
      if (!planet.documentSectionEl) return;
      planet.documentSectionEl.classList.remove("visible");
      planet.documentSectionEl.classList.add("hidden");
    });
    return;
  }

  const deltaY = event.deltaY * -0.045;
  const newAstronautY = astronaut.position.y + deltaY;
  const clampedAstronautY = Math.max(minY, Math.min(maxY, newAstronautY));
  moveAstronaut(
    astronaut,
    camera,
    new THREE.Vector3(
      astronaut.position.x,
      clampedAstronautY,
      astronaut.position.z
    )
  );
  // moveAstronaut(astronaut, camera, clampedAstronautY);
  state.currentFocus = -1;
}

/**
 * @param {MouseEvent} event
 * @param {THREE.Camera} camera
 * @param {Planet[]} planets
 * @param {{canMove: boolean, currentFocus: number}} state
 * @param {THREE.Group<THREE.Object3DEventMap>} techStacks
 * @param {BokehPass} bokehPass
 * @returns {void}
 * @description Handle the click event
 */
export function handleClick(
  event,
  camera,
  planets,
  state,
  techStacks,
  bokehPass,
  beacon
) {
  if (!state.canMove) {
    state.canMove = true; // Enable scrolling
    state.currentFocus = -1; // Reset the focus
    return;
  }

  if (state.currentFocus === -1) {
    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    // Check if the ray intersects with the beacon
    const beaconIntersects = raycaster.intersectObjects([beacon]);
    if (beaconIntersects.length > 0) {
      const element = document.getElementById("sos-interface");
      element.className = "visible";
      state.contactShown = true;
      return;
    }

    // Check if the ray intersects with the techStacks
    const techStackBoundingBoxes = techStacks.children.map((child) => {
      const box = new THREE.Box3().setFromObject(child);
      const worldPosition = new THREE.Vector3();
      child.getWorldPosition(worldPosition);
      return { box, child, worldPosition };
    });

    const techStackIntersects = techStackBoundingBoxes.filter(({ box }) => {
      return (
        box.containsPoint(raycaster.ray.origin) ||
        raycaster.ray.intersectsBox(box)
      );
    });

    if (techStackIntersects.length > 0) {
      const techStackGroup = techStackIntersects[0].child;
      techStackGroup.scale.set(1.5, 1.5, 1.5);
      return;
    }
  }

  const mouse = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const meshIntersects = planets.map((planet) => {
    return planet.mesh;
  });

  const intersects = raycaster.intersectObjects(meshIntersects);

  // If the ray intersects with a planet
  if (intersects.length > 0 && !gsap.isTweening(camera.position)) {
    // get the planet group
    /** @type {THREE.Group<THREE.Object3DEventMap>} group **/
    let group;
    let name = "";
    let planetIndex = -1;
    planets.forEach((planet) => {
      if (planet.mesh === intersects[0].object) {
        group = planet.group;
        name = planet.name;
        planetIndex = planets.indexOf(planet);
      }
    });

    if (state.currentFocus === planetIndex) {
      return; // Do nothing if the planet is already focused
    }

    state.currentFocus = planetIndex;
    // calculate safe position for camera
    const boundingBox = new THREE.Box3().setFromObject(group);
    const boundingSphere = boundingBox.getBoundingSphere(new THREE.Sphere());
    const safeDistance = boundingSphere.radius * 1.3;
    const newCameraPosition = new THREE.Vector3().copy(group.position);
    newCameraPosition.z += safeDistance;
    gsap.to(bokehPass.uniforms["focus"], {
      value: group.position.distanceTo(newCameraPosition),
      duration: 1.5,
      ease: " power2.inOut",
    });

    const fov = camera.fov * (Math.PI / 180); // convert vertical fov to radians
    const screenHeight = 2 * Math.tan(fov / 2) * safeDistance; // screen height at the safe distance
    const screenWidth = screenHeight * camera.aspect; // screen width at the safe distance
    const offsetX = screenWidth / 6; // offset to center the planet in the left half of the screen
    const reverse = group.position.x < 0 ? -1 : 1; // reverse the offset if the planet is on the
    planetData.forEach((planet) => {
      if (!planet.documentSectionEl) return;
      planet.documentSectionEl.classList.remove("visible");
      planet.documentSectionEl.classList.add("hidden");
    });
    
    gsap.to(camera.position, {
      x: group.position.x + offsetX * reverse,
      y: group.position.y,
      z: group.position.z + safeDistance, // Move the camera outside the atmosphere
      duration: 1.5,
      ease: "power2.inOut",
      onComplete: () => {
        const selectedElement = planetData.find(
          (planet) => planet.name === name
        ).documentSectionEl;
        if (!selectedElement) return;
        selectedElement.classList.remove("hidden");
        selectedElement.classList.add("visible");
      },
    });
  }
}
