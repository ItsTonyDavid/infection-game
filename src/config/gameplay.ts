/**
 * PROVISIONAL tuning values for the Milestone 1 local prototype.
 * These exist to make the prototype playable. None of them is a balance decision;
 * tune them through playtesting (PROJECT.md, Milestone 6).
 *
 * Units: distances in world pixels, times in milliseconds, speeds in pixels per second.
 * At camera zoom 2 the visible area is 480 x 270 world pixels.
 */
import type { WorldConfig } from '../sim/world';

export const GAMEPLAY_CONFIG: WorldConfig = {
  // Hand-measured walkable rectangle inside the tree border of references/map_1.png.
  // Buildings and props are not solid yet.
  arena: { x: 140, y: 225, width: 740, height: 460 },

  player: {
    spawn: { x: 500, y: 500 },
    speed: 110,
    maxHealth: 100,
    radius: 6,
  },

  // Ranges set by the developer (2026-10-28) relative to the former shotgun range of 140:
  // pistol = 1.2 x 140, shotgun = 0.75 x 140. Each falloffStart keeps its previous fraction
  // of maxRange (pistol 0.625, shotgun ~0.29).
  weapons: {
    // Longer range, lower damage, steady fire.
    pistol: {
      id: 'pistol',
      displayName: 'Pistol',
      damagePerPellet: 18,
      pellets: 1,
      spreadRadians: 0.04,
      spreadJitter: 1,
      maxRange: 150,
      falloffStart: 105,
      minDamageMultiplier: 0.5,
      cooldownMs: 220,
      magazineSize: 12,
      reloadMs: 1100,
    },
    // Devastating up close, weak or useless at distance.
    shotgun: {
      id: 'shotgun',
      displayName: 'Shotgun',
      damagePerPellet: 10,
      pellets: 7,
      spreadRadians: 0.5,
      spreadJitter: 0.6,
      maxRange: 90,
      falloffStart: 30,
      minDamageMultiplier: 0.25,
      cooldownMs: 750,
      magazineSize: 5,
      reloadMs: 1600,
    },
  },

  dummy: {
    maxHealth: 120,
    radius: 8,
    respawnMs: 2500,
  },

  // Placed along the horizontal path east of the spawn at ~50, ~110 and ~280 px, staggered
  // vertically so the near dummy does not block shots at the others.
  dummySpawns: [
    { id: 'dummy-near', position: { x: 550, y: 482 } },
    { id: 'dummy-mid', position: { x: 610, y: 512 } },
    { id: 'dummy-far', position: { x: 780, y: 496 } },
  ],

  maxStepMs: 100,
};
