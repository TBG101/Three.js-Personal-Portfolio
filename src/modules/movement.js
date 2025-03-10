import gsap from "gsap";

export function moveAstronaut(astronaut, camera, targetPosition) {
  if (astronaut.position.y === targetPosition) return;
  gsap.killTweensOf(astronaut.position);
  gsap.killTweensOf(camera.position);

  gsap.to(astronaut.position, {
    y: targetPosition,
    duration: 0.5,
    ease: "power2",
    onUpdate: () => {
      camera.position.set(
        astronaut.position.x,
        astronaut.position.y + 2,
        astronaut.position.z + 15
      );
    },
  });
}
