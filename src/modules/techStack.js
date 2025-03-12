import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { techStack } from "./constValues";
import { CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";
import { techStackDirection } from "./constValues";

export async function initTechStackSection(scene, camera) {
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `;

  const fragmentShader = `
  uniform sampler2D tex;
  uniform float glowIntensity;
  uniform float depthFactor;
  varying vec2 vUv;
  
  void main() {
      vec4 texColor = texture2D(tex, vUv);
  
      // **Enhanced Background Fill (Gradient with Ambient Influence)**
      vec4 bgColor = mix(vec4(0.05, 0.05, 0.15, 1.0), vec4(0.15, 0.0, 0.3, 1.0), vUv.y);
  
      // **Smooth Transparency Handling**
      float alphaFactor = smoothstep(0.0, 0.5, texColor.a);  // Soft transition
      vec4 finalColor = mix(bgColor, texColor, alphaFactor); // Improved blending
  
      // **Soft Blue Glow Effect**
      float glow = glowIntensity * texColor.a * 0.8;
      finalColor.rgb += glow * vec3(0.4, 0.6, 1.0);
  
      // **Specular Highlighting for Shine**
      vec3 lightDir = normalize(vec3(0.6, 0.5, 1.0)); 
      vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
      vec3 normal = vec3(0.0, 0.0, 1.0);
  
      float specular = pow(max(dot(reflect(-lightDir, normal), viewDir), 0.0), 24.0);
      finalColor.rgb += vec3(1.0) * specular * 0.5; 
  
      // **Outer Glow Effect for Neon-like Look**
      float dist = length(vUv - vec2(0.5));
      float outerGlow = smoothstep(0.5, 1.0, dist) * glowIntensity * 1.2;
      finalColor.rgb += outerGlow * vec3(0.2, 0.5, 1.0); 
  
      // **Fresnel Edge Effect for Border Glow**
      float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
      finalColor.rgb += fresnel * vec3(0.3, 0.7, 1.2) * 0.6; 
  
      gl_FragColor = finalColor;
  }
  
  `;

  let techStackGroup = new THREE.Group();
  const loader = new GLTFLoader();
  const half = Math.ceil(techStack.length / 2);
  const Zaxis = -10;
  const gridSize = 3;
  const spacing = 5;
  const YOffset = 40;

  function createLabel(text) {
    const div = document.createElement("div");
    div.className = "label";
    div.textContent = text;
    return new CSS3DObject(div);
  }

  async function loadStack(stack, index, isSecondHalf) {
    return new Promise((resolve) => {
      const path = stack.icon.split("/").slice(0, -1).join("/");
      const name = stack.icon.split("/").pop();
      loader.setPath(path + "/");
      loader.load(name, (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if (child.isMesh) {
            const originalMaterial = child.material;
            child.material = new THREE.MeshStandardMaterial({
              color: originalMaterial.color,
              map: originalMaterial.map,
              metalness: 0,
              roughness: 0.5,
              emissiveIntensity: 0.5,
              emissiveMap: originalMaterial.map,
            });
          }
        });
        const x =
          (isSecondHalf ? 1 : -1) * (index % gridSize) * spacing +
          ((isSecondHalf ? 1 : -1) * (gridSize * spacing)) / 2;
        const y = YOffset + Math.floor(index / gridSize) * spacing;

        model.position.set(0, 0, 0); // Ensure the model is at the center of myStack
        model.rotation.set(THREE.MathUtils.degToRad(90), 0, 0);
        model.scale.setScalar(0.6);

        const label = createLabel(stack.name);
        label.scale.setScalar(0.03);
        label.position.set(
          model.position.x,
          model.position.y - 2,
          model.position.z
        );

        const myStack = new THREE.Object3D();

        myStack.add(model);
        myStack.add(label);
        myStack.position.set(x, y, Zaxis);

        techStackGroup.add(myStack);
        resolve();
      });
    });
  }

  const promises = techStack.map((stack, index) => {
    const isSecondHalf = index >= half;
    return loadStack(stack, index % half, isSecondHalf);
  });

  await Promise.all(promises);
  scene.add(techStackGroup);

  return techStackGroup;
}

/** @param {THREE.Group<THREE.Object3DEventMap>} tech **/
export function updateTechPosition(tech, time, index) {
  const speed = 1;
  const { direction, randomFactor } = techStackDirection[index];
  tech.position.x += Math.sin(time * speed * randomFactor) * 0.0001 * direction;
  tech.position.y +=
    Math.sin(time * speed * randomFactor) * 0.00018 * direction;
  tech.position.z += Math.sin(time * speed * randomFactor) * 0.0002 * direction;
}

/**
 * @param {THREE.Object3D<THREE.Object3DEventMap>} tech
 */
export function updateTechRotation(tech, time, index) {
  const speed = 0.5;
  const { direction, randomFactor } = techStackDirection[index];
  tech.rotation.x = THREE.MathUtils.degToRad(
    Math.sin(time * speed * randomFactor) * 4 * randomFactor * direction + 90
  );
  tech.rotation.y = THREE.MathUtils.degToRad(
    Math.sin(time * speed * randomFactor) * 4 * randomFactor * direction
  );
  tech.rotation.z = THREE.MathUtils.degToRad(
    Math.sin(time * speed * randomFactor) * 4 * randomFactor * direction
  );
}
