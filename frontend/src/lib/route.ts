export interface Point {
  x: number;
  y: number;
}

export function route(a: Point, b: Point): string {
  if (Math.abs(a.y - b.y) < 1) return `M${a.x} ${a.y} H${b.x}`;
  const mid = (a.y + b.y) / 2;
  const r = 12;
  const s = Math.sign(b.x - a.x) || 1;
  const v = Math.sign(b.y - a.y);
  if (Math.abs(b.x - a.x) < 2) return `M${a.x} ${a.y} V${b.y}`;
  return `M${a.x} ${a.y} V${mid - r * v} Q${a.x} ${mid} ${a.x + s * r} ${mid} H${b.x - s * r} Q${b.x} ${mid} ${b.x} ${mid + r * v} V${b.y}`;
}
