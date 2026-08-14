/**
 * "Strata" design tokens — imported from the Claude Design mockup
 * (project d3cdc69a / "1b Strata.dc.html") and adapted for the real app.
 *
 * Depth replaces borders: surfaces are planes at a height, separated by
 * shadow + inner highlight + blur rather than an outline. Layers live at
 * literal depths — active in focus, unlocked slightly back, locked behind
 * atmosphere (see lib/layerOpacity.ts and the Canvas depth/blur transforms).
 */

export const COLORS = {
  bg: '#05060d',
  field: '#0b0e1d',
  fieldTop: '#151a35',
  fieldGradient: 'radial-gradient(120% 80% at 50% -10%, #151a35 0%, #0b0e1d 45%, #07080f 100%)',

  glass: 'rgba(255,255,255,.055)',
  glassSoft: 'rgba(255,255,255,.02)',
  glassFaint: 'rgba(255,255,255,.05)',
  glassBorder: 'rgba(255,255,255,.09)',
  hairline: 'rgba(255,255,255,.07)',

  slabTop: '#1b2140',
  slabBottom: '#131730',

  textPrimary: '#f6f7ff',
  textBright: '#eceffc',
  textSecondary: '#c2c8e8',
  textMuted: '#a7aed4',
  textDim: '#8f97bd',
  textFaint: '#6a719a',
  textGhost: '#5d6488',

  // Layer identity — the whole visual system keys off these three, not
  // per-component-type hues.
  layers: { data: '#92a6ff', api: '#4fd6b0', infra: '#f0b98a' } as Record<string, string>,
  layerSoft: { data: 'rgba(146,166,255,.12)', api: 'rgba(79,214,176,.12)', infra: 'rgba(240,185,138,.12)' } as Record<string, string>,
  fail: '#ff8f9e',
  cost: '#f0b98a',

  // Neutral treatment for external/third-party nodes — deliberately
  // desaturated regardless of which layer they sit in.
  extNeutral: '#9aa1c6',
  extNeutralDim: '#8f97bd',

  // Legacy per-component-type palette. No longer used to paint nodes/edges
  // (that's layer-keyed now) — kept only because icons/families.ts still
  // groups icon glyphs under these ids for shape lookup.
  types: {
    db: '#4c8df6',
    svc: '#a273f2',
    queue: '#e05fb0',
    infra: '#46b980',
    ext: '#8d949e',
  } as Record<string, string>,

  accent: '#92a6ff',
  accentHover: '#a9b8ff',
};

export const FONT_SANS = "'Sora', system-ui, -apple-system, sans-serif";
export const FONT_MONO = "'Martian Mono', ui-monospace, monospace";

export const LAYER_IDS = ['data', 'api', 'infra'] as const;

export function layerColorByIndex(i: number): string {
  return COLORS.layers[LAYER_IDS[i]] || COLORS.fail;
}

export function layerColorById(id: string): string {
  return COLORS.layers[id] || COLORS.fail;
}

export function layerSoftByIndex(i: number): string {
  return COLORS.layerSoft[LAYER_IDS[i]] || 'rgba(255,255,255,.05)';
}

export function tint(colorHex: string, alphaHex: string = '12'): string {
  return colorHex + alphaHex;
}
