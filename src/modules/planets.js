import * as THREE from "three";
import { createPlanet3DLabel } from "./planetLabels";


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

export function createEarth(scene, position = { x: 0, y: 0, z: 0 }, size, name) {
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

  const earthMesh = new THREE.Mesh(geometry, material);
  earthGroup.add(earthMesh);

  const lightsMat = new THREE.MeshBasicMaterial({
    map: loader.load("./textures/earth/03_earthlights1k.jpg"),
    blending: THREE.AdditiveBlending,
  });
  const lightsMesh = new THREE.Mesh(geometry, lightsMat);
  lightsMesh.scale.setScalar(1.02);
  earthGroup.add(lightsMesh);

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

  const fresnelMat = getFresnelMat();
  const glowMesh = new THREE.Mesh(geometry, fresnelMat);
  glowMesh.scale.setScalar(1.01);
  earthGroup.add(glowMesh);

  earthGroup.scale.setScalar(size);
  earthGroup.position.set(position.x, position.y, position.z);

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
  };
}

export function createMars(scene, position = { x: 0, y: 0, z: 0 }, size, name) {
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
  };
}
