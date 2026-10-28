import * as Phaser from 'phaser';
import { DISPLAY_CONFIG } from '../../config/display';
import { GAMEPLAY_CONFIG } from '../../config/gameplay';
import type { Rng } from '../../sim/rng';
import { add, fromAngle, scale } from '../../sim/vector';
import {
  createWorld,
  stepWorld,
  WEAPON_IDS,
  type WorldEvent,
  type WorldState,
} from '../../sim/world';
import { isReloading } from '../../sim/weapons';
import { TEXTURE_KEYS } from '../assets/manifest';
import type { Hud, HudSnapshot } from '../hud/hud';
import { createInputReader, type InputReader } from '../input/bindings';
import { AimIndicator } from '../view/AimIndicator';
import { CombatEffects } from '../view/CombatEffects';
import { DummyView } from '../view/DummyView';
import { PlayerView } from '../view/PlayerView';

export const GAME_SCENE_KEY = 'game';

/**
 * Thin adapter: reads input, steps the pure simulation, renders the result.
 * Prototype-only: the simulation runs locally; it moves to the server in Milestone 2.
 */
export class GameScene extends Phaser.Scene {
  private readonly hud: Hud;
  private readonly rng: Rng = Math.random;
  private world!: WorldState;
  private controls!: InputReader;
  private playerView!: PlayerView;
  private dummyViews = new Map<string, DummyView>();
  private effects!: CombatEffects;
  private aim!: AimIndicator;

  constructor(hud: Hud) {
    super(GAME_SCENE_KEY);
    this.hud = hud;
  }

  create(): void {
    this.world = createWorld(GAMEPLAY_CONFIG);

    const map = this.add
      .image(0, 0, TEXTURE_KEYS.map)
      .setOrigin(0)
      .setDepth(DISPLAY_CONFIG.depth.background);

    this.playerView = new PlayerView(this, this.world.player);
    this.dummyViews = new Map(
      this.world.dummies.map((dummy) => [dummy.id, new DummyView(this, dummy)]),
    );
    this.effects = new CombatEffects(this);
    this.aim = new AimIndicator(this);
    this.controls = createInputReader(this);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, map.width, map.height);
    camera.setZoom(DISPLAY_CONFIG.zoom);
    camera.startFollow(
      this.playerView.sprite,
      true,
      DISPLAY_CONFIG.cameraLerp,
      DISPLAY_CONFIG.cameraLerp,
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.destroy();
    });

    console.info('[game] prototype started', {
      arena: GAMEPLAY_CONFIG.arena,
      dummies: this.world.dummies.length,
    });
  }

  override update(_time: number, deltaMs: number): void {
    if (this.controls.restartPressed()) {
      console.info('[game] restart');
      this.scene.restart();
      return;
    }

    const intent = this.controls.readIntent(this.world.player.position);
    const { state, events } = stepWorld(this.world, intent, deltaMs, GAMEPLAY_CONFIG, this.rng);
    this.world = state;

    for (const event of events) this.present(event);
    this.render(deltaMs);
  }

  private present(event: WorldEvent): void {
    switch (event.type) {
      case 'shot': {
        const muzzle = add(
          event.origin,
          scale(fromAngle(this.world.player.aimAngle), DISPLAY_CONFIG.muzzleOffset),
        );
        this.effects.shot(event.weapon, muzzle, event.pellets);
        break;
      }
      case 'damage':
        this.dummyViews.get(event.targetId)?.flash();
        this.effects.damageNumber(event.point, event.amount);
        break;
      case 'targetDown':
        break;
      case 'targetRespawned':
        this.dummyViews.get(event.targetId)?.respawn();
        break;
      default: {
        const unhandled: never = event;
        throw new Error(`Unhandled world event: ${JSON.stringify(unhandled)}`);
      }
    }
  }

  private render(deltaMs: number): void {
    const { player, dummies } = this.world;
    this.playerView.sync(player);
    for (const dummy of dummies) this.dummyViews.get(dummy.id)?.sync(dummy, deltaMs);
    this.effects.update(deltaMs);
    this.aim.draw(
      player.position,
      player.aimAngle,
      this.controls.pointerWorld(),
      GAMEPLAY_CONFIG.weapons[player.activeWeapon].maxRange,
    );
    this.hud.update(this.hudSnapshot());
  }

  private hudSnapshot(): HudSnapshot {
    const { player } = this.world;
    return {
      health: player.health,
      activeWeapon: player.activeWeapon,
      weapons: WEAPON_IDS.map((id) => ({
        id,
        name: GAMEPLAY_CONFIG.weapons[id].displayName,
        ammo: player.weapons[id].ammo,
        magazineSize: GAMEPLAY_CONFIG.weapons[id].magazineSize,
        reloading: isReloading(player.weapons[id]),
      })),
    };
  }
}
