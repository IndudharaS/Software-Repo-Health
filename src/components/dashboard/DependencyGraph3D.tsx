"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Html, OrbitControls } from "@react-three/drei";
import type { Group } from "three";
import { CATEGORICAL, SEQUENTIAL_BLUE } from "@/lib/chart-colors";
import { cn } from "@/lib/utils";
import type { DependencyEntry } from "@/lib/types";

interface LeafNode {
  packageName: string;
  requirements: string;
  position: [number, number, number];
}

function buildStar(deps: DependencyEntry[]): LeafNode[] {
  const n = deps.length;
  const radius = 4.4;
  return deps.map((d, i) => {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
    const position: [number, number, number] = [
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
    ];
    return { packageName: d.packageName, requirements: d.requirements, position };
  });
}

function HubNode({ label }: { label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <group>
      <mesh scale={0.85}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={CATEGORICAL.orange} transparent opacity={0.15} />
      </mesh>
      <mesh
        scale={hovered ? 0.42 : 0.38}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial
          color={CATEGORICAL.orange}
          emissive={CATEGORICAL.orange}
          emissiveIntensity={1.3}
          toneMapped={false}
        />
      </mesh>
      <Html distanceFactor={9} center style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
          {label}
        </div>
      </Html>
    </group>
  );
}

function LeafDot({ node }: { node: LeafNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <group position={node.position}>
      <mesh
        scale={hovered ? 0.24 : 0.16}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, 20, 20]} />
        <meshStandardMaterial
          color={SEQUENTIAL_BLUE[300]}
          emissive={SEQUENTIAL_BLUE[300]}
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>
      <Html distanceFactor={9} center style={{ pointerEvents: "none" }}>
        <div
          className={cn(
            "whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] transition-all",
            hovered ? "scale-110 bg-black/85 text-white" : "bg-black/30 text-white/60"
          )}
        >
          {node.packageName}
          {hovered && ` ${node.requirements}`}
        </div>
      </Html>
    </group>
  );
}

function RotatingScene({ label, leaves }: { label: string; leaves: LeafNode[] }) {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.09;
  });

  return (
    <group ref={groupRef}>
      {leaves.map((leaf) => (
        <Line
          key={leaf.packageName}
          points={[[0, 0, 0], leaf.position]}
          color={SEQUENTIAL_BLUE[400]}
          transparent
          opacity={0.25}
          lineWidth={1}
        />
      ))}
      <HubNode label={label} />
      {leaves.map((leaf) => (
        <LeafDot key={leaf.packageName} node={leaf} />
      ))}
    </group>
  );
}

export function DependencyGraph3D({
  repoLabel,
  dependencies,
}: {
  repoLabel: string;
  dependencies: DependencyEntry[];
}) {
  const leaves = useMemo(() => buildStar(dependencies), [dependencies]);

  if (leaves.length === 0) return null;

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-border bg-black/20">
      <Canvas
        camera={{ position: [0, 0, 11.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[8, 8, 8]} intensity={0.5} />
        <RotatingScene label={repoLabel} leaves={leaves} />
        <OrbitControls enablePan={false} minDistance={6} maxDistance={18} />
      </Canvas>
      <div className="pointer-events-none absolute bottom-3 left-4 text-[11px] text-muted">
        Drag to rotate · scroll to zoom
      </div>
    </div>
  );
}
