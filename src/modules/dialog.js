import { CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";

function createDialog(scene, msg, position = { x: 0, y: 0, z: 0 }) {
  const div = document.createElement("div");
  div.id = "user-dialog";
  div.className = "hidden";

  const label = new CSS3DObject(div);
  label.position.set(position.x, position.y, position.z);
  label.scale.setScalar(0.02);
  const angle = 6;
  if (position.x > 0) {
    label.rotateY((-Math.PI * angle) / 180);
  } else {
    label.rotateY((Math.PI * angle) / 180);
  }
  scene.add(label);

  const span = document.createElement("span");
  const textSpan = div.appendChild(span.cloneNode());
  const cursorSpan = div.appendChild(span);
  cursorSpan.id = "text-cursor";
  cursorSpan.textContent = "|";

  // Typewriter Effect with Consistent Speed
  function typeWriterEffect(text, element, speed = 40) {
    let i = 0;
    function type() {
      if (i < text.length) {
        element.innerHTML += text[i] === "\n" ? "<br>" : text[i];
        i++;
        setTimeout(type, speed);
      } else if (i === text.length) {
        cursorSpan.remove();
      }
    }
    type();
  }

  setTimeout(() => {
    typeWriterEffect(msg, textSpan, 15); // Fast, smooth typing
  }, 200); // Almost immediate appearance

  return label;
}
export { createDialog };
