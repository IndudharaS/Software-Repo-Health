"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Html, OrbitControls } from "@react-three/drei";
import type { Group } from "three";
import { SEQUENTIAL_BLUE } from "@/lib/chart-colors";
import { cn } from "@/lib/utils";
import type { Contributor } from "@/lib/types";

interface GraphNode {
  login: string;
  contributions: number;
  position: [number, number, number];
}

interface GraphEdge {
  from: number;
  to: number;
  weight: number;
}

// Real data only: nodes are the top contributors, edges connect two
// contributors who both committed during the same week (from GitHub's
// per-contributor weekly stats) — no fabricated relationships.
function buildGraph(contributors: Contributor[]): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const n = contributors.length;
  const radius = 4.6;

  const nodes: GraphNode[] = contributors.map((c, i) => {
    // Fibonacci sphere distribution for even, deterministic 3D spacing.
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
    const position: [number, number, number] = [
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
    ];
    return { login: c.login, contributions: c.contributions, position };
  });

  const edges: GraphEdge[] = [];
  for (let i = 0; i < n; i++) {
    const weeksI = new Set(contributors[i].weeks.map((w) => w.weekStart));
    for (let j = i + 1; j < n; j++) {
      const shared = contributors[j].weeks.filter((w) =>
        weeksI.has(w.weekStart)
      ).length;
      if (shared > 0) edges.push({ from: i, to: j, weight: shared });
    }
  }

  return { nodes, edges };
}

function Node({
  node,
  scale,
  color,
}: {
  node: GraphNode;
  scale: number;
  color: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={node.position}>
      <mesh scale={scale * 2.2}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>
      <mesh
        scale={hovered ? scale * 1.25 : scale}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>
      <Html distanceFactor={9} center style={{ pointerEvents: "none" }}>
        <div
          className={cn(
            "whitespace-nowrap rounded-md px-2 py-1 text-xs shadow-lg transition-all",
            hovered
              ? "scale-110 bg-black/85 text-white"
              : "bg-black/40 text-white/70"
          )}
        >
          {node.login}
          {hovered && ` · ${node.contributions.toLocaleString()} commits`}
        </div>
      </Html>
    </group>
  );
}

function RotatingScene({
  nodes,
  edges,
  maxContrib,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  maxContrib: number;
}) {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.1;
  });

  return (
    <group ref={groupRef}>
      {edges.map((e, i) => (
        <Line
          key={i}
          points={[nodes[e.from].position, nodes[e.to].position]}
          color={SEQUENTIAL_BLUE[400]}
          transparent
          opacity={Math.min(0.12 + e.weight * 0.025, 0.55)}
          lineWidth={1}
        />
      ))}
      {nodes.map((node) => {
        const share = node.contributions / maxContrib;
        const scale = 0.16 + 0.34 * share;
        // Brighter/lighter blue for higher-contribution nodes (sequential
        // magnitude encoding, not identity — see dataviz color rules).
        const color = share > 0.6 ? SEQUENTIAL_BLUE[100] : share > 0.3 ? SEQUENTIAL_BLUE[300] : SEQUENTIAL_BLUE[500];
        return <Node key={node.login} node={node} scale={scale} color={color} />;
      })}
    </group>
  );
}

export function NetworkGraph3D({
  contributors,
}: {
  contributors: Contributor[];
}) {
  const { nodes, edges, maxContrib } = useMemo(() => {
    const built = buildGraph(contributors);
    const maxContrib = Math.max(...contributors.map((c) => c.contributions), 1);
    return { ...built, maxContrib };
  }, [contributors]);

  if (nodes.length === 0) return null;

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-border bg-black/20">
      <Canvas
        camera={{ position: [0, 0, 12.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[8, 8, 8]} intensity={0.5} />
        <RotatingScene nodes={nodes} edges={edges} maxContrib={maxContrib} />
        <OrbitControls
          enablePan={false}
          minDistance={7}
          maxDistance={20}
          autoRotate={false}
        />
      </Canvas>
      <div className="pointer-events-none absolute bottom-3 left-4 text-[11px] text-muted">
        Drag to rotate · scroll to zoom
      </div>
    </div>
  );
}
