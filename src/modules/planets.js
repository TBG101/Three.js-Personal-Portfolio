import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { createPlanet3DLabel } from "./planetLabels";
import { degToRad } from "three/src/math/MathUtils.js";
import { techStack } from "./constValues";
import { isInBetween } from "./utils";

function getFresnelMat({ rimHex = 0x0088ff, facingHex = 0x000000 } = {}) {
  const uniforms = {
    color1: { value: new THREE.Color(rimHex) },
    color2: { value: new THREE.Color(facingHex) },
    fresnelBias: { value: 0.1 },
    fresnelScale: { value: 1.0 },
    fresnelPower: { value: 4.0 },
  };
  const vs = `
  uniform float fresnelBias;
  uniform float fresnelScale;
  uniform float fresnelPower;
  
  varying float vReflectionFactor;
  
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  
    vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );
  
    vec3 I = worldPosition.xyz - cameraPosition;
  
    vReflectionFactor = fresnelBias + fresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), fresnelPower );
  
    gl_Position = projectionMatrix * mvPosition;
  }
  `;
  const fs = `
  uniform vec3 color1;
  uniform vec3 color2;
  
  varying float vReflectionFactor;
  
  void main() {
    float f = clamp( vReflectionFactor, 0.0, 1.0 );
    gl_FragColor = vec4(mix(color2, color1, vec3(f)), f);
  }
  `;
  const fresnelMat = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vs,
    fragmentShader: fs,
    transparent: true,
    blending: THREE.AdditiveBlending,
    // wireframe: true,
  });
  return fresnelMat;
}

function createMoon(orbitTilt, radius = 1, scale = 0.05, offsetX = 0) {
  const geometry = new THREE.IcosahedronGeometry(1, 12);
  const material = new THREE.MeshPhongMaterial({
    map: new THREE.TextureLoader().load("./textures/moon/moon.jpg"),
    bumpMap: new THREE.TextureLoader().load("./textures/moon/moon_bump.jpg"),
    bumpScale: 0.05,
  });

  const moonMesh = new THREE.Mesh(geometry, material);
  moonMesh.scale.setScalar(scale);
  moonMesh.rotation.y = THREE.MathUtils.degToRad(90);
  moonMesh.rotation.x = THREE.MathUtils.degToRad(Math.random() * 180);
  moonMesh.receiveShadow = true;
  function animateMoon(currentTime) {
    const angle = currentTime * 0.5; // Moon orbit speed

    // Calculate position in a basic circular orbit
    let x = Math.cos(angle) * (radius + offsetX);
    let z = Math.sin(angle) * (radius + offsetX);
    let y = 0; // Default y-position

    // Apply tilt using rotation matrix (or quaternion)
    const tiltMatrix = new THREE.Matrix4();
    tiltMatrix.makeRotationAxis(
      new THREE.Vector3(1, 0, 1).normalize(),
      orbitTilt
    );

    const position = new THREE.Vector3(x, y, z);
    position.applyMatrix4(tiltMatrix);

    // Set the moon's position
    moonMesh.position.set(position.x, position.y, position.z);
    moonMesh.rotation.y += 0.001;
  }

  return { moonMesh, animateMoon };
}

async function createOrbitTech(
  orbitTilt,
  orbitOffset,
  radius = 1,
  scale = 0.05,
  offsetX = 0,
  techPath = "./public/models/techstack/cpp.glb"
) {
  
  const loader = new GLTFLoader();
  /**@type {THREE.Object3D<Object3DEventMap>} */
  let techMesh = null;
  await new Promise((resolve, reject) => {
    loader.load(
      techPath,
      (gltf) => {
        techMesh = gltf.scene.children[0];
        resolve();
      },
      (progerss) => {},
      (error) => {
        console.error("Error loading tech mesh", error);
        reject();
      }
    );
  });

  techMesh.scale.setScalar(scale);
  techMesh.rotation.x = THREE.MathUtils.degToRad(90);

  const points = [];
  const segments = 64;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * (radius + offsetX),
        0,
        Math.sin(angle) * (radius + offsetX)
      )
    );
  }

  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const orbitMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    opacity: 0.15,
    transparent: true,
  });
  const orbitCircle = new THREE.LineLoop(orbitGeometry, orbitMaterial);

  // Apply tilt to orbit path
  const tiltMatrix = new THREE.Matrix4();
  tiltMatrix.makeRotationAxis(
    new THREE.Vector3(1, 0, 1).normalize(),
    orbitTilt
  );
  orbitCircle.applyMatrix4(tiltMatrix);

  function animateTech(currentTime, camera) {
    const angle = currentTime * 0.8; // Tech orbit speed

    // Calculate position in a basic circular orbit
    let x = Math.cos(angle + orbitOffset) * (radius + offsetX);
    let z = Math.sin(angle + orbitOffset) * (radius + offsetX);
    let y = 0; // Default y-position

    // Apply tilt using the same rotation matrix
    const position = new THREE.Vector3(x, y, z);
    position.applyMatrix4(tiltMatrix);

    // Set the tech's position
    techMesh.position.set(position.x, position.y, position.z);
  }

  return { techMesh, animateTech, orbitCircle };
}

async function createAllOrbits(earthGroup, techUsed, animateFunctions = []) {
  const orbitTiltAngles = [];
  const orbitBaseSpacing = 20;
  let baseOrbitRadius = 1;
  let orbitSpacing = 0.3;

  await Promise.all(
    techUsed.map(async (element, index) => {
      let icon = techStack.find((tech) => tech.name === element)?.icon;
      if (!icon) return;

      let orbitTilt = (index / techUsed.length) * 180; // Evenly distribute orbit tilts

      // Ensure spacing between orbits
      let currentIndex = 0;
      while (currentIndex < orbitTiltAngles.length) {
        while (
          isInBetween(
            orbitTilt,
            orbitTiltAngles[currentIndex] - orbitBaseSpacing,
            orbitTiltAngles[currentIndex] + orbitBaseSpacing
          )
        ) {
          orbitTilt = (Math.random() * 180).toFixed(2); // Adjust tilt if too close
          currentIndex = 0;
        }
        currentIndex++;
      }
      orbitTiltAngles.push(orbitTilt);

      let orbitRadius =
        baseOrbitRadius + index * 0.1 * Math.random() * orbitSpacing;
      let orbitOffset = index * (Math.PI / 4);

      const { techMesh, animateTech, orbitCircle } = await createOrbitTech(
        THREE.MathUtils.degToRad(orbitTilt),
        orbitOffset,
        orbitRadius,
        0.05,
        0.5,
        icon
      );
      animateFunctions.push(animateTech);
      earthGroup.add(orbitCircle);
      earthGroup.add(techMesh);
    })
  );
}

export async function createEarth(
  scene,
  position = { x: 0, y: 0, z: 0 },
  size,
  name,
  techUsed
) {
  const radius = 1;
  const earthGroup = new THREE.Group();
  earthGroup.rotation.z = (-23.4 * Math.PI) / 180;
  scene.add(earthGroup);

  const loader = new THREE.TextureLoader();
  const geometry = new THREE.IcosahedronGeometry(1, 12);
  const material = new THREE.MeshPhongMaterial({
    map: loader.load("./textures/earth/00_earthmap1k.jpg"),
    specularMap: loader.load("./textures/earth/02_earthspec1k.jpg"),
    bumpMap: loader.load("./textures/earth/01_earthbump1k.jpg"),
    bumpScale: 0.04,
  });

  // Earth Mesh
  const earthMesh = new THREE.Mesh(geometry, material);
  earthGroup.add(earthMesh);

  // Lights
  const lightsMat = new THREE.MeshBasicMaterial({
    map: loader.load("./textures/earth/03_earthlights1k.jpg"),
    blending: THREE.AdditiveBlending,
  });
  const lightsMesh = new THREE.Mesh(geometry, lightsMat);
  lightsMesh.scale.setScalar(1.02);
  earthGroup.add(lightsMesh);

  // Clouds
  const cloudsMat = new THREE.MeshStandardMaterial({
    map: loader.load("./textures/earth/04_earthcloudmap.jpg"),
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    alphaMap: loader.load("./textures/earth/05_earthcloudmaptrans.jpg"),
  });
  const cloudsMesh = new THREE.Mesh(geometry, cloudsMat);
  cloudsMesh.scale.setScalar(1.003);
  earthGroup.add(cloudsMesh);

  // Glow
  const fresnelMat = getFresnelMat();
  const glowMesh = new THREE.Mesh(geometry, fresnelMat);
  glowMesh.scale.setScalar(1.01);
  earthGroup.add(glowMesh);

  // Moon
  let animateFunctions = [];
  await createAllOrbits(earthGroup, techUsed, animateFunctions);

  // Position and Scale
  earthGroup.scale.setScalar(size);
  earthGroup.position.set(position.x, position.y, position.z);

  // Label
  const earthRadius = geometry.parameters.radius * size;
  const label = createPlanet3DLabel(scene, name, {
    x: earthGroup.position.x,
    y: earthGroup.position.y,
    z: earthGroup.position.z,
    planetSize: earthRadius,
    scale: 0.1,
  });

  return {
    mesh: earthMesh,
    lights: lightsMesh,
    clouds: cloudsMesh,
    glow: glowMesh,
    group: earthGroup,
    label: label,
    name: name,
    orbitAnimation: animateFunctions,
  };
}

export async function createMars(
  scene,
  position = { x: 0, y: 0, z: 0 },
  size,
  name,
  techUsed
) {
  const marsGroup = new THREE.Group();
  marsGroup.rotation.z = (-23.4 * Math.PI) / 180;
  scene.add(marsGroup);

  const loader = new THREE.TextureLoader();
  const geometry = new THREE.IcosahedronGeometry(1, 12);
  const material = new THREE.MeshPhongMaterial({
    map: loader.load("./textures/mars/base.jpg"),
    specularMap: loader.load("./textures/mars/glosiness.png"),
    bumpMap: loader.load("./textures/earth/bump.png"),
    bumpScale: 0.05,
  });

  const marsMesh = new THREE.Mesh(geometry, material);
  marsGroup.add(marsMesh);

  const fresnelMat = getFresnelMat({ rimHex: 0xf4d3a6 });
  const glowMesh = new THREE.Mesh(geometry, fresnelMat);
  glowMesh.scale.setScalar(1.01);
  marsGroup.add(glowMesh);
  let animateFunctions = [];
  await createAllOrbits(marsGroup, techUsed, animateFunctions);

  marsGroup.scale.setScalar(size);
  marsGroup.position.set(position.x, position.y, position.z);

  const marsRadius = geometry.parameters.radius * size;
  const label = createPlanet3DLabel(scene, name, {
    x: marsGroup.position.x,
    y: marsGroup.position.y,
    z: marsGroup.position.z,
    planetSize: marsRadius,
    scale: 0.1,
  });

  return {
    mesh: marsMesh,
    glow: glowMesh,
    group: marsGroup,
    label: label,
    name: name,
    orbitAnimation: animateFunctions,
  };
}
