import * as Phaser from 'phaser';
import './styles.css';
import { DISPLAY_CONFIG } from './config/display';
import { createHud } from './client/hud/hud';
import { BootScene } from './client/scenes/BootScene';
import { GameScene } from './client/scenes/GameScene';

function requireElement(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (el === null) throw new Error(`Missing #${id} element in index.html`);
  return el;
}

const hud = createHud(requireElement('hud'));

new Phaser.Game({
  type: Phaser.AUTO,
  parent: requireElement('game'),
  width: DISPLAY_CONFIG.width,
  height: DISPLAY_CONFIG.height,
  backgroundColor: DISPLAY_CONFIG.backgroundColor,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [new BootScene(hud), new GameScene(hud)],
});
