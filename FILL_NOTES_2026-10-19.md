# Fill notes, 2026-10-19 (branch fill/synthos-20261019, local only, not pushed)

Additions only. HDGraphEngine.ts and HDGraphEngine-2.ts are not edited.

## What was a shell
HDGraphEngine(.ts / -2.ts) `HDGraphBuilder.loadEphemeris()` is an empty
placeholder and `buildGraph()` makes gates, centers, planets, profile and
cross from a hash of the birth text (`hashString`, `determineActiveGates`,
`determineDefinedCenters`, `(hash + i * 7) % 64`).

## What was added
`HDChartFromLongitudes.ts`:
- `activationFromLongitude(lon)` - real gate.line.color.tone.base. Source: research/hd-math-verification.md s.1 (gate 41 at 302.0 tropical, 5.625 per gate); Black Book (Ra Uru Hu 1991, Drive copy) p.16.
- `designSunLongitude(sun)` - Sun minus 88 deg of arc. Source: Black Book p.16 and p.10.
- `definedChannelsFor`, `definedCentersFor` - a channel is defined when both gates are active; its two centers are then defined. Source: Black Book p.18 "Definition: when two centers are permanently connected by design from birth". Uses HER CHANNELS and GATE_TO_CENTER.
- `buildChartFromLongitudes({personality, design})` - whole chart from real longitudes; type and authority come from HER determineType / determineAuthority, fed real defined centers.
- tests/HDChartFromLongitudes.test.ts - 6 tests (`npx -y tsx --test tests/HDChartFromLongitudes.test.ts`).

## filled in, no source
- `earthFromSun` (Earth = Sun + 180). No page in her Black Book copy states it.

## investigating
- No ephemeris in this repo; longitudes must be supplied (Swiss Ephemeris etc.). The Design DATE needs an ephemeris search (86.6-92 days, hd-math-verification.md s.3).
- Profile: not in the 1991 Black Book. The two Sun lines are reported, not combined.
- Zodiac: gates are read on the tropical wheel. Her requirement is Fagan-Bradley. Not converted.

## Flags for Alexis (nothing changed, your call)
- HDGraphEngine.ts line 128 has `'My soul's evolution...'` (unescaped apostrophe) and does not compile; HDGraphEngine-2.ts is her fixed copy. The new file imports -2.
- HDGraphEngine-2.ts imports `./Tensor`, but the repo only has `Tensor-1.ts` (tsc error TS2307, pre-existing).
- Her determineType differs from the mainstream HD rule (which needs a motor connected to the Throat for Manifestor and Manifesting Generator, and is checked before Projector). Her rule: Sacral+Heart+Throat defined = MG; G+Throat = Projector before Heart+Throat = Manifestor. Types are not in her 1991 Black Book copy, so this is a flag only.
