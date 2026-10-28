import * as Phaser from 'phaser';
import type { PlayerIntent } from '../../sim/intent';
import type { Vec2 } from '../../sim/vector';

/**
 * The only module that knows physical keys and mouse buttons.
 * WASD = move, mouse = aim, LMB = fire active weapon (one shot per click), Q = switch weapon,
 * R = reload, Enter = restart. The right button is unused; its context menu stays disabled.
 */
export interface InputReader {
  /** Builds this frame's intent. `origin` is the player's world position for aiming. */
  readIntent(origin: Vec2): PlayerIntent;
  /** Pointer position in world coordinates, recomputed every frame as the camera moves. */
  pointerWorld(): Vec2;
  restartPressed(): boolean;
  destroy(): void;
}

const LEFT_BUTTON = 0;

export function createInputReader(scene: Phaser.Scene): InputReader {
  const keyboard = scene.input.keyboard;
  if (keyboard === null) {
    throw new Error('Keyboard input is not available');
  }
  scene.input.mouse?.disableContextMenu();

  const { KeyCodes } = Phaser.Input.Keyboard;
  const keys = {
    up: keyboard.addKey(KeyCodes.W),
    left: keyboard.addKey(KeyCodes.A),
    down: keyboard.addKey(KeyCodes.S),
    right: keyboard.addKey(KeyCodes.D),
    switchWeapon: keyboard.addKey(KeyCodes.Q),
    reload: keyboard.addKey(KeyCodes.R),
    restart: keyboard.addKey(KeyCodes.ENTER),
  };

  // Latched on pointer-down by `button` (not the `buttons` bitmask, which some synthetic
  // events leave set) and consumed by the next intent, so a click between frames still
  // fires exactly once and holding the button never repeats.
  let clicked = false;
  const onDown = (p: Phaser.Input.Pointer) => {
    if (p.button === LEFT_BUTTON) clicked = true;
  };

  scene.input.on(Phaser.Input.Events.POINTER_DOWN, onDown);

  const camera = scene.cameras.main;
  const scratch = new Phaser.Math.Vector2();

  const pointerWorld = (): Vec2 => {
    const { x, y } = scene.input.activePointer;
    const world = camera.getWorldPoint(x, y, scratch);
    return { x: world.x, y: world.y };
  };

  return {
    readIntent(origin) {
      const target = pointerWorld();
      const axis = (positive: Phaser.Input.Keyboard.Key, negative: Phaser.Input.Keyboard.Key) =>
        (positive.isDown ? 1 : 0) - (negative.isDown ? 1 : 0);
      const intent: PlayerIntent = {
        move: { x: axis(keys.right, keys.left), y: axis(keys.down, keys.up) },
        aimAngle: Math.atan2(target.y - origin.y, target.x - origin.x),
        fire: clicked,
        switchWeapon: Phaser.Input.Keyboard.JustDown(keys.switchWeapon),
        reload: Phaser.Input.Keyboard.JustDown(keys.reload),
      };
      clicked = false;
      return intent;
    },
    pointerWorld,
    restartPressed: () => Phaser.Input.Keyboard.JustDown(keys.restart),
    destroy() {
      scene.input.off(Phaser.Input.Events.POINTER_DOWN, onDown);
      keyboard.removeAllKeys(true);
    },
  };
}
