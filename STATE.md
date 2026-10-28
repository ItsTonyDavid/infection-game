# STATE.md

## Current milestone

- Milestone 0 (Repository and Tooling): **Done.**
- Milestone 1 (Local Gameplay Prototype): **Implemented; awaiting developer playtest sign-off.**
  Its acceptance criterion ("movement and aiming feel coherent") is subjective and needs the
  developer to play it.

## Current task

Developer playtest of the local prototype and first tuning pass.

## Done

- Project scaffold: Vite + TypeScript strict + Phaser 3.90, Vitest, ESLint, Prettier
  (D-001). Verified by `npm run check` and `npm run build`.
- Pure simulation in `src/sim/` (D-002):
  - Continuous X/Y movement, diagonal normalization, arena clamping, invalid input ignored.
  - Weapons: cooldown, magazine, auto-reload on empty, manual reload (R).
  - Hitscan combat with linear damage falloff; shotgun pellet cone (D-003).
  - Health/death; training dummies that respawn after a delay.
  - `stepWorld` with injected RNG and time; deterministic for a fixed seed.
- Central PROVISIONAL tuning in `src/config/gameplay.ts`.
- Phaser client: map background, Cynthia survivor sprite with 4-direction walk animation
  (facing follows the mouse), camera follow with map bounds, aim line + reticle + weapon
  range circle, three placeholder zombie dummies at ~50/110/280 px, tracers, muzzle flash,
  impact sparks, white hit flash, floating damage numbers, health bars, DOM HUD
  (HP, weapons, ammo, reload state, controls), Enter to restart.
- Asset pipeline from `references/` to `public/assets/` (D-004); `references/README.md`.
- Zombie skin (2026-10-28): `zombie-cynthia.png` generated from `cynthia_sprite.png` by a
  palette swap in the asset build (optional `palette` on spritesheet jobs). Training dummies
  now render its standing frame instead of the boot-generated placeholder rectangle.
- Weapon input change (2026-10-28, D-005): one active weapon, left click fires once per click,
  Q switches weapon. `PlayerIntent` now has `fire` and `switchWeapon` instead of per-weapon
  flags; the simulation owns the active weapon.
- Weapon ranges (2026-10-28, developer-set, still provisional): pistol 168 px (1.2 x the
  former shotgun range of 140), shotgun 105 px (0.75 x 140); falloff starts scaled to keep
  their previous fractions (105 and 30). From the spawn, the far dummy (~280 px) is out of
  range of both weapons and the mid dummy (~110 px) only of the pistol.

## Last checks run (2026-10-27; re-checked 2026-10-28)

- 2026-10-28, after the weapon input change: `npm run check` pass (66 tests), `npm run build`
  pass. Browser: HUD shows the new controls hint and starts with the pistol active. The
  automated click check was inconclusive because the developer was playing in the same tab
  at the same time; click-once and Q switching are covered by unit tests, not yet confirmed
  by an isolated browser run.

- 2026-10-28, after the zombie skin: `npm run check` pass (64 tests), `npm run build` pass,
  `npm run assets:build` pass with `references/` checksums unchanged; browser shows the zombie
  dummies with health bars and no asset load errors.
- `npm run check` (typecheck app + tools, ESLint, Prettier check, Vitest): pass, 64 tests.
- `npm run build`: pass.
- `npm run assets:build`: pass; `references/` checksums unchanged afterwards.
- Browser (Cursor browser, `npm run dev`): game boots with no load errors; HUD renders.
  With DOM events that match real browser semantics: Enter restarts (ammo reset), one right
  click fires exactly one shotgun shot, one left click fires exactly one pistol shot, holding
  D moves the player and the camera follows, holding W+A stops at the arena corner. A pistol
  hit showed the tracer, white flash and damage number "18".
- Not verified in the browser: walk animation frames visually, holding a button for
  continuous fire with a real mouse, reload timing feel. The Cursor browser's built-in click
  tool sends `mouseup` with `buttons: 1`, which made automated clicks look like a held
  button; input now tracks buttons from down/up events so this cannot stick.

## Known limitations

- Local authority: the browser decides hits and damage. Prototype-only; must move to the
  server in Milestone 2.
- Arena collision is one hand-measured rectangle. Buildings, trees, fences and the NPCs baked
  into `map_1.png` are not solid and are purely visual.
- Dummies use a static zombie Cynthia frame (always facing down, not animated), do not attack,
  and have no collision with the player. Player health never changes yet.
- Survivor sprite has 4 directions only.
- All weapon, speed and dummy values are provisional, not balance decisions.
- Placeholder art appears to be Pokémon-derived; replace before public deployment.
- Not a git repository yet.

## Open questions for the developer

- Does movement speed (110 px/s) and camera zoom (2x) feel right?
- With click-to-fire, should a click during cooldown be buffered? Should switching take time?
  Should R reload only the active weapon (today it reloads both)?
- Should the map's buildings become solid in Milestone 1, or wait for a proper tilemap?

## Next steps

1. Developer playtest; tune `src/config/gameplay.ts` and `src/config/display.ts`.
2. Initialize git and make the first commit.
3. After sign-off, plan Milestone 2 (authoritative server): choose WebSockets vs Socket.IO,
   define the `PlayerIntent` message schema and validation, move `src/sim` under the server.
