import type * as Phaser from 'phaser';
import type { PlayerState } from '../../sim/world';
import {
  type Facing,
  CHARACTER_FRAMES,
  CHARACTER_ORIGIN_Y,
  TEXTURE_KEYS,
  walkAnimationKey,
} from '../assets/manifest';
import { facingFromAngle } from './facing';

/** Renders the player from simulation state. Owns no gameplay state. */
export class PlayerView {
  readonly sprite: Phaser.GameObjects.Sprite;
  private facing: Facing = 'down';
  private walking = false;

  constructor(scene: Phaser.Scene, player: PlayerState) {
    this.sprite = scene.add
      .sprite(
        player.position.x,
        player.position.y,
        TEXTURE_KEYS.survivor,
        CHARACTER_FRAMES.down.stand,
      )
      .setOrigin(0.5, CHARACTER_ORIGIN_Y);
  }

  sync(player: PlayerState): void {
    const { x, y } = player.position;
    this.sprite.setPosition(x, y).setDepth(y);

    const facing = facingFromAngle(player.aimAngle);
    const walking = player.velocity.x !== 0 || player.velocity.y !== 0;
    if (facing === this.facing && walking === this.walking) return;

    this.facing = facing;
    this.walking = walking;
    if (walking) {
      this.sprite.play(walkAnimationKey(facing), true);
    } else {
      this.sprite.stop().setFrame(CHARACTER_FRAMES[facing].stand);
    }
  }
}
