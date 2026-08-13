export function layerOpacity(
  layerIndex: number,
  activeIndex: number,
  unlockedIndex: number,
  lockedLayersMode: 'dim' | 'hide' = 'dim'
): number {
  const hideLocked = lockedLayersMode === 'hide';
  if (layerIndex === activeIndex) return 1;
  if (layerIndex <= unlockedIndex) return 0.24;
  return hideLocked ? 0 : 0.06;
}
