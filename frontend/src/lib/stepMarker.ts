import { Point } from './route';

export function computeStepMarker(from: Point, to: Point, sameRow: boolean): { x: number; y: number; bx: number; by: number } {
  const sx = sameRow ? (from.x + to.x) / 2 : from.x + (to.x - from.x) / 2;
  const sy = sameRow ? from.y : (from.y + to.y) / 2;
  return { x: sx, y: sy, bx: sx - 10, by: sy - 10 };
}
