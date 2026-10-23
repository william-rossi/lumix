"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Edges, Grid, Html, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import {
  Layers,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import type { Development, Unit, UnitStatus } from "@/models";
import { computeUnitSlots } from "@/lib/massing";
import { formatBRL, unitStatusLabels } from "@/lib/format";
import { cn } from "@/lib/utils";

const EXPLODE_GAP = 1.15;

const DEFAULT_OVERVIEW = {
  position: { x: 28, y: 22, z: 34 },
  target: { x: 0, y: 12, z: 0 },
};

interface OverviewCamera {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  fov?: number;
}

interface SceneUnit {
  unit: Unit;
  x: number;
  z: number;
  width: number;
  depth: number;
}

interface SceneFloor {
  floor: number;
  units: SceneUnit[];
}

export interface BuildingViewerProps {
  development: Development;
  selectedUnitId?: string | null;
  onSelectUnit?: (unitId: string) => void;
  onClearSelection?: () => void;
  activeFloor?: number | null;
  onFloorChange?: (floor: number | null) => void;
  explode?: number;
  autoRotate?: boolean;
  resetSignal?: number;
  className?: string;
  minimal?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Scene                                                                      */
/* -------------------------------------------------------------------------- */

function buildScene(development: Development) {
  const massing = development.model3d.massing;
  const byFloor = new Map<number, Unit[]>();
  for (const unit of development.units) {
    const list = byFloor.get(unit.floor) ?? [];
    list.push(unit);
    byFloor.set(unit.floor, list);
  }

  const floors: SceneFloor[] = Array.from(byFloor.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([floor, units]) => {
      const sorted = [...units].sort((a, b) => a.sortOrder - b.sortOrder);
      const slots = computeUnitSlots(
        sorted.length,
        massing.towerWidth,
        massing.towerDepth,
      );
      return {
        floor,
        units: sorted.map((unit, index) => ({
          unit,
          x: slots[index]?.x ?? 0,
          z: slots[index]?.z ?? 0,
          width: slots[index]?.width ?? massing.towerWidth,
          depth: slots[index]?.depth ?? massing.towerDepth,
        })),
      };
    });

  return { floors, massing };
}

function UnitMesh({
  sceneUnit,
  floorBase,
  floorHeight,
  selected,
  hovered,
  dimmed,
  onSelect,
  onHover,
  geometry,
}: {
  sceneUnit: SceneUnit;
  floorBase: number;
  floorHeight: number;
  selected: boolean;
  hovered: boolean;
  dimmed: boolean;
  onSelect: (unitId: string) => void;
  onHover: (unitId: string | null) => void;
  geometry: THREE.BoxGeometry;
}) {
  const { unit, x, z, width, depth } = sceneUnit;
  const bodyHeight = floorHeight * 0.82;
  const y = floorBase + floorHeight * 0.46;

  const color = selected
    ? "#c8492c"
    : hovered
      ? statusHoverColor(unit.status)
      : statusColor(unit.status);

  const faceOnZ = Math.abs(z) >= Math.abs(x);
  const windowScale: [number, number, number] = faceOnZ
    ? [width * 0.66, floorHeight * 0.32, 0.05]
    : [0.05, floorHeight * 0.32, depth * 0.66];
  const windowPosition: [number, number, number] = faceOnZ
    ? [x, y, z + Math.sign(z || 1) * (depth / 2 + 0.04)]
    : [x + Math.sign(x || 1) * (width / 2 + 0.04), y, z];

  const balconyPosition: [number, number, number] = faceOnZ
    ? [x, floorBase + 0.06, z + Math.sign(z || 1) * (depth / 2 + 0.5)]
    : [x + Math.sign(x || 1) * (width / 2 + 0.5), floorBase + 0.06, z];
  const balconyScale: [number, number, number] = faceOnZ
    ? [width * 0.72, 0.09, 1]
    : [1, 0.09, depth * 0.72];

  return (
    <group>
      <mesh
        geometry={geometry}
        position={[x, y, z]}
        scale={[width, bodyHeight, depth]}
        castShadow
        receiveShadow
        onClick={(event) => {
          event.stopPropagation();
          onSelect(unit.id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover(unit.id);
        }}
        onPointerOut={() => onHover(null)}
      >
        <meshStandardMaterial
          color={color}
          roughness={0.62}
          metalness={0.06}
          transparent={dimmed}
          opacity={dimmed ? 0.14 : 1}
          depthWrite={!dimmed}
          emissive={selected ? "#c8492c" : "#000000"}
          emissiveIntensity={selected ? 0.32 : 0}
        />
        {(selected || hovered) && (
          <Edges
            color={selected ? "#ffd9c9" : "#f0e6d6"}
            threshold={20}
            lineWidth={1}
          />
        )}
      </mesh>

      {!dimmed && (
        <>
          <mesh position={windowPosition} scale={windowScale}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={selected ? "#7e2f1d" : "#15120e"}
              roughness={0.28}
              metalness={0.55}
            />
          </mesh>

          {unit.rooms.hasBalcony && (
            <mesh
              geometry={geometry}
              position={balconyPosition}
              scale={balconyScale}
              castShadow
            >
              <meshStandardMaterial
                color={selected ? "#e8b9a6" : "#c9bfad"}
                roughness={0.85}
              />
            </mesh>
          )}
        </>
      )}
    </group>
  );
}

const MemoUnitMesh = memo(UnitMesh);

function statusColor(status: UnitStatus) {
  switch (status) {
    case "available":
      return "#d3c8b6";
    case "reserved":
      return "#b0843f";
    case "sold":
      return "#655c4f";
    default:
      return "#4b443a";
  }
}

function statusHoverColor(status: UnitStatus) {
  switch (status) {
    case "available":
      return "#efe3d0";
    case "reserved":
      return "#d2a45b";
    case "sold":
      return "#8b8172";
    default:
      return "#6b6255";
  }
}

function Ground({ massing }: { massing: Development["model3d"]["massing"] }) {
  return (
    <group>
      <mesh
        position={[0, -0.62, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#12100d" roughness={1} />
      </mesh>

      <Grid
        position={[0, -0.58, 0]}
        args={[2, 50]}
        cellSize={1.4}
        cellThickness={0.5}
        cellColor="#24201a"
        sectionSize={7}
        sectionThickness={0.7}
        sectionColor="#37312a"
        fadeDistance={62}
        fadeStrength={1.6}
        infiniteGrid
      />

      <mesh
        position={[0, -0.28, 0]}
        scale={[massing.towerWidth + 12, 0.66, massing.towerDepth + 14]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1d1a15" roughness={0.95} />
      </mesh>

      {TREES.map((tree, index) => (
        <group key={index} position={[tree[0], 0, tree[1]]}>
          <mesh position={[0, 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.15, 1.6, 6]} />
            <meshStandardMaterial color="#3b3227" roughness={1} />
          </mesh>
          <mesh position={[0, 1.75 + tree[2], 0]} castShadow>
            <icosahedronGeometry args={[0.85 + tree[2] * 0.8, 0]} />
            <meshStandardMaterial color="#2f4437" roughness={1} flatShading />
          </mesh>
        </group>
      ))}

      <mesh position={[-26, -1.1, -18]} scale={[10, 22, 12]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#16130f" roughness={1} />
      </mesh>
      <mesh position={[27, -2.6, -12]} scale={[9, 30, 11]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#14110e" roughness={1} />
      </mesh>
    </group>
  );
}

const TREES: Array<[number, number, number]> = [
  [-13.5, 8.5, 0.2],
  [13.8, 9.2, 0.1],
  [-11.4, -9.6, 0.3],
  [14.6, -8.4, 0],
  [8.5, -13.5, 0.25],
  [-9.2, 13.8, 0.15],
  [17, 2.5, 0.35],
  [-17.5, 3, 0.05],
];

function Building({
  development,
  selectedUnitId,
  activeFloor,
  explode,
  onSelect,
  onHover,
  hoveredId,
}: {
  development: Development;
  selectedUnitId: string | null;
  activeFloor: number | null;
  explode: number;
  onSelect: (unitId: string) => void;
  onHover: (unitId: string | null) => void;
  hoveredId: string | null;
}) {
  const { floors, massing } = useMemo(() => buildScene(development), [development]);
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const totalHeight = massing.floors * massing.floorHeight;
  const topY = totalHeight + (massing.floors - 1) * explode * EXPLODE_GAP;

  return (
    <group>
      <Ground massing={massing} />

      {floors.map((floor) => {
        const base =
          (floor.floor - 1) * massing.floorHeight +
          (floor.floor - 1) * explode * EXPLODE_GAP;
        const dimmed = activeFloor !== null && activeFloor !== floor.floor;

        return (
          <group key={floor.floor}>
            <mesh
              geometry={geometry}
              position={[0, base + 0.02, 0]}
              scale={[
                massing.towerWidth + 1.3,
                0.16,
                massing.towerDepth + 1.3,
              ]}
              receiveShadow
            >
              <meshStandardMaterial
                color={dimmed ? "#15120e" : "#8e8474"}
                roughness={0.9}
                transparent={dimmed}
                opacity={dimmed ? 0.35 : 1}
              />
            </mesh>

            <mesh
              geometry={geometry}
              position={[0, base - 0.08, 0]}
              scale={[massing.towerWidth + 1.5, 0.1, massing.towerDepth + 1.5]}
            >
              <meshStandardMaterial
                color={dimmed ? "#12100d" : "#5f574a"}
                roughness={0.95}
                transparent={dimmed}
                opacity={dimmed ? 0.4 : 1}
              />
            </mesh>

            {floor.units.map((sceneUnit) => (
              <MemoUnitMesh
                key={sceneUnit.unit.id}
                sceneUnit={sceneUnit}
                floorBase={base}
                floorHeight={massing.floorHeight}
                selected={selectedUnitId === sceneUnit.unit.id}
                hovered={hoveredId === sceneUnit.unit.id}
                dimmed={dimmed}
                onSelect={onSelect}
                onHover={onHover}
                geometry={geometry}
              />
            ))}

            {explode > 0.2 && (
              <Html
                position={[-massing.towerWidth / 2 - 1.8, base + massing.floorHeight / 2, 0]}
                center
                zIndexRange={[10, 0]}
                style={{ pointerEvents: "none" }}
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/40">
                  {String(floor.floor).padStart(2, "0")}
                </span>
              </Html>
            )}
          </group>
        );
      })}

      {floors.length > 0 && (
        <mesh
          geometry={geometry}
          position={[0, topY + 0.12, 0]}
          scale={[massing.towerWidth + 1.8, 0.24, massing.towerDepth + 1.8]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#a89d8a" roughness={0.85} />
        </mesh>
      )}

      <group position={[0, topY + 0.24, 0]}>
        <mesh position={[0, 0.5, 0]} scale={[4.4, 1, 3.6]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#2b2721" roughness={0.9} />
        </mesh>
        <mesh
          position={[0, 1.2, 0]}
          scale={[7, 0.14, 6]}
          castShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#3a342b" roughness={0.9} />
        </mesh>
        {development.amenities.some((amenity) => amenity.id === "pool") && (
          <mesh position={[0, 1.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4.4, 3.4]} />
            <meshStandardMaterial
              color="#235563"
              roughness={0.15}
              metalness={0.4}
            />
          </mesh>
        )}
      </group>

      <group position={[0, (topY + 0.24) / 2, 0]}>
        <mesh scale={[3.2, topY, 2.8]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#3a332a" roughness={0.9} />
        </mesh>
      </group>

      {hoveredId && (
        <HoverLabel
          development={development}
          unitId={hoveredId}
          massing={massing}
          explode={explode}
        />
      )}
    </group>
  );
}

function HoverLabel({
  development,
  unitId,
  massing,
  explode,
}: {
  development: Development;
  unitId: string;
  massing: Development["model3d"]["massing"];
  explode: number;
}) {
  const mapping = development.model3d.unitsMapping.find(
    (item) => item.unitId === unitId,
  );
  const unit = development.units.find((item) => item.id === unitId);
  if (!mapping || !unit) return null;
  const y =
    (unit.floor - 1) * massing.floorHeight +
    (unit.floor - 1) * explode * EXPLODE_GAP +
    massing.floorHeight +
    0.8;

  return (
    <Html
      position={[mapping.position.x, y, mapping.position.z]}
      center
      distanceFactor={16}
      zIndexRange={[30, 10]}
      style={{ pointerEvents: "none" }}
    >
      <div className="w-52 border border-paper/15 bg-stage/95 px-3 py-2.5 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/50">
            Unidade {unit.code}
          </span>
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              unit.status === "available"
                ? "bg-[#6f9e83]"
                : unit.status === "reserved"
                  ? "bg-[#c79a4b]"
                  : "bg-[#8a8172]",
            )}
          />
        </div>
        <p className="mt-1 font-display text-lg leading-tight text-paper">
          {unit.name ?? unit.code}
        </p>
        <div className="mt-2 flex items-end justify-between gap-2 border-t border-paper/10 pt-1.5">
          <span className="text-[13px] text-paper/85">
            {formatBRL(unit.pricing.basePrice)}
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-paper/40">
            {unitStatusLabels[unit.status]}
          </span>
        </div>
      </div>
    </Html>
  );
}

/* -------------------------------------------------------------------------- */
/* Camera                                                                     */
/* -------------------------------------------------------------------------- */

function CameraRig({
  overview,
  focusPosition,
  focusTarget,
  fitOverview,
  frameCenter,
  frameWidth,
  frameHeight,
  resetSignal,
  autoRotate,
}: {
  overview: OverviewCamera;
  focusPosition: THREE.Vector3Tuple;
  focusTarget: THREE.Vector3Tuple;
  fitOverview: boolean;
  frameCenter: THREE.Vector3Tuple;
  frameWidth: number;
  frameHeight: number;
  resetSignal: number;
  autoRotate: boolean;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();
  const goalPosition = useRef(new THREE.Vector3(...focusPosition));
  const goalTarget = useRef(new THREE.Vector3(...focusTarget));
  const animating = useRef(true);

  const aspect = size.width / Math.max(size.height, 1);
  const focusFit = aspect < 0.9 ? 1.65 : aspect < 1.3 ? 1.25 : 1;
  const fov = overview.fov ?? 34;

  useEffect(() => {
    const presetTarget = new THREE.Vector3(
      overview.target.x,
      overview.target.y,
      overview.target.z,
    );
    const presetPosition = new THREE.Vector3(
      overview.position.x,
      overview.position.y,
      overview.position.z,
    );

    if (fitOverview) {
      // Frame the whole model from its bounds instead of trusting a preset
      // that may have been authored for a different viewport/aspect ratio.
      const vFov = THREE.MathUtils.degToRad(fov);
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
      const heightDistance = frameHeight / (2 * Math.tan(vFov / 2));
      const widthDistance = frameWidth / (2 * Math.tan(hFov / 2));
      const distance = Math.max(heightDistance, widthDistance, 24) * 1.12;
      const target = new THREE.Vector3(
        frameCenter[0],
        frameCenter[1],
        frameCenter[2],
      );
      const direction = presetPosition.clone().sub(presetTarget);
      if (direction.lengthSq() < 0.0001) direction.set(0.8, 0.7, 1);
      direction.normalize();

      goalTarget.current.copy(target);
      goalPosition.current.copy(
        target.clone().add(direction.multiplyScalar(distance)),
      );
    } else {
      const target = new THREE.Vector3(...focusTarget);
      const rawPosition = new THREE.Vector3(...focusPosition);
      const position = target
        .clone()
        .add(rawPosition.clone().sub(target).multiplyScalar(focusFit));
      goalTarget.current.copy(target);
      goalPosition.current.copy(position);
    }

    animating.current = true;
  }, [
    overview,
    focusPosition,
    focusTarget,
    fitOverview,
    frameCenter,
    frameWidth,
    frameHeight,
    focusFit,
    resetSignal,
    aspect,
    fov,
  ]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls || !animating.current) return;
    const smoothing = 1 - Math.pow(0.0008, Math.min(delta, 0.1));
    camera.position.lerp(goalPosition.current, smoothing);
    controls.target.lerp(goalTarget.current, smoothing);
    controls.update();
    if (
      camera.position.distanceTo(goalPosition.current) < 0.04 &&
      controls.target.distanceTo(goalTarget.current) < 0.02
    ) {
      animating.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.075}
      enablePan
      panSpeed={0.65}
      rotateSpeed={0.8}
      zoomSpeed={0.8}
      minDistance={9}
      maxDistance={220}
      maxPolarAngle={Math.PI / 2 - 0.02}
      autoRotate={autoRotate}
      autoRotateSpeed={0.45}
      onStart={() => {
        animating.current = false;
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* HUD                                                                        */
/* -------------------------------------------------------------------------- */

function ViewerChrome({
  development,
  activeFloor,
  onFloorChange,
  explode,
  onExplodeChange,
  autoRotate,
  onAutoRotateChange,
  onReset,
  fullscreen,
  onToggleFullscreen,
  selectedUnit,
}: {
  development: Development;
  activeFloor: number | null;
  onFloorChange: (floor: number | null) => void;
  explode: number;
  onExplodeChange: (value: number) => void;
  autoRotate: boolean;
  onAutoRotateChange: (value: boolean) => void;
  onReset: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  selectedUnit: Unit | null;
}) {
  const counts = useMemo(() => {
    const result = { available: 0, reserved: 0, sold: 0, blocked: 0 };
    for (const unit of development.units) result[unit.status] += 1;
    return result;
  }, [development.units]);

  const floors = useMemo(() => {
    const set = new Set(development.units.map((unit) => unit.floor));
    return Array.from(set).sort((a, b) => b - a);
  }, [development.units]);

  return (
    <>
      <div className="pointer-events-none absolute left-4 top-4 z-20 hidden flex-col gap-3 sm:flex lg:left-6 lg:top-6">
        <div className="pointer-events-auto border border-paper/12 bg-stage/70 px-3.5 py-3 backdrop-blur-md">
          <p className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-paper/40">
            Maquete interativa
          </p>
          <div className="mt-2.5 flex flex-col gap-1.5">
            <LegendRow color="bg-[#d3c8b6]" label="Disponível" value={counts.available} />
            <LegendRow color="bg-[#b0843f]" label="Reservada" value={counts.reserved} />
            <LegendRow color="bg-[#655c4f]" label="Vendida" value={counts.sold} />
          </div>
        </div>

        <div className="pointer-events-auto border border-paper/12 bg-stage/70 px-3.5 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-paper/45" strokeWidth={1.5} />
            <p className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-paper/40">
              Andar
            </p>
          </div>
          <div className="no-scrollbar mt-2 flex max-h-40 flex-col gap-0.5 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => onFloorChange(null)}
              className={cn(
                "text-left font-mono text-[10px] uppercase tracking-[0.14em] transition-colors",
                activeFloor === null ? "text-accent" : "text-paper/45 hover:text-paper",
              )}
            >
              Todos
            </button>
            {floors.map((floor) => {
              const floorUnits = development.units.filter(
                (unit) => unit.floor === floor,
              );
              const free = floorUnits.filter(
                (unit) => unit.status === "available",
              ).length;
              return (
                <button
                  key={floor}
                  type="button"
                  onClick={() =>
                    onFloorChange(activeFloor === floor ? null : floor)
                  }
                  className={cn(
                    "flex items-center justify-between gap-3 py-0.5 font-mono text-[10px] tabular-nums transition-colors",
                    activeFloor === floor
                      ? "text-accent"
                      : free > 0
                        ? "text-paper/55 hover:text-paper"
                        : "text-paper/25 hover:text-paper/50",
                  )}
                >
                  <span>{String(floor).padStart(2, "0")}</span>
                  <span className="text-[8px] text-paper/25">
                    {free > 0 ? `${free} livre${free > 1 ? "s" : ""}` : "—"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-4 z-20 flex flex-col gap-1.5 lg:right-6 lg:top-6">
        <ChromeButton
          label="Girar automaticamente"
          active={autoRotate}
          onClick={() => onAutoRotateChange(!autoRotate)}
        >
          {autoRotate ? (
            <Pause className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <Play className="h-4 w-4" strokeWidth={1.5} />
          )}
        </ChromeButton>
        <ChromeButton label="Restaurar câmera" onClick={onReset}>
          <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
        </ChromeButton>
        <ChromeButton
          label={fullscreen ? "Sair da tela cheia" : "Tela cheia"}
          onClick={onToggleFullscreen}
        >
          {fullscreen ? (
            <Minimize2 className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <Maximize2 className="h-4 w-4" strokeWidth={1.5} />
          )}
        </ChromeButton>
      </div>

      {selectedUnit && (
        <div className="pointer-events-none absolute bottom-20 left-4 z-20 border border-paper/12 bg-stage/80 px-3.5 py-2.5 backdrop-blur-md sm:left-6">
          <p className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-paper/40">
            Selecionada
          </p>
          <p className="mt-1 text-[13px] text-paper">
            {selectedUnit.code} · {selectedUnit.name}
          </p>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-paper/10 bg-stage/80 px-4 py-3 backdrop-blur-md lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-paper/40">
              Expandir
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(explode * 100)}
              onChange={(event) =>
                onExplodeChange(Number(event.target.value) / 100)
              }
              className="lumix-range w-28 sm:w-40"
              aria-label="Expandir andares"
            />
            <span className="font-mono text-[9px] tabular-nums text-paper/35">
              {Math.round(explode * 100)}%
            </span>
          </div>

          <p className="hidden font-mono text-[8.5px] uppercase tracking-[0.18em] text-paper/30 md:block">
            Arraste para girar · clique em uma unidade
          </p>

          <button
            type="button"
            onClick={() => onFloorChange(null)}
            className="self-start font-mono text-[9px] uppercase tracking-[0.18em] text-paper/45 transition-colors hover:text-paper sm:self-auto"
          >
            {activeFloor ? `Andar ${String(activeFloor).padStart(2, "0")}` : "Todos os andares"}
          </button>
        </div>
      </div>
    </>
  );
}

function LegendRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-2 w-2 rounded-[1px]", color)} />
      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-paper/50">
        {label}
      </span>
      <span className="ml-auto font-mono text-[10px] tabular-nums text-paper/75">
        {value}
      </span>
    </div>
  );
}

function ChromeButton({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center border transition-colors",
        active
          ? "border-accent bg-accent text-white"
          : "border-paper/15 bg-stage/60 text-paper/60 backdrop-blur-md hover:border-paper/50 hover:text-paper",
      )}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

export default function BuildingViewer({
  development,
  selectedUnitId = null,
  onSelectUnit,
  onClearSelection,
  activeFloor,
  onFloorChange,
  explode = 0,
  autoRotate = false,
  resetSignal = 0,
  className,
  minimal = false,
}: BuildingViewerProps) {
  const [internalExplode, setInternalExplode] = useState(0);
  const [internalAutoRotate, setInternalAutoRotate] = useState(minimal);
  const [internalFloor, setInternalFloor] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [supportsHover, setSupportsHover] = useState(false);

  const floorIsControlled = activeFloor !== undefined;
  const floor = floorIsControlled ? (activeFloor ?? null) : internalFloor;
  const explodeValue = minimal ? 0 : Math.max(explode, internalExplode);
  const isAutoRotating = autoRotate || internalAutoRotate;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      setSupportsHover(window.matchMedia("(hover: hover)").matches),
    );
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const overview = useMemo<OverviewCamera>(
    () => development.model3d.cameraPresets[0] ?? DEFAULT_OVERVIEW,
    [development.model3d.cameraPresets],
  );

  const massing = development.model3d.massing;
  const selectedUnit =
    development.units.find((unit) => unit.id === selectedUnitId) ?? null;
  const selectedMapping = development.model3d.unitsMapping.find(
    (mapping) => mapping.unitId === selectedUnitId,
  );

  const frame = useMemo(() => {
    const bounds = development.model3d.bounds;
    const width =
      Math.max(
        bounds.max.x - bounds.min.x,
        bounds.max.z - bounds.min.z,
        massing.towerWidth,
        massing.towerDepth,
      ) + 4;
    const baseHeight = Math.max(
      bounds.max.y - bounds.min.y,
      massing.floors * massing.floorHeight,
    );
    const height =
      baseHeight +
      Math.max(massing.floors - 1, 0) * explodeValue * EXPLODE_GAP +
      3.4;

    return {
      width,
      height,
      center: [
        (bounds.min.x + bounds.max.x) / 2,
        height / 2,
        (bounds.min.z + bounds.max.z) / 2,
      ] as THREE.Vector3Tuple,
    };
  }, [development.model3d.bounds, massing, explodeValue]);

  const focus = useMemo(() => {
    const baseTarget = new THREE.Vector3(
      overview.target.x,
      overview.target.y,
      overview.target.z,
    );
    const basePosition = new THREE.Vector3(
      overview.position.x,
      overview.position.y,
      overview.position.z,
    );

    if (selectedMapping && selectedUnit && !minimal) {
      const explodeOffset =
        (selectedUnit.floor - 1) * explodeValue * EXPLODE_GAP;
      const target = new THREE.Vector3(
        selectedMapping.position.x,
        selectedMapping.position.y + explodeOffset,
        selectedMapping.position.z,
      );
      const direction = basePosition.clone().sub(baseTarget).normalize();
      const distance = Math.max(massing.floors * massing.floorHeight * 0.62, 18);
      const position = target.clone().add(direction.multiplyScalar(distance));
      return {
        position: [position.x, position.y, position.z] as THREE.Vector3Tuple,
        target: [target.x, target.y, target.z] as THREE.Vector3Tuple,
      };
    }

    if (floor !== null && !minimal) {
      const y = (floor - 1) * massing.floorHeight + massing.floorHeight / 2;
      return {
        position: [
          basePosition.x,
          basePosition.y + (y - baseTarget.y),
          basePosition.z,
        ] as THREE.Vector3Tuple,
        target: [0, y, 0] as THREE.Vector3Tuple,
      };
    }

    return {
      position: [
        basePosition.x,
        basePosition.y,
        basePosition.z,
      ] as THREE.Vector3Tuple,
      target: [baseTarget.x, baseTarget.y, baseTarget.z] as THREE.Vector3Tuple,
    };
  }, [
    selectedMapping,
    selectedUnit,
    floor,
    minimal,
    overview,
    massing,
    explodeValue,
  ]);

  const handleSelect = useCallback(
    (unitId: string) => {
      onSelectUnit?.(unitId);
    },
    [onSelectUnit],
  );

  const handleFloorChange = useCallback(
    (next: number | null) => {
      if (!floorIsControlled) setInternalFloor(next);
      onFloorChange?.(next);
    },
    [floorIsControlled, onFloorChange],
  );

  const handleReset = useCallback(() => {
    if (onClearSelection) onClearSelection();
    else onSelectUnit?.("");
    handleFloorChange(null);
    setInternalExplode(0);
    setResetCount((count) => count + 1);
  }, [onClearSelection, onSelectUnit, handleFloorChange]);

  const toggleFullscreen = useCallback(async () => {
    if (!wrapperRef.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await wrapperRef.current.requestFullscreen();
      }
    } catch {
      /* fullscreen may be blocked by the browser */
    }
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "relative isolate overflow-hidden stage",
        fullscreen ? "fixed inset-0 z-[90] h-screen w-screen" : "h-full w-full",
        className,
      )}
    >
      <div className="absolute inset-0">
        <Canvas
          shadows
          dpr={[1, 1.8]}
          camera={{
            position: [overview.position.x, overview.position.y, overview.position.z],
            fov: overview.fov ?? 34,
            near: 0.1,
            far: 300,
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.05;
          }}
        >
          <ambientLight intensity={0.42} />
          <hemisphereLight args={["#ded6c6", "#14110d", 0.75]} />
          <directionalLight
            position={[18, 26, 14]}
            intensity={2.4}
            color="#fff2dc"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-34}
            shadow-camera-right={34}
            shadow-camera-top={36}
            shadow-camera-bottom={-34}
            shadow-camera-near={0.5}
            shadow-camera-far={90}
            shadow-bias={-0.0004}
          />
          <directionalLight
            position={[-16, 12, -14]}
            intensity={0.55}
            color="#b9c9d8"
          />

          <Building
            development={development}
            selectedUnitId={minimal ? null : selectedUnitId}
            activeFloor={minimal ? null : floor}
            explode={explodeValue}
            onSelect={handleSelect}
            onHover={supportsHover && !minimal ? setHoveredId : () => undefined}
            hoveredId={minimal ? null : hoveredId}
          />

          <ContactShadows
            position={[0, -0.56, 0]}
            opacity={0.55}
            scale={75}
            blur={2.4}
            far={45}
            resolution={1024}
            color="#000000"
          />

          <CameraRig
            overview={overview}
            focusPosition={focus.position}
            focusTarget={focus.target}
            fitOverview={selectedUnit === null && floor === null}
            frameCenter={frame.center}
            frameWidth={frame.width}
            frameHeight={frame.height}
            resetSignal={resetSignal + resetCount}
            autoRotate={isAutoRotating}
          />
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(120%_90%_at_50%_0%,transparent_40%,rgba(12,11,10,0.55)_100%)]" />

      {!minimal && (
        <ViewerChrome
          development={development}
          activeFloor={floor}
          onFloorChange={handleFloorChange}
          explode={explodeValue}
          onExplodeChange={setInternalExplode}
          autoRotate={isAutoRotating}
          onAutoRotateChange={setInternalAutoRotate}
          onReset={handleReset}
          fullscreen={fullscreen}
          onToggleFullscreen={toggleFullscreen}
          selectedUnit={selectedUnit}
        />
      )}

      {minimal && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-20 border border-paper/12 bg-stage/70 px-3 py-2 backdrop-blur-md">
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-paper/45">
            {development.units.length} unidades · {development.model3d.massing.floors} andares
          </p>
        </div>
      )}
    </div>
  );
}
