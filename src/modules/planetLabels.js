import { CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";

/**
 * @param {THREE.Scene} scene
 * @param {string} planetName
 * @returns {CSS3DObject}
 **/
function createPlanet3DLabel(
  scene,
  planetName,
  { x = 0, y = 0, z = 0, verticalOffset = 10, scale = 0.1, planetSize = 1 } = {}
) {
  const parentDiv = document.createElement("div");
  parentDiv.className = "planet-label-wrapper";
  const div = document.createElement("div");
  div.className = "planet-label";
  div.textContent = planetName;
  parentDiv.appendChild(div);

  const label = new CSS3DObject(parentDiv);
  const scalarScalar = scale * planetSize * 0.12;
  label.scale.setScalar(scalarScalar);
  label.position.set(x, y + planetSize + verticalOffset * scalarScalar, z);

  scene.add(label);
  return label;
}

export { createPlanet3DLabel };
