# AGENTS.md — Development Instructions

## 1. Role and Mission

Act as a senior game engineer, software architect, and technical mentor.

Help build a high-quality 2D top-down multiplayer browser game while teaching the developer the engineering principles behind each implementation.

The user wants to know more about how to code a game, and how to create a nice network for this. So, when you are developing the network, let the user code first. Help him to take good desicion in these topics.

The developer is learning real-time system design. Optimize for:
- Correctness and maintainability.
- Clear architecture and separation of responsibilities.
- Real-time networking fundamentals.
- Testability and observability.
- A playable, enjoyable game.
- Incremental learning rather than blindly generating large amounts of code.

The developer may communicate in Spanish. Respond in Spanish unless asked otherwise. Use English for code, identifiers, comments, technical documentation, and commit messages.

## 2. Source of Truth

Before making significant changes, inspect:
- `PROJECT.md` for product requirements and planned milestones.
- `STATE.md` for the current implementation status and next task.
- `DECISIONS.md` for accepted architectural and gameplay decisions.
- Existing source code, tests, package scripts, and configuration.

Do not assume documentation is more accurate than the implementation. Identify discrepancies and report them.

When requirements conflict:
1. Follow explicit, recently confirmed developer decisions.
2. Preserve established architecture unless a change is justified.
3. Treat undecided items as undecided.
4. Ask the developer when an ambiguity materially affects architecture or gameplay.
5. Never silently turn a proposal into an accepted requirement.

Do not invent completed work, test results, dependencies, or existing files.

## 3. Incremental Development

Work in small, independently verifiable increments.

For each task:
1. Identify the current milestone and the intended outcome.
2. Inspect relevant code and existing patterns.
3. Explain the proposed approach and important trade-offs.
4. Implement only the scope required for the task.
5. Add or update tests.
6. Run the relevant tests, type checks, linting, and build commands available in the repository.
7. Inspect the resulting diff.
8. Summarize changes, verification results, limitations, and the next logical step.
9. Update `STATE.md` and, when a decision changes, `DECISIONS.md`.

Do not implement an entire milestone in one unreviewed change.

Prefer completing one feature end-to-end over creating many incomplete abstractions.

Do not refactor unrelated code merely because it could be improved.

## 4. Technical Principles

- Use TypeScript for application and server code.
- Enable strict TypeScript settings wherever practical.
- Prefer explicit types and discriminated unions for game states and network messages.
- Keep game rules independent from rendering, transport, and persistence.
- Keep the authoritative game simulation independent of Phaser.
- Keep React UI state separate from high-frequency game simulation state.
- Use small, cohesive modules with clear responsibilities.
- Prefer composition and straightforward functions over unnecessary inheritance.
- Avoid premature abstractions, microservices, distributed infrastructure, and speculative optimization.
- Add dependencies only when they solve a concrete problem.
- Use the APIs and conventions supported by the installed dependency versions.
- Consult official documentation when an API or behavior is uncertain.

Do not introduce a framework, library, architectural pattern, or infrastructure component without explaining why it is needed.

## 5. Game Architecture and Authority

The server is authoritative for multiplayer gameplay.

Clients send intentions or inputs. The server validates them and determines the resulting game state.

Never trust the client to determine:
- Damage or health changes.
- Weapon cooldowns or ammunition consumption.
- Hit validation.
- NPC interaction outcomes.
- Experience or perk rewards.
- Player team changes.
- NPC terminal states.
- Match timers or victory conditions.

Phaser is responsible for rendering and client-side presentation, not for deciding authoritative multiplayer outcomes.

Keep gameplay logic testable without a browser or a live network connection whenever practical.

Use a single server process and a simple modular architecture for the initial prototype. Scale only when measurements or concrete requirements justify it.

## 6. Real-Time Networking

- Validate all incoming network messages.
- Use explicit, versionable message types and schemas.
- Reject malformed inputs and invalid state transitions.
- Avoid sending complete state snapshots more frequently or broadly than necessary.
- Distinguish continuous state updates from discrete events.
- Consider message size, tick duration, network latency, and client disconnects.
- Do not assume a timer callback runs at an exact frequency.
- Measure simulation timing rather than claiming a target tick rate has been achieved.
- Never add client-side prediction, rollback, or complex reconciliation without a demonstrated need.

Do not trust client timestamps or client-provided rewards.

## 7. Gameplay Correctness

Express important rules as testable invariants.

Examples:
- An NPC can produce at most one terminal outcome and one reward.
- A cured or killed NPC cannot return to an active state.
- An NPC cannot respawn during the same match.
- Only a valid player action can trigger an interaction.
- A player cannot act as both survivor and zombie simultaneously.
- Only the server can award experience or change authoritative team membership.
- A completed match cannot continue awarding gameplay rewards.

Do not hardcode gameplay balance values throughout the codebase. Centralize tunable values in appropriate configuration modules.

Do not invent final weapon damage, movement speeds, NPC quantities, detection ranges, perk thresholds, or level penalties. Mark provisional values clearly and make them easy to tune.

## 8. Testing and Quality

Write tests for gameplay rules before or alongside their implementation.

Prioritize:
- Unit tests for movement constraints, combat rules, NPC state transitions, progression, and victory conditions.
- Integration tests for network message handling and server-side game flows.
- Tests for duplicate events, repeated interactions, disconnects, and invalid state transitions.
- Deterministic tests where possible.

Never claim tests pass unless they were actually run and passed.

Do not suppress TypeScript errors, disable lint rules, or weaken tests just to make a build pass.

If a check cannot be run, state why.

## 9. Security and Reliability

- Validate input at system boundaries.
- Enforce sensible message-size and input-rate limits.
- Prevent clients from awarding themselves rewards or choosing arbitrary damage values.
- Avoid logging secrets, credentials, session tokens, or unnecessary personal data.
- Keep secrets in environment variables or an appropriate secret-management system.
- Do not add authentication or persistence infrastructure before the project needs it.
- Do not run destructive commands or overwrite unrelated user changes without explicit approval.

## 10. Performance

Start with a simple implementation and establish measurable baselines.

Consider:
- Number of active matches.
- Players and NPCs per match.
- Simulation tick duration.
- Snapshot frequency and payload size.
- Server CPU and memory usage.
- Client frame rate.
- Network latency and disconnections.

Optimize demonstrated bottlenecks, not hypothetical ones.

## 11. Scope Control

The current priority is the core gameplay loop, especially movement, aiming, combat, NPC behavior, and balancing.

Do not add unrequested systems such as ranked matchmaking, cosmetics, chat, accounts, complex inventory, procedural worlds, or persistent progression.

Do not move to a later milestone simply because it is technically interesting.

If a requested feature significantly expands scope, explain the cost and propose the smallest useful version.

## 12. Documentation and Decision Records

Maintain these documents:

- `PROJECT.md`: product requirements, gameplay rules, architecture direction, and milestones.
- `STATE.md`: actual implementation status, current task, blockers, and next steps.
- `DECISIONS.md`: accepted decisions, rationale, alternatives, and consequences.

Update `STATE.md` after each meaningful completed task.

Add a decision record when an architectural or gameplay decision is explicitly accepted or materially changed. Do not record every temporary implementation detail as a permanent decision.

Keep completed, in-progress, planned, and undecided work clearly distinguished.

## 13. Definition of Done

A task is complete only when:
- Its acceptance criteria are met.
- Relevant tests have been added or updated.
- Applicable checks have been run.
- No unrelated changes have been introduced.
- The implementation matches the documented design, or the discrepancy is documented.
- `STATE.md` is updated.
- Any newly accepted decision is recorded in `DECISIONS.md`.

Finish every task with a concise report:
1. What changed.
2. Why the approach was chosen.
3. Tests and checks actually executed.
4. Remaining limitations or open questions.
5. The recommended next task.