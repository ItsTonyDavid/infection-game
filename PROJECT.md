# PROJECT.md — Top-Down Infection

## 1. Project Overview

Build a browser-based, real-time multiplayer 2D infection survival game.

The visual direction combines detailed pixel art inspired by Metal Slug with a freely navigable top-down world reminiscent of Pokémon Platinum's map perspective.

The gameplay is inspired by Halo Reach's Infection mode.

The primary goals are:
1. Build a playable and enjoyable multiplayer game.
2. Learn real-time networking and system design through practical implementation.
3. Maintain a modular, testable, and maintainable codebase.
4. Develop incrementally with AI assistance without losing control of architectural decisions.

This is initially a learning project and a potential portfolio project. Do not assume commercial-scale infrastructure is required.

## 2. Core Gameplay

### 2.1 Teams

There are two player teams:

**Survivors**
- Must survive until the match timer expires.
- Use firearms.
- Can cure infected NPCs.
- Can earn collective team upgrades through NPC interactions and perk voting.

**Zombies**
- Must eliminate all survivors before time expires.
- Attack primarily through melee.
- Move slightly faster than survivors.
- Can kill or infect NPCs to prevent survivors from obtaining their rewards.
- Can earn collective team upgrades through NPC interactions.

When a survivor dies to a zombie, the survivor becomes a zombie. This is a team transition, not a permanent player elimination.

### 2.2 Victory Conditions

- Survivors win if at least one survivor remains alive when the match timer expires.
- Zombies win if no survivors remain alive before the timer expires.
- The server determines match completion and the winning team.

The initial match duration and player count are configurable and must be determined through testing.

### 2.3 Perspective and Movement

The game uses a top-down 2D perspective.

- Players move freely along the X and Y axes.
- The world may use a tile-based map for construction, but movement is continuous rather than restricted to grid cells.
- Player movement and aiming are independent.
- A player can move in one direction while aiming and firing in another.
- The mouse determines the aiming direction.
- The game uses pixel art, with sprites and animations designed for the selected visual style.

Do not implement a side-scrolling game.

### 2.4 Weapons

Survivors initially have two weapons: a pistol and a shotgun. One weapon is active at a time.

- Left mouse button: fire the active weapon, one shot per click (holding does not repeat).
- Q: switch to the other weapon.

The mouse determines the direction of fire. (Changed 2026-10-28 by the developer; see D-005.)

**Pistol**
- Intended for longer effective range.
- Lower damage per shot than the shotgun.
- Intended to help survivors maintain distance.

**Shotgun**
- Intended for shorter effective range.
- Higher damage at close range.
- Intended to be a powerful defensive weapon against approaching zombies.

Zombies primarily use melee attacks and have slightly higher movement speed than survivors.

Exact weapon statistics, ammunition rules, reload mechanics, cooldowns, and damage falloff are undecided. Keep these values configurable.

The aiming indicator may display the direction of aim and an optional effective-range circle. Its final visual design remains open.

### 2.5 Combat Authority

The server validates attacks and determines their outcomes.

The client sends input or attack intent, not authoritative damage values.

The server determines whether a shot or melee attack is valid, which entities are hit, how much damage is applied, and whether an entity dies.

The client renders aiming, animations, muzzle flashes, impacts, and other visual feedback.

## 3. Points of Interest

Points of interest (POIs) are designated locations on the map containing infected NPCs.

The initial design proposes that new POI events occur every two minutes.

Possible locations should be selected from a designed set of map locations, potentially with randomized selection.

Survivors cure NPCs, Zombies kill NPCs. A player can interact with a NPC only once. If a player already interact with that NPCs, other can not interact with that same one. That makes a desicion of which team gets the upgrade. If there are more cured NPCs in that POI, survivors get a small upgrade. If there are more killed NPCs in that POI, zombies gets the upgrade.

The intention is to create a strategic decision:
- Survivors may remain in a relatively safe position.
- Survivors may explore a POI to cure NPCs and contribute to team progression.
- Zombies may contest a POI to prevent survivor rewards.
- Visiting a POI exposes players to additional risk.

The exact POI spawn schedule, NPC counts, duration, map locations, and visual notification system remain configurable or undecided.

Do not assume that all POIs must be active simultaneously.

## 4. NPC Design

### 4.1 NPC Concept

POIs contain NPCs who are infected or sick but are not yet zombies.

They do not belong to the zombie player team.

NPCs are a limited, match-specific resource that creates competition between the two teams.

NPCs do not respawn during a match.

### 4.2 Survivor Interaction

A survivor can approach and cure an infected NPC.

A successful cure:
1. Is validated by the server.
2. Transitions the NPC into a terminal cured state.
3. Grants the configured survivor progression reward.
4. Causes the NPC to flee or otherwise leave the active play area.
5. Removes the NPC from active gameplay.

The exact interaction mechanism, duration, distance, and interruption rules remain undecided.

Do not allow merely walking near an NPC to trigger a cure unless this is explicitly selected as a gameplay rule.

### 4.3 Zombie Interaction

A zombie can attack an infected NPC.

A successful attack may kill or further infect the NPC. Both outcomes have the same initial gameplay consequence:
1. The server validates the attack.
2. The NPC transitions into a terminal lost state.
3. The NPC grants the configured zombie progression credit, if applicable.
4. The NPC dies or is removed from the active play area.
5. The NPC cannot return or be interacted with again.

NPCs do not become controllable zombie players.

The exact attack requirements and whether NPC death or infection should be visually distinct remain open.

### 4.4 NPC State Machine

NPC behavior should use an explicit, testable finite state machine.

Candidate behavioral states:

- `IDLE`: waiting at or near the starting position.
- `APPROACHING_SURVIVOR`: moving toward a nearby survivor.
- `FLEEING_ZOMBIE`: moving away from a nearby zombie.
- `RETURNING`: moving back toward the starting position.
- `CURING`: an optional state if the cure interaction requires time.
- `FLEEING_AFTER_CURE`: leaving the active area after a successful cure.
- `REMOVED`: no longer active in the simulation.

The exact transitions and priority rules must be finalized during implementation.

Expected behavior:

**Survivor detected**
- An infected NPC may approach a nearby survivor.
- If the survivor leaves the interaction area, the NPC can return to its starting position.
- If a valid cure completes, the NPC leaves the active area permanently.

**Zombie detected**
- An NPC attempts to flee from a nearby zombie.
- If the zombie is no longer a threat, the NPC can return to its starting position.
- If the zombie successfully attacks the NPC, the NPC is permanently removed.

Use separate detection and disengagement thresholds where appropriate to prevent rapid state oscillation.

If a zombie threatens an NPC while a survivor is attempting to cure it, the final interaction priority and interruption behavior must be explicitly defined.

### 4.5 NPC Invariants

- Each NPC has one authoritative identity within a match.
- Each NPC can produce at most one terminal outcome.
- An NPC cannot be both cured and lost.
- An NPC cannot be rewarded more than once.
- A terminal NPC cannot return to an active state.
- NPCs do not respawn during the match.
- The server owns terminal transitions and rewards.

## 5. Team Progression and Perks

The design proposes collective team progression rather than unrestricted individual stat growth.

NPC interactions contribute to progression:
- Cured NPCs contribute to survivor progression.
- NPCs successfully lost to zombies contribute to zombie progression or deny survivor rewards.

The precise scoring model has not yet been selected.

Two models are under consideration:

**Model A: Relative progress**
- Progression depends on the balance between cured and lost NPCs.
- The team leading the competition receives an advantage.

**Model B: Independent progress**
- Each team accumulates its own progression.
- Both teams can unlock improvements independently.

Model B is the current preferred direction, but it is not yet a finalized rule.

### 5.1 Perk Voting

The proposed mechanic is a team-wide vote lasting 20 seconds.

Candidate survivor perks:
- Vitality: increased maximum health.
- Mobility: increased movement speed.
- Power: increased weapon damage.

The perk receiving the most valid votes is applied to the survivor team.

The zombie team has its own perks, which may include:
- Increased melee damage.
- Increased movement speed.
- Increased attack speed.

The exact vote trigger, vote frequency, tie-breaking behavior, stacking rules, perk caps, and interaction with match timing remain undecided.

Avoid implementing a final progression economy before the scoring model is explicitly accepted.

### 5.2 Survivor-to-Zombie Progression

A survivor who becomes a zombie should not automatically receive the full power accumulated by existing zombies.

The proposed design reduces or partially resets the converted player's effective level.

For example, if the zombie team's damage perk provides +5 damage, a newly converted zombie might initially receive only +2 damage from that perk.

These numbers are illustrative.

The conversion rule must preserve the team-wide perk system while preventing an individual player from becoming disproportionately powerful immediately after changing teams.

The exact conversion formula and treatment of health, movement speed, and other stats remain undecided.

## 6. Technical Direction

The initial technology proposal is:

**Frontend**
- TypeScript.
- Phaser for the 2D game.
- React for menus, lobby, scoreboard, and other interface elements if needed.

**Backend**
- Node.js.
- TypeScript.
- A persistent real-time connection using WebSockets or Socket.IO.

**Testing**
- Unit tests for pure game rules.
- Integration tests for authoritative game flows and networking.
- Deterministic tests for NPC transitions and progression.

**Persistence**
- A relational database such as PostgreSQL may be introduced for accounts, match history, and persistent statistics.
- Active gameplay state should initially live in server memory.
- Database persistence is not required for every movement update or simulation tick.

These are the proposed defaults. Confirm the actual repository and dependency versions before implementing the stack.

### 6.1 Architectural Boundaries

Separate:
- Rendering and user input.
- Client-side presentation.
- Network message validation.
- Authoritative game simulation.
- Combat and collision rules.
- NPC state machines.
- Progression and perk voting.
- Match lifecycle and victory conditions.
- Persistence.

The server must be authoritative for all competitive outcomes.

Do not introduce microservices, distributed simulation, or complex networking techniques without a demonstrated need.

## 7. Development Milestones

Work through these milestones in order. Do not begin a later milestone until the current milestone's acceptance criteria are met or the developer explicitly changes the plan.

### Milestone 0 — Repository and Tooling

- Create the initial project.
- Confirm TypeScript configuration and scripts.
- Configure formatting, linting, and testing.
- Establish a minimal build and development workflow.
- Document the architecture and update `STATE.md`.

Acceptance criteria: the project runs locally and the available checks work.

### Milestone 1 — Local Gameplay Prototype

- Render a small top-down map.
- Add a placeholder player sprite.
- Implement continuous X/Y movement.
- Implement mouse aiming and the aiming indicator.
- Add pistol and shotgun inputs.
- Add one testable zombie target and basic combat.

No multiplayer, persistence, or progression is required.

Acceptance criteria: the movement and aiming feel coherent, and both weapons can be tested locally.

### Milestone 2 — Authoritative Multiplayer

- Implement a server-side match.
- Connect multiple browser clients.
- Synchronize player movement.
- Validate combat on the server.
- Synchronize damage, death, and team membership.

Acceptance criteria: two or more clients can participate in one match with server-authoritative outcomes.

### Milestone 3 — Infection Match Loop

- Assign initial survivor and zombie teams.
- Implement zombie melee attacks.
- Convert survivors into zombies on valid death.
- Implement the match timer and victory conditions.
- Add a basic scoreboard and match-end screen.

Acceptance criteria: a match can start, run, and finish with a valid winner.

### Milestone 4 — POIs and NPC Behavior

- Create a small map with multiple POI locations.
- Implement POI activation.
- Spawn a finite set of infected NPCs at active POIs.
- Implement the NPC state machine.
- Implement cure and zombie attack interactions.
- Enforce one terminal outcome per NPC.
- Remove terminal NPCs permanently from the match.

Acceptance criteria: NPCs behave predictably, cannot be exploited for duplicate rewards, and never respawn during the match.

### Milestone 5 — Team Progression and Perks

- Finalize the NPC scoring model.
- Implement progression thresholds.
- Implement the 20-second team perk vote if retained.
- Implement perk stacking and limits.
- Implement the survivor-to-zombie progression penalty.
- Add tests for progression edge cases.

Acceptance criteria: both teams progress according to explicit rules, with no duplicate rewards or invalid perk states.

### Milestone 6 — Playtesting and Balance

- Playtest different team sizes.
- Measure survivor win rate and match duration.
- Measure POI participation and NPC outcomes.
- Tune weapon parameters, movement speeds, NPC counts, and perk strength.
- Record each accepted balance change.

Acceptance criteria: balance decisions are based on observed gameplay rather than untested assumptions.

### Milestone 7 — Persistence and Public Deployment

- Add match history and basic statistics if needed.
- Package the application and server for deployment.
- Configure safe environment variables.
- Add logs and basic operational metrics.
- Test real browser clients and disconnect scenarios.

Acceptance criteria: players can access the deployed game and complete matches reliably.

## 8. Explicit Non-Goals for the Initial Prototype

Do not build these unless requested:
- Ranked matchmaking or competitive rating.
- Cosmetic stores or monetization.
- Complex inventories or crafting.
- Procedural world generation.
- Large-scale distributed server architecture.
- Persistent character levels across matches.
- Advanced rollback netcode.
- Sophisticated NPC combat AI.

## 9. Product Success Criteria

The initial project is successful when:
- Players can join and complete a multiplayer match.
- Combat and aiming are responsive enough for the intended gameplay.
- Infection transitions and victory conditions are reliable.
- POIs create meaningful choices for survivors and zombies.
- NPCs have deterministic, testable terminal outcomes.
- Progression is configurable and can be balanced through playtesting.
- The codebase demonstrates sound architectural boundaries and includes useful tests.
- A new developer can run the project using the repository documentation.