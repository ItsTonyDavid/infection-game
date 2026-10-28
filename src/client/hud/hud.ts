import type { WeaponId } from '../../sim/weapons';

export interface HudWeapon {
  readonly id: WeaponId;
  readonly name: string;
  readonly ammo: number;
  readonly magazineSize: number;
  readonly reloading: boolean;
}

/** Low-frequency state shown in the DOM HUD. Never per-frame positions. */
export interface HudSnapshot {
  readonly health: { readonly current: number; readonly max: number };
  readonly activeWeapon: WeaponId;
  readonly weapons: readonly HudWeapon[];
}

export interface Hud {
  update(snapshot: HudSnapshot): void;
  showError(message: string): void;
}

const CONTROLS_HINT =
  'WASD move · Mouse aim · Click fire · Q switch weapon · R reload · Enter restart';

export function createHud(root: HTMLElement): Hud {
  root.innerHTML = '';

  const hint = element('div', 'hud-hint', CONTROLS_HINT);
  const tag = element('div', 'hud-tag', 'PROTOTYPE · local-only combat');
  const panel = element('div', 'hud-panel');

  const health = element('div', 'hud-health');
  const bar = element('div', 'hud-bar');
  const fill = element('div', 'hud-bar-fill');
  const healthValue = element('span', 'hud-health-value');
  bar.append(fill);
  health.append(element('span', '', 'HP'), bar, healthValue);

  const weaponList = element('div', 'hud-weapons');
  panel.append(health, weaponList);
  root.append(hint, panel, tag);

  let lastRendered = '';

  return {
    update(snapshot) {
      // Skip DOM work unless something visible changed.
      const key = JSON.stringify(snapshot);
      if (key === lastRendered) return;
      lastRendered = key;

      const { current, max } = snapshot.health;
      fill.style.width = `${Math.round((current / max) * 100)}%`;
      healthValue.textContent = `${current}/${max}`;

      weaponList.replaceChildren(
        ...snapshot.weapons.map((weapon) => {
          const row = element('div', 'hud-weapon');
          row.dataset['active'] = String(weapon.id === snapshot.activeWeapon);
          row.dataset['reloading'] = String(weapon.reloading);
          const ammo = weapon.reloading ? 'reloading…' : `${weapon.ammo}/${weapon.magazineSize}`;
          row.append(element('span', '', weapon.name), element('span', 'hud-ammo', ammo));
          return row;
        }),
      );
    },
    showError(message) {
      root.append(element('div', 'hud-error', message));
    },
  };
}

function element(tag: string, className: string, text?: string): HTMLElement {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
