import { NODE_W, NODE_H, COLS, LAYERS_Y } from '../geometry';

/**
 * Deterministic grid placement for nodes within a single layer band.
 *
 * The original layout assumed exactly 3 nodes per layer (COLS = [150, 440,
 * 730], one fixed row). Real uploaded diagrams routinely have far more nodes
 * in one bucket (e.g. a dispatcher fanning out to a dozen workers), and the
 * old fallback (`COLS[index % 3]`) wrapped every 3rd node back onto the same
 * x — with a single fixed y per layer, that stacks multiple full node cards
 * on the exact same point, which is what produced the illegible overlapping
 * text.
 *
 * elkjs's `layered` algorithm was tried first, but it treats a layer
 * assignment as a soft ranking hint, not a hard band boundary: edges between
 * same-layer nodes make it spread them across a much taller region (in
 * testing, a 15-node fan-out spread across 1200+px of y), which bleeds into
 * neighboring layer bands and breaks the fixed-height swimlane model this
 * app relies on for progressive reveal. A plain deterministic grid sidesteps
 * that entirely: no edge-based ranking, so no risk of a layer's nodes
 * spilling into the next one — number of rows is capped from the fixed
 * 290px band spacing, so grids grow wider (never taller) as node count
 * increases.
 *
 * With exactly 3 nodes this reduces to the original COLS values exactly, so
 * the reference payments-platform demo renders pixel-identical.
 */

const H_GAP = 70; // matches COLS[1] - COLS[0] - NODE_W (440 - 150 - 220)
const V_GAP = 40;
const MAX_ROWS = 2; // keeps a layer's grid within the fixed band spacing (LAYERS_Y is 290px apart)
const IDEAL_MAX_COLS = 6; // prefer a single row up to this many nodes before wrapping

export function gridColumnsForCount(count: number): number {
  if (count <= 0) return 1;
  const naiveCols = Math.min(count, IDEAL_MAX_COLS);
  const naiveRows = Math.ceil(count / naiveCols);
  if (naiveRows <= MAX_ROWS) return naiveCols;
  return Math.ceil(count / MAX_ROWS);
}

/** Position for the i-th node (0-indexed, in `node_ids` order) among `count` nodes in `layerIndex`. */
export function gridNodePosition(
  index: number,
  count: number,
  layerIndex: number
): { x: number; y: number } {
  const cols = gridColumnsForCount(count);
  const col = index % cols;
  const row = Math.floor(index / cols);
  const baseY = LAYERS_Y[layerIndex] ?? 110 + layerIndex * 290;
  return {
    x: COLS[0] + col * (NODE_W + H_GAP),
    y: baseY + row * (NODE_H + V_GAP),
  };
}
