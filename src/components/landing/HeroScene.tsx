import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Points, PointMaterial } from "@react-three/drei";
import type { Group, Points as ThreePoints } from "three";

const NODE_COUNT = 46;
const LINK_DISTANCE = 1.35;
const RADIUS = 3.4;

interface Node {
  position: [number, number, number];
  scale: number;
}

// Deterministic pseudo-random so the layout is stable between renders without
// needing Math.random in module scope.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildGraph() {
  const rand = mulberry32(1337);
  const nodes: Node[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    // Fibonacci-ish sphere sampling for even spread, jittered inward.
    const u = rand();
    const v = rand();
    const theta = Math.acos(2 * u - 1);
    const phi = 2 * Math.PI * v;
    const r = RADIUS * (0.55 + 0.45 * rand());
    nodes.push({
      position: [
        r * Math.sin(theta) * Math.cos(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(theta),
      ],
      scale: 0.5 + rand() * 1,
    });
  }

  const edges: [[number, number, number], [number, number, number]][] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i].position;
      const b = nodes[j].position;
      const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      if (d < LINK_DISTANCE) edges.push([a, b]);
    }
  }
  return { nodes, edges };
}

function Starfield() {
  const ref = useRef<ThreePoints>(null);
  const positions = useMemo(() => {
    const rand = mulberry32(90210);
    const arr = new Float32Array(600 * 3);
    for (let i = 0; i < arr.length; i++) arr[i] = (rand() - 0.5) * 22;
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.02;
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial transparent color="#8a8f98" size={0.03} sizeAttenuation depthWrite={false} opacity={0.5} />
    </Points>
  );
}

function Graph() {
  const group = useRef<Group>(null);
  const { nodes, edges } = useMemo(buildGraph, []);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.12;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.15;
  });

  return (
    <group ref={group}>
      {edges.map((edge, i) => (
        <Line key={i} points={edge} color="#e8c468" lineWidth={1} transparent opacity={0.22} />
      ))}
      {nodes.map((node, i) => (
        <mesh key={i} position={node.position} scale={node.scale * 0.09}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial
            color="#e8c468"
            emissive="#e8c468"
            emissiveIntensity={1.4}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function HeroScene() {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 55 }} dpr={[1, 1.75]}>
      <ambientLight intensity={0.4} />
      <pointLight position={[6, 6, 6]} intensity={30} color="#e8c468" />
      <Starfield />
      <Graph />
    </Canvas>
  );
}
