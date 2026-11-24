// Shared camera-rig state driven by GSAP and read per frame in the world scene.
export const rig = {
  swoop: 0, // 1 = high cinematic offset, 0 = normal follow camera
  focusMix: 0, // 0 = follow camera, 1 = focused on a building
  focusPos: [0, 0, 0] as [number, number, number],
  focusLook: [0, 0, 0] as [number, number, number],
  dist: 11,
  pitch: 0.45,
}
