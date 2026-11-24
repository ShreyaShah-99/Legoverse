import { Stars } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/** Colour the distant fog blends into. Matches the dome horizon. */
export const FOG_COLOR = '#3b2468'

const domeVert = /* glsl */ `
varying vec3 vDir;
void main(){
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const domeFrag = /* glsl */ `
uniform float uTime;
varying vec3 vDir;

float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x){
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){ float a = 0.5, s = 0.0; for(int i = 0; i < 5; i++){ s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }

void main(){
  vec3 d = normalize(vDir);
  float h = d.y;

  vec3 zenith  = vec3(0.020, 0.030, 0.100);
  vec3 mid     = vec3(0.170, 0.095, 0.390);
  vec3 horizon = vec3(0.850, 0.350, 0.450);
  vec3 low     = vec3(0.090, 0.050, 0.240);
  vec3 nadir   = vec3(0.020, 0.020, 0.090);

  vec3 c = mix(horizon, mid, smoothstep(0.0, 0.35, h));
  c = mix(c, zenith, smoothstep(0.30, 0.95, h));
  c = mix(c, low, smoothstep(0.0, -0.25, h));
  c = mix(c, nadir, smoothstep(-0.2, -0.9, h));

  // sunset glow on one side of the sky
  vec3 sun = normalize(vec3(0.62, 0.16, 0.42));
  float s = max(dot(d, sun), 0.0);
  c += vec3(1.0, 0.55, 0.30) * pow(s, 14.0) * 0.55 + vec3(1.0, 0.8, 0.55) * pow(s, 180.0) * 1.4;

  // nebula clouds drifting slowly
  vec3 q = d * 3.2 + vec3(0.0, 0.0, uTime * 0.004);
  float n1 = fbm(q);
  float n2 = fbm(q * 1.7 + 7.3);
  float band = smoothstep(-0.25, 0.6, h) * (1.0 - smoothstep(0.7, 1.0, h) * 0.5);
  vec3 neb = mix(vec3(0.55, 0.20, 0.75), vec3(0.15, 0.55, 0.85), n2);
  c += neb * smoothstep(0.45, 0.85, n1) * 0.42 * band;
  c += vec3(0.95, 0.35, 0.55) * smoothstep(0.55, 0.9, n2) * 0.16 * band;

  gl_FragColor = vec4(c, 1.0);
}`

/** Gradient sky with a sunset glow and soft nebula. Follows the camera so it never gets closer. */
export function SkyDome() {
  const mesh = useRef<THREE.Mesh>(null)
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  useFrame((s) => {
    uniforms.uTime.value = s.clock.elapsedTime
    mesh.current?.position.copy(s.camera.position)
  })
  return (
    <mesh ref={mesh} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[450, 48, 32]} />
      <shaderMaterial uniforms={uniforms} vertexShader={domeVert} fragmentShader={domeFrag} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  )
}

function Planet({ pos, r, color, glow, ring }: { pos: [number, number, number]; r: number; color: string; glow: string; ring?: { inner: number; outer: number; color: string; tilt: number } }) {
  const g = useRef<THREE.Group>(null)
  useFrame((_, dt) => { if (g.current) g.current.rotation.y += dt * 0.01 })
  return (
    <group position={pos}>
      <group ref={g}>
        <mesh>
          <sphereGeometry args={[r, 48, 32]} />
          <meshStandardMaterial color={color} emissive={glow} emissiveIntensity={0.55} roughness={0.9} fog={false} />
        </mesh>
      </group>
      {/* atmosphere */}
      <mesh scale={1.06}>
        <sphereGeometry args={[r, 32, 24]} />
        <meshBasicMaterial color={glow} transparent opacity={0.14} side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>
      {ring && (
        <mesh rotation={[Math.PI / 2 + ring.tilt, 0.2, 0]}>
          <ringGeometry args={[r * ring.inner, r * ring.outer, 96]} />
          <meshBasicMaterial color={ring.color} transparent opacity={0.45} side={THREE.DoubleSide} fog={false} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

/** Distant planets and a field of stars so the islands feel like they float in space. */
export function Cosmos({ low }: { low: boolean }) {
  return (
    <>
      <SkyDome />
      <Stars radius={280} depth={70} count={low ? 1500 : 5000} factor={6} saturation={0.5} fade speed={0.6} />
      <Planet pos={[-250, 110, -210]} r={42} color="#8a6bd6" glow="#b79bff" ring={{ inner: 1.35, outer: 2.1, color: '#e9d7ff', tilt: 0.35 }} />
      <Planet pos={[230, 150, -250]} r={16} color="#f4a77a" glow="#ff8a5c" />
      <Planet pos={[40, 60, 300]} r={10} color="#7fd6e8" glow="#4dd0ff" />
    </>
  )
}
