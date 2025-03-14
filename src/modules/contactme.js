import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";
import { degToRad } from "three/src/math/MathUtils.js";
import { vec2 } from "three/tsl";
/**
 * @param {any} scene
 * @param {THREE.Vector3} beaconPosition
 */
export async function createBeacon(scene, beaconPosition) {
  const beacon = await new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      "./models/alien_beacon.glb",
      (gltf) => {
        const beacon = gltf.scene;

        beacon.position.copy(beaconPosition);
        beacon.scale.setScalar(1);
        scene.add(beacon);

        resolve(beacon);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error("An error happened", error);
        reject(error);
      }
    );
  });
  return beacon;
}

export async function moveBeacon(beacon, currentTime) {
  beacon.position.y = Math.sin(currentTime) * 0.2 + 233;
  beacon.position.x = Math.cos(currentTime) * 0.4 - 10;
  beacon.position.z = Math.sin(currentTime) * 0.8 - 15;

  const z = Math.sin(currentTime * 0.5 + 40) * 10 - 5;
  const y = Math.cos(currentTime * 0.5) * 2.5;
  const x = Math.sin(currentTime * 0.5) * 5;

  beacon.rotation.z = degToRad(z);
  beacon.rotation.y = degToRad(y);
  beacon.rotation.x = degToRad(x);

}
