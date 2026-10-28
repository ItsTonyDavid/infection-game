/**
 * PROTOTYPE-ONLY LOCAL AUTHORITY (Milestone 1).
 * The browser runs this simulation and decides hits and damage. When multiplayer is
 * implemented, the server must run it and clients must only send `PlayerIntent`.
 */
import { damageAtDistance, resolvePellet } from './combat';
import { applyDamage, createHealth, type Health, isDead } from './health';
import type { PlayerIntent } from './intent';
import { intentToVelocity, stepPosition } from './movement';
import type { Rng } from './rng';
import { add, fromAngle, type Rect, scale, type Vec2 } from './vector';
import {
  createWeaponState,
  pelletAngles,
  startReload,
  tickWeapon,
  tryFire,
  validateWeaponConfig,
  type WeaponConfig,
  type WeaponId,
  type WeaponState,
} from './weapons';

export interface WorldConfig {
  readonly arena: Rect;
  readonly player: {
    readonly spawn: Vec2;
    readonly speed: number;
    readonly maxHealth: number;
    readonly radius: number;
  };
  readonly weapons: Readonly<Record<WeaponId, WeaponConfig>>;
  readonly dummy: {
    readonly maxHealth: number;
    readonly radius: number;
    readonly respawnMs: number;
  };
  readonly dummySpawns: readonly { readonly id: string; readonly position: Vec2 }[];
  /** Upper bound for a single step so a long frame cannot tunnel or skip timers wildly. */
  readonly maxStepMs: number;
}

export interface PlayerState {
  readonly position: Vec2;
  readonly velocity: Vec2;
  readonly aimAngle: number;
  readonly health: Health;
  readonly weapons: Readonly<Record<WeaponId, WeaponState>>;
  readonly activeWeapon: WeaponId;
}

export interface DummyState {
  readonly id: string;
  readonly position: Vec2;
  readonly radius: number;
  readonly health: Health;
  /** Time until respawn; 0 while alive. */
  readonly respawnInMs: number;
}

export interface WorldState {
  readonly player: PlayerState;
  readonly dummies: readonly DummyState[];
}

export interface PelletTrace {
  readonly end: Vec2;
  readonly hit: boolean;
}

export type WorldEvent =
  | {
      readonly type: 'shot';
      readonly weapon: WeaponId;
      readonly origin: Vec2;
      readonly pellets: readonly PelletTrace[];
    }
  | {
      readonly type: 'damage';
      readonly targetId: string;
      readonly amount: number;
      readonly point: Vec2;
    }
  | { readonly type: 'targetDown'; readonly targetId: string }
  | { readonly type: 'targetRespawned'; readonly targetId: string };

export interface StepResult {
  readonly state: WorldState;
  readonly events: readonly WorldEvent[];
}

export const WEAPON_IDS: readonly WeaponId[] = ['pistol', 'shotgun'];

export function createWorld(config: WorldConfig): WorldState {
  for (const id of WEAPON_IDS) validateWeaponConfig(config.weapons[id]);
  return {
    player: {
      position: config.player.spawn,
      velocity: { x: 0, y: 0 },
      aimAngle: 0,
      health: createHealth(config.player.maxHealth),
      weapons: {
        pistol: createWeaponState(config.weapons.pistol),
        shotgun: createWeaponState(config.weapons.shotgun),
      },
      activeWeapon: 'pistol',
    },
    dummies: config.dummySpawns.map((spawn) => ({
      id: spawn.id,
      position: spawn.position,
      radius: config.dummy.radius,
      health: createHealth(config.dummy.maxHealth),
      respawnInMs: 0,
    })),
  };
}

export function stepWorld(
  world: WorldState,
  intent: PlayerIntent,
  rawDtMs: number,
  config: WorldConfig,
  rng: Rng,
): StepResult {
  const dtMs = Number.isFinite(rawDtMs) ? Math.min(Math.max(rawDtMs, 0), config.maxStepMs) : 0;
  const events: WorldEvent[] = [];

  let dummies = world.dummies.map((dummy) => tickDummy(dummy, dtMs, config, events));
  let player = movePlayer(world.player, intent, dtMs, config);

  if (intent.reload) {
    player = {
      ...player,
      weapons: {
        pistol: startReload(player.weapons.pistol, config.weapons.pistol),
        shotgun: startReload(player.weapons.shotgun, config.weapons.shotgun),
      },
    };
  }

  if (intent.switchWeapon) {
    player = { ...player, activeWeapon: nextWeapon(player.activeWeapon) };
  }

  if (intent.fire) {
    const weaponId = player.activeWeapon;
    const weapon = config.weapons[weaponId];
    const result = tryFire(player.weapons[weaponId], weapon);
    player = { ...player, weapons: { ...player.weapons, [weaponId]: result.state } };
    if (result.ok) {
      dummies = fireShot(player, weapon, dummies, config, rng, events);
    }
  }

  return { state: { player, dummies }, events };
}

/** Cycles through `WEAPON_IDS`. Reloads and cooldowns of the other weapon keep running. */
export function nextWeapon(current: WeaponId): WeaponId {
  const index = WEAPON_IDS.indexOf(current);
  return WEAPON_IDS[(index + 1) % WEAPON_IDS.length] ?? current;
}

function movePlayer(
  player: PlayerState,
  intent: PlayerIntent,
  dtMs: number,
  config: WorldConfig,
): PlayerState {
  const velocity = intentToVelocity(intent.move, config.player.speed);
  return {
    ...player,
    velocity,
    position: stepPosition(player.position, velocity, dtMs, config.arena, config.player.radius),
    aimAngle: Number.isFinite(intent.aimAngle) ? intent.aimAngle : player.aimAngle,
    weapons: {
      pistol: tickWeapon(player.weapons.pistol, config.weapons.pistol, dtMs),
      shotgun: tickWeapon(player.weapons.shotgun, config.weapons.shotgun, dtMs),
    },
  };
}

function tickDummy(
  dummy: DummyState,
  dtMs: number,
  config: WorldConfig,
  events: WorldEvent[],
): DummyState {
  if (dummy.respawnInMs <= 0) return dummy;
  const respawnInMs = dummy.respawnInMs - dtMs;
  if (respawnInMs > 0) return { ...dummy, respawnInMs };
  events.push({ type: 'targetRespawned', targetId: dummy.id });
  return { ...dummy, respawnInMs: 0, health: createHealth(config.dummy.maxHealth) };
}

function fireShot(
  player: PlayerState,
  weapon: WeaponConfig,
  dummies: readonly DummyState[],
  config: WorldConfig,
  rng: Rng,
  events: WorldEvent[],
): DummyState[] {
  const origin = player.position;
  const targets = dummies.filter((dummy) => !isDead(dummy.health));
  const damageByTarget = new Map<string, { amount: number; point: Vec2 }>();
  const pellets: PelletTrace[] = [];

  for (const angle of pelletAngles(player.aimAngle, weapon, rng)) {
    const direction = fromAngle(angle);
    const hit = resolvePellet(origin, direction, weapon.maxRange, targets);
    if (hit === null) {
      pellets.push({ end: add(origin, scale(direction, weapon.maxRange)), hit: false });
      continue;
    }
    pellets.push({ end: hit.point, hit: true });
    const amount = damageAtDistance(weapon, hit.distance);
    const previous = damageByTarget.get(hit.targetId);
    damageByTarget.set(hit.targetId, {
      amount: (previous?.amount ?? 0) + amount,
      point: previous?.point ?? hit.point,
    });
  }

  events.push({ type: 'shot', weapon: weapon.id, origin, pellets });

  return dummies.map((dummy) => {
    const damage = damageByTarget.get(dummy.id);
    if (damage === undefined || damage.amount <= 0) return dummy;
    const health = applyDamage(dummy.health, damage.amount);
    events.push({ type: 'damage', targetId: dummy.id, amount: damage.amount, point: damage.point });
    if (!isDead(health)) return { ...dummy, health };
    events.push({ type: 'targetDown', targetId: dummy.id });
    return { ...dummy, health, respawnInMs: config.dummy.respawnMs };
  });
}
