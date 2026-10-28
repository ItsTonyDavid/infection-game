/**
 * The only module that knows runtime asset paths. Gameplay and view code use keys.
 * Runtime files are produced from references/ by `npm run assets:build`.
 */

export const TEXTURE_KEYS = {
  survivor: 'survivor-cynthia',
  zombie: 'zombie-cynthia',
  map: 'map-1',
} as const;

export interface ImageAsset {
  readonly key: string;
  readonly url: string;
}

export interface SpritesheetAsset extends ImageAsset {
  readonly frameWidth: number;
  readonly frameHeight: number;
}

export const IMAGE_ASSETS: readonly ImageAsset[] = [
  { key: TEXTURE_KEYS.map, url: 'assets/environment/map-1.png' },
];

export const SPRITESHEET_ASSETS: readonly SpritesheetAsset[] = [
  {
    key: TEXTURE_KEYS.survivor,
    url: 'assets/characters/survivor-cynthia.png',
    frameWidth: 32,
    frameHeight: 32,
  },
  {
    key: TEXTURE_KEYS.zombie,
    url: 'assets/characters/zombie-cynthia.png',
    frameWidth: 32,
    frameHeight: 32,
  },
];

export type Facing = 'up' | 'down' | 'left' | 'right';

export const FACINGS: readonly Facing[] = ['up', 'down', 'left', 'right'];

export interface DirectionalFrames {
  readonly stand: number;
  readonly steps: readonly [number, number];
}

/**
 * Frame indices (row * 3 + column) in the 3x4 Cynthia sheets (survivor and zombie share the
 * layout). The source layout is not one row per direction; this mapping was measured from
 * references/cynthia_sprite.png.
 */
export const CHARACTER_FRAMES: Readonly<Record<Facing, DirectionalFrames>> = {
  up: { stand: 0, steps: [2, 10] },
  down: { stand: 5, steps: [8, 11] },
  left: { stand: 6, steps: [3, 9] },
  right: { stand: 1, steps: [4, 7] },
};

/** Vertical origin so the sprite's torso sits on the simulation position. */
export const CHARACTER_ORIGIN_Y = 0.62;

export function walkAnimationKey(facing: Facing): string {
  return `${TEXTURE_KEYS.survivor}-walk-${facing}`;
}
