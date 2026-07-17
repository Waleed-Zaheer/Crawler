import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import type { Group } from "three";
import type { PageResult } from "@/types";

const STATUS_COLOR: Record<PageResult["status"], string> = {
  success: "#e8c468",
  error: "#e5484d",
  skipped: "#8a8f98",
  disallowed: "#f2a65a",
};

interface GraphNode {
  url: string;
  parentUrl: string | null;
  depth: number;
  status: PageResult["status"];
  title: string | null;
  position: [number, number, number];
}

function layoutNodes(results: PageResult[]): GraphNode[] {
  const byDepth = new Map<number, PageResult[]>();
  for (const r of results) {
    const bucket = byDepth.get(r.depth) ?? [];
    bucket.push(r);
    byDepth.set(r.depth, bucket);
  }

  const nodes: GraphNode[] = [];
  for (const [depth, pages] of byDepth) {
    const radius = depth === 0 ? 0 : depth * 2.4;
    const count = pages.length;
    pages.forEach((page, i) => {
      const angle = (i / Math.max(count, 1)) * Math.PI * 2;
      nodes.push({
        url: page.url,
        parentUrl: page.parentUrl,
        depth: page.depth,
        status: page.status,
        title: page.title,
        position: [Math.cos(angle) * radius, -depth * 1.1, Math.sin(angle) * radius],
      });
    });
  }
  return nodes;
}

function Node({ node }: { node: GraphNode }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = node.position[1] + Math.sin(state.clock.elapsedTime + node.position[0]) * 0.05;
  });

  return (
    <group ref={ref} position={node.position}>
      <mesh>
        <sphereGeometry args={[node.depth === 0 ? 0.22 : 0.14, 16, 16]} />
        <meshStandardMaterial
          color={STATUS_COLOR[node.status]}
          emissive={STATUS_COLOR[node.status]}
          emissiveIntensity={0.4}
        />
      </mesh>
    </group>
  );
}

function Edges({ nodes }: { nodes: GraphNode[] }) {
  const byUrl = useMemo(() => new Map(nodes.map((n) => [n.url, n])), [nodes]);
  return (
    <>
      {nodes.map((node) => {
        if (!node.parentUrl) return null;
        const parent = byUrl.get(node.parentUrl);
        if (!parent) return null;
        return (
          <Line
            key={node.url}
            points={[parent.position, node.position]}
            color="#8a8f98"
            opacity={0.35}
            transparent
            lineWidth={1}
          />
        );
      })}
    </>
  );
}

function Scene({ results }: { results: PageResult[] }) {
  const nodes = useMemo(() => layoutNodes(results), [results]);
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={40} color="#e8c468" />
      <pointLight position={[-5, -3, -5]} intensity={20} color="#ffffff" />
      <Edges nodes={nodes} />
      {nodes.map((node) => (
        <Node key={node.url} node={node} />
      ))}
      <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.6} />
    </>
  );
}

export function CrawlGraph({ results }: { results: PageResult[] }) {
  if (results.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Crawled pages will appear here as a 3D graph.
      </div>
    );
  }

  return (
    <Canvas camera={{ position: [0, 3, 9], fov: 50 }}>
      <Scene results={results} />
    </Canvas>
  );
}
