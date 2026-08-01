# Lightwake

> An echolocation puzzle game that leaves the screen almost entirely dark.
> Touch the screen → a click sound → a stereo echo plus haptic feedback comes
> back. Drag to move forward, and build a map in your head. At the end of a
> level, see the glowing silhouette of the path you walked in the dark.

Original idea: [`18-yanki.tr.md` in the `game-ideas` repo](https://github.com/Eren-Ozcan/game-ideas/blob/master/ideas/18-yanki.tr.md).

## What's done — Phase 0 (feel prototype, completed)

- **Stack:** Vite + TypeScript, PWA, zero runtime dependencies — just the
  Web Audio API, Vibration API, and Pointer Events.
- **Core mechanic:** touch → click + echo. Five rays, cast only into the
  player's forward 180° — nothing is cast backwards, because stereo panning
  alone cannot distinguish front from back; casting backwards would produce
  noise rather than information.
- **Movement:** drag to move forward/backward plus 90° turns left/right. No
  free rotation — a deliberate choice to prevent losing your bearings after
  a turn.
- **Sound design:** sample-free, fully procedural click/echo synthesis; a
  shared convolution reverb (tapped before panning, so it adds a sense of
  space without blurring directional information); ±7% pitch variation per
  click; checkpoint/completion chords; a separate "thud" sound for hitting a
  wall that does not depend on haptics.
- **Haptics:** a texture channel, not an information channel (the Vibration
  API can only control duration, not amplitude). Silently disabled on iOS
  Safari.
- **60 levels:** 3 hand-designed (Short/Medium/Long) and 57 generated
  deterministically (fixed seed, identical on every playthrough). Difficulty
  ramps up from 5 to 22 turns.
- **Tutorial level:** a mini tutorial corridor suggested on first launch that
  progresses through step-by-step hints (touch/listen → move → hit a wall →
  turn → checkpoint → exit). Completion is remembered (localStorage), and it
  can be replayed from the start screen. It sits outside the main 60 levels
  and is not included in that count.
- **Verification:** `npm run verify-levels` — checks that every level is a
  single connected path (no branching or adjacent corridors) and that the
  checkpoint and the exit are reachable from the start. This script caught a
  real T-junction bug in the hand-designed original "Long" level.
- **Physical testing:** the user played the first few levels on an iPhone —
  "losing your bearings after a turn", the actual risk of Phase 0, was
  validated and it works.

## Known limitations

- Vibration does not work on iPhone/Safari — an Apple platform restriction
  that cannot be fixed from the web.
- The 57 generated levels have only been verified structurally (at the code
  level); no physical/feel testing has been done.
- There is a single sound palette; no biome variety yet.
- There is no web API that detects whether headphones are plugged in — it can
  only be flagged with text, not actually detected.

## To do

### Phase 1 — Content expansion
- [ ] Real biome sound palettes (ice cave, underwater, temple) — each one
      should teach a new "hearing" skill
- [ ] Rank system (e.g. "Master of Silence", "Speedrunner")
- [ ] Creature journal

### Phase 2 — Polish
- [ ] Physical/feel testing of the 57 generated levels (currently verified structurally only)
- [ ] Real accessibility testing — with blind players
- [ ] Clarify the headphone warning text (a reminder, not detection)

### Phase 3 — Launch preparation
- [ ] Early access for ASMR/sensory content creators
- [ ] Apple accessibility showcase submission

### Platform decision (pending)
- [ ] Move to Flutter for real native haptics — porting the mechanic validated
      in Phase 0 to native via iOS Core Haptics / Android VibrationEffect

## Development

```
npm install
npm run dev:host   # for testing on a phone over the same Wi-Fi
npm run verify-levels
npm run build
```
