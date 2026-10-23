/**
 * Shared massing layout.
 *
 * The interactive model is generated from the normalized unit data instead of
 * shipping a heavy mesh for every apartment. A unit slot is a grid cell inside
 * the tower footprint; the same function feeds the 3D scene and the camera
 * mapping, so the two can never drift apart.
 */

export interface UnitSlot {
  x: number;
  z: number;
  width: number;
  depth: number;
  index: number;
}

export function computeUnitSlots(
  count: number,
  towerWidth: number,
  towerDepth: number,
): UnitSlot[] {
  if (count <= 0) return [];

  const columns = count === 1 ? 1 : count <= 4 ? 2 : count <= 6 ? 3 : 4;
  const rows = Math.ceil(count / columns);
  const cellWidth = towerWidth / columns;
  const cellDepth = towerDepth / rows;
  const gap = 0.34;

  return Array.from({ length: count }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      index,
      x: -towerWidth / 2 + cellWidth * (column + 0.5),
      z: -towerDepth / 2 + cellDepth * (row + 0.5),
      width: Math.max(cellWidth - gap, 1),
      depth: Math.max(cellDepth - gap, 1),
    };
  });
}

export function unitHeight(floorLevel: number, floorHeight: number) {
  return (floorLevel - 1) * floorHeight + floorHeight / 2;
}
