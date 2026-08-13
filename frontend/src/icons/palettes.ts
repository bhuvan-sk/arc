export const PALETTES: Record<string, Record<string, string>> = {
  'Vivid (current)': { data: '#4c8df6', api: '#a273f2', queue: '#e05fb0', ext: '#8d949e', infra: '#46b980' },
  'Muted ink': { data: '#6a8fc4', api: '#9080c6', queue: '#c07f9e', ext: '#8a8f96', infra: '#6aa88b' },
  'Warm spectrum': { data: '#3fa8b0', api: '#6f7ce8', queue: '#e0964a', ext: '#98938c', infra: '#7fb256' },
  'Neon': { data: '#38bdf8', api: '#c084fc', queue: '#fb7185', ext: '#94a3b8', infra: '#4ade80' }
};

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt));
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}
