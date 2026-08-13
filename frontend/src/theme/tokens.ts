/**
 * Authoritative design tokens transcribed from UI ref files.
 */

export const COLORS = {
  bg: '#0f0f11',
  topbarBg: '#111113',
  topbarBorder: '#1d1d21',
  docBg: '#111113',
  docBorder: '#1d1d21',
  panelBg: '#161619',
  panelBorder: '#26262c',
  buttonBorder: '#2e2e36',
  buttonHoverBorder: '#43434e',
  accent: '#3b6fe5',
  accentHover: '#4a7cf0',
  textPrimary: '#f2f2f4',
  textSecondary: '#a9a9b3',
  textMuted: '#6a6a74',
  textDim: '#5f5f68',

  // Component types (TYPE map)
  types: {
    db: '#4c8df6',
    svc: '#a273f2',
    queue: '#e05fb0',
    infra: '#46b980',
    ext: '#8d949e',
  } as Record<string, string>,
};

export function tint(colorHex: string): string {
  return colorHex + '14';
}
