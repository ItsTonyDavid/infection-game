/** Presentation settings. Not gameplay rules. */
export const DISPLAY_CONFIG = {
  width: 960,
  height: 540,
  /** Integer zoom keeps pixel art crisp. */
  zoom: 2,
  backgroundColor: '#1b1f24',
  cameraLerp: 0.15,
  aimLineLength: 18,
  /** Visual barrel offset from the player position; hits are still traced from the position. */
  muzzleOffset: 10,
  reticleRadius: 4,
  tracerLifetimeMs: 70,
  impactLifetimeMs: 120,
  hitFlashMs: 70,
  walkFrameRate: 8,
  /** Entities use their y coordinate as depth (y-sorting); overlays sit above any map y. */
  depth: {
    background: -1,
    aim: 10_000,
    effects: 10_001,
    floatingText: 10_002,
  },
} as const;
