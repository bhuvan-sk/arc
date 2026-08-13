import { NODE_W, NODE_H, ARROW_GAP } from './geometry';
import { Point } from './route';

export function computeAnchors(
  A: { x: number; y: number },
  B: { x: number; y: number }
): { from: Point; to: Point } {
  const sameRow = Math.abs(A.y - B.y) < 1;
  const from = sameRow
    ? { x: A.x + NODE_W, y: A.y + NODE_H / 2 }
    : { x: A.x + NODE_W / 2, y: A.y + (B.y > A.y ? NODE_H : 0) };
  const to = sameRow
    ? { x: B.x - ARROW_GAP, y: B.y + NODE_H / 2 }
    : { x: B.x + NODE_W / 2, y: B.y + (B.y > A.y ? -ARROW_GAP : NODE_H + ARROW_GAP) };

  return { from, to };
}
