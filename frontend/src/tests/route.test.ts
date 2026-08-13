import { describe, it, expect } from 'vitest';
import { computeAnchors } from '../lib/anchors';
import { route } from '../lib/route';

describe('SVG Route Golden Strings', () => {
  it('pg -> cdc (same row horizontal line)', () => {
    const pg = { x: 150, y: 110 };
    const cdc = { x: 440, y: 110 };
    const { from, to } = computeAnchors(pg, cdc);
    const d = route(from, to);
    expect(d).toBe('M370 141 H431');
  });

  it('ledger -> pg (upward cross-layer orthogonal path)', () => {
    const ledger = { x: 440, y: 400 };
    const pg = { x: 150, y: 110 };
    const { from, to } = computeAnchors(ledger, pg);
    const d = route(from, to);
    expect(d).toBe('M550 400 V302.5 Q550 290.5 538 290.5 H272 Q260 290.5 260 278.5 V181');
  });

  it('eks -> gw (vertical straight line)', () => {
    const eks = { x: 440, y: 690 };
    const gw = { x: 440, y: 400 };
    const { from, to } = computeAnchors(eks, gw);
    const d = route(from, to);
    expect(d).toBe('M550 690 V471');
  });
});
