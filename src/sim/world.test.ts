import { describe, expect, it } from 'vitest';
import { IDLE_INTENT, type PlayerIntent } from './intent';
import { createSeededRng } from './rng';
import {
  createWorld,
  stepWorld,
  type WorldConfig,
  type WorldEvent,
  type WorldState,
} from './world';

const NO_JITTER = () => 0.5;

const CONFIG: WorldConfig = {
  arena: { x: 0, y: 0, width: 1000, height: 1000 },
  player: { spawn: { x: 100, y: 100 }, speed: 100, maxHealth: 100, radius: 6 },
  weapons: {
    pistol: {
      id: 'pistol',
      displayName: 'Pistol',
      damagePerPellet: 25,
      pellets: 1,
      spreadRadians: 0,
      spreadJitter: 0,
      maxRange: 300,
      falloffStart: 300,
      minDamageMultiplier: 1,
      cooldownMs: 100,
      magazineSize: 2,
      reloadMs: 500,
    },
    shotgun: {
      id: 'shotgun',
      displayName: 'Shotgun',
      damagePerPellet: 10,
      pellets: 5,
      spreadRadians: 0.2,
      spreadJitter: 0,
      maxRange: 80,
      falloffStart: 80,
      minDamageMultiplier: 1,
      cooldownMs: 500,
      magazineSize: 4,
      reloadMs: 1000,
    },
  },
  dummy: { maxHealth: 50, radius: 8, respawnMs: 1000 },
  dummySpawns: [{ id: 'd1', position: { x: 150, y: 100 } }],
  maxStepMs: 100,
};

const intent = (overrides: Partial<PlayerIntent>): PlayerIntent => ({
  ...IDLE_INTENT,
  ...overrides,
});

function step(world: WorldState, input: PlayerIntent, dtMs = 16) {
  return stepWorld(world, input, dtMs, CONFIG, NO_JITTER);
}

function eventsOf<T extends WorldEvent['type']>(events: readonly WorldEvent[], type: T) {
  return events.filter((e): e is Extract<WorldEvent, { type: T }> => e.type === type);
}

describe('stepWorld movement', () => {
  it('moves the player diagonally at normalized speed', () => {
    const world = createWorld(CONFIG);
    const { state } = step(world, intent({ move: { x: 1, y: 1 } }), 100);
    const moved = Math.hypot(state.player.position.x - 100, state.player.position.y - 100);
    expect(moved).toBeCloseTo(10, 10);
  });

  it('keeps the player inside the arena', () => {
    let world = createWorld(CONFIG);
    for (let i = 0; i < 50; i++) {
      world = step(world, intent({ move: { x: -1, y: -1 } }), 100).state;
    }
    expect(world.player.position).toEqual({ x: 6, y: 6 });
  });

  it('clamps long frames to maxStepMs', () => {
    const world = createWorld(CONFIG);
    const { state } = step(world, intent({ move: { x: 1, y: 0 } }), 5000);
    expect(state.player.position.x).toBeCloseTo(110, 10);
  });

  it('keeps the previous aim when the aim angle is invalid', () => {
    const world = step(createWorld(CONFIG), intent({ aimAngle: 1 })).state;
    expect(step(world, intent({ aimAngle: Number.NaN })).state.player.aimAngle).toBe(1);
  });
});

describe('stepWorld combat', () => {
  it('damages a dummy hit by the pistol', () => {
    const { state, events } = step(createWorld(CONFIG), intent({ fire: true }));
    expect(state.dummies[0]?.health.current).toBe(25);
    expect(eventsOf(events, 'damage')).toEqual([
      expect.objectContaining({ targetId: 'd1', amount: 25 }),
    ]);
    expect(state.player.weapons.pistol.ammo).toBe(1);
  });

  it('does not damage a dummy when aiming away', () => {
    const { state, events } = step(createWorld(CONFIG), intent({ fire: true, aimAngle: Math.PI }));
    expect(state.dummies[0]?.health.current).toBe(50);
    expect(eventsOf(events, 'shot')).toHaveLength(1);
    expect(eventsOf(events, 'damage')).toHaveLength(0);
  });

  it('aggregates shotgun pellets into one damage event per target', () => {
    const { events } = step(createWorld(CONFIG), intent({ switchWeapon: true, fire: true }));
    const damage = eventsOf(events, 'damage');
    expect(damage).toHaveLength(1);
    expect(damage[0]?.amount).toBeGreaterThan(10);
    expect(eventsOf(events, 'shot')[0]?.pellets).toHaveLength(5);
  });

  it('respects the weapon cooldown between steps', () => {
    let world = createWorld(CONFIG);
    world = step(world, intent({ fire: true }), 16).state;
    const { events } = step(world, intent({ fire: true }), 16);
    expect(eventsOf(events, 'shot')).toHaveLength(0);
  });

  it('kills a dummy once, ignores it while down, then respawns it', () => {
    let world = createWorld(CONFIG);
    world = step(world, intent({ fire: true }), 0).state;
    const kill = step(world, intent({ fire: true }), 100);
    expect(eventsOf(kill.events, 'targetDown')).toHaveLength(1);
    world = kill.state;
    expect(world.dummies[0]?.health.current).toBe(0);

    // The magazine (2 rounds) emptied and auto-reloads in 500 ms; the dummy respawns in 1000 ms.
    for (let i = 0; i < 5; i++) world = step(world, IDLE_INTENT, 100).state;
    expect(world.player.weapons.pistol.ammo).toBe(2);

    const deadShot = step(world, intent({ fire: true }), 0);
    expect(eventsOf(deadShot.events, 'shot')).toHaveLength(1);
    expect(eventsOf(deadShot.events, 'damage')).toHaveLength(0);
    expect(eventsOf(deadShot.events, 'targetDown')).toHaveLength(0);
    world = deadShot.state;

    let respawned = false;
    for (let i = 0; i < 10 && !respawned; i++) {
      const result = step(world, IDLE_INTENT, 100);
      world = result.state;
      respawned = eventsOf(result.events, 'targetRespawned').length > 0;
    }
    expect(respawned).toBe(true);
    expect(world.dummies[0]?.health.current).toBe(50);
  });

  it('is deterministic for the same seed and inputs', () => {
    const run = () => {
      const rng = createSeededRng(42);
      let world = stepWorld(
        createWorld(CONFIG),
        intent({ switchWeapon: true }),
        0,
        CONFIG,
        rng,
      ).state;
      const log: WorldEvent[] = [];
      for (let i = 0; i < 20; i++) {
        const result = stepWorld(world, intent({ fire: true }), 50, CONFIG, rng);
        world = result.state;
        log.push(...result.events);
      }
      return log;
    };
    expect(run()).toEqual(run());
  });
});

describe('stepWorld weapon switching', () => {
  it('starts with the pistol and cycles pistol -> shotgun -> pistol', () => {
    let world = createWorld(CONFIG);
    expect(world.player.activeWeapon).toBe('pistol');
    world = step(world, intent({ switchWeapon: true })).state;
    expect(world.player.activeWeapon).toBe('shotgun');
    world = step(world, intent({ switchWeapon: true })).state;
    expect(world.player.activeWeapon).toBe('pistol');
  });

  it('fires only the active weapon', () => {
    let world = step(createWorld(CONFIG), intent({ fire: true })).state;
    expect(world.player.weapons.pistol.ammo).toBe(1);
    expect(world.player.weapons.shotgun.ammo).toBe(4);

    world = step(world, intent({ switchWeapon: true, fire: true })).state;
    expect(world.player.weapons.pistol.ammo).toBe(1);
    expect(world.player.weapons.shotgun.ammo).toBe(3);
  });

  it('does not reset cooldown or reload when switching away and back', () => {
    let world = step(createWorld(CONFIG), intent({ fire: true }), 0).state;
    world = step(world, intent({ switchWeapon: true }), 0).state;
    world = step(world, intent({ switchWeapon: true }), 0).state;
    expect(eventsOf(step(world, intent({ fire: true }), 0).events, 'shot')).toHaveLength(0);

    // Empty the pistol to trigger its auto-reload, then let it finish on the shotgun.
    world = step(world, intent({ fire: true }), 100).state;
    expect(world.player.weapons.pistol.reloadMs).toBeGreaterThan(0);
    world = step(world, intent({ switchWeapon: true }), 0).state;
    for (let i = 0; i < 5; i++) world = step(world, IDLE_INTENT, 100).state;
    expect(world.player.weapons.pistol.ammo).toBe(2);
  });
});

describe('createWorld', () => {
  it('rejects invalid weapon configuration', () => {
    const bad: WorldConfig = {
      ...CONFIG,
      weapons: { ...CONFIG.weapons, pistol: { ...CONFIG.weapons.pistol, pellets: 0 } },
    };
    expect(() => createWorld(bad)).toThrow(/Invalid weapon config/);
  });
});
