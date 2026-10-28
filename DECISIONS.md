# DECISIONS.md

Accepted architectural and gameplay decisions. Proposals and open questions live in `PROJECT.md`.
Records are never edited after the fact; a change is a new record that supersedes the old one.

---

## D-001: Client toolchain for the prototype

- Date: 2026-10-27
- Status: Accepted (chosen by the agent under the Milestone 0/1 task brief; developer may revisit)
- Context: Empty repository. The brief asked for TypeScript + Phaser 3 with minimal dependencies,
  formatting, linting and tests.
- Decision:
  - Vite 8 (dev server/bundler), TypeScript 6.0 strict, Phaser 3.90.0.
  - Vitest 5 for tests, ESLint 10 + typescript-eslint (strict, type-checked), Prettier 3.
  - DOM HUD without React for now.
- Alternatives considered:
  - Phaser 4 (current npm `latest`): rejected because the brief asked for Phaser 3.
  - TypeScript 7: rejected because typescript-eslint 8.72 supports TypeScript `<6.1`.
  - React for the HUD: deferred; a handful of DOM nodes does not justify it yet.
- Consequences: Phaser alone makes the bundle ~1.2 MB minified (325 kB gzip); acceptable for
  the prototype. Revisit React when lobby/scoreboard/vote UI grows.

## D-002: Game rules live in a pure simulation module

- Date: 2026-10-27
- Status: Accepted
- Context: `AGENTS.md` §4–5 require rules independent of Phaser and a server-authoritative
  future. Milestone 1 is local-only.
- Decision: `src/sim/` contains movement, weapons, combat, health and a
  `stepWorld(state, intent, dtMs, config, rng)` function with no Phaser, DOM or Node imports.
  The client converts input into a `PlayerIntent`, steps the simulation, and renders the
  returned state and events. Randomness and time are injected.
- Alternatives considered: Phaser Arcade physics bodies as the source of truth (simpler at
  first, but couples rules to the renderer and cannot run on the server).
- Consequences: Local damage/shooting is explicitly prototype-only; in Milestone 2 the server
  runs `src/sim` and clients send only `PlayerIntent`. Collision with map geometry will also
  have to be implemented in `src/sim`, not with Phaser physics.

## D-003: Hitscan weapons with linear damage falloff (provisional)

- Date: 2026-10-27
- Status: Accepted for the prototype; revisit during Milestone 2 and Milestone 6
- Context: Pistol must reward range, shotgun must dominate up close (`PROJECT.md` §2.4).
- Decision: Shots are instant rays against circular hitboxes. Damage per pellet is full up to
  `falloffStart`, then falls linearly to `minDamageMultiplier` at `maxRange`, and is 0 beyond.
  Shotgun pellets are spread evenly across a cone with bounded random jitter. Only one weapon
  fires per step (left button wins). All values are in `src/config/gameplay.ts`.
- Alternatives considered: Simulated projectiles (travel time, dodgeable) — more state to
  synchronize and test; not needed to evaluate feel yet.
- Consequences: Hitscan makes server-side hit validation sensitive to latency; lag
  compensation is out of scope until a measured need exists.

## D-004: Asset pipeline — references are sources, runtime assets are generated

- Date: 2026-10-27
- Status: Accepted
- Context: The developer provides art in `references/`, which must not be modified, and
  asked for an explicit, maintainable way to add assets.
- Decision: `tools/assets/build-assets.ts` runs an explicit list of jobs (copy, or color-key +
  pad for sprite sheets) from `references/` into `public/assets/`, using a dependency-free PNG
  codec on `node:zlib`. Generated files are committed. Code uses keys from
  `src/client/assets/manifest.ts`; frame layouts are recorded there and in
  `references/README.md`.
- Alternatives considered: Loading `references/` directly (mixes sources with runtime files,
  cannot fix the opaque background); Pillow-based `sprite-pipeline` scripts (Pillow is not
  installed; adds a Python dependency).
- Consequences: Adding art means adding a job and a manifest entry. The PNG codec only supports
  8-bit non-interlaced RGB/RGBA and throws on anything else.

## D-005: One active weapon, click to fire, Q to switch

- Date: 2026-10-28
- Status: Accepted (explicit developer decision). Supersedes the input part of D-003 ("left
  button wins", LMB pistol / RMB shotgun) and `PROJECT.md` §2.4 as originally written.
- Context: The prototype mapped LMB to the pistol and RMB to the shotgun, both hold-to-fire.
  The developer chose a single active weapon instead.
- Decision:
  - The player has one active weapon (starts with the pistol).
  - Left click fires the active weapon once; holding the button does not repeat.
  - Q cycles to the next weapon. Switching is instant; each weapon keeps its own cooldown,
    ammo and in-progress reload. The right mouse button is unused.
  - `PlayerIntent` carries `fire` and `switchWeapon` (both edge-triggered) instead of
    per-weapon flags, so the simulation (later the server) owns which weapon is active.
- Alternatives considered: keep LMB/RMB per weapon; hold-to-fire with the active weapon.
- Consequences: A click during the cooldown is ignored (no input buffer). Switch delay, a
  buffered click, and whether R should reload only the active weapon are open tuning
  questions for playtesting.
