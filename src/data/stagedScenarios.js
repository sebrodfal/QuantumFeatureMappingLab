import { physicalToUnit } from './calibration.js';

/*
  Staged demo scenarios — the ONLY places in the whole app where a "known
  truth" (healthy/deviation) is asserted for a physical reading.

  Why this file has to exist at all: the classifier can score ANY input,
  live readings included (see liveScore.js) — but scoring is not the same
  as knowing the truth. Both the synthetic train AND test sets get their
  labels from genData()'s own made-up rule, so nothing in the trained
  pipeline has ever seen a real, independently-verified failure. A physical
  knob position was never labeled by that generator either. The only way
  "truth" can exist for the physical board is if the team deliberately
  stages a specific combination and asserts, from engineering judgement,
  what it represents — that's what this file records.

  STATUS: knownTruth below is a NARRATIVE DEFAULT, not an engineering
  sign-off. It follows directly from why each combination was selected out
  of scripts/findCuratedCases.js's sweep (e.g. a "quantum catches it,
  classical stays quiet" combination is *narratively* asserted as a real
  deviation, because that's the demo's whole teaching point) — nobody with
  real shovel domain expertise has reviewed these specific numbers yet.
  Sebastian/Victor/Adriana should treat `knownTruth` and `narrative` as
  editable placeholders, replace `reading` values with whichever detent
  positions the physical potentiometers actually land on, and flip
  `reviewed: true` once a real engineering judgement call has been made.
  See docs/curated-cases.json for ~20 more candidates per category if these
  six aren't the best picks.
*/

export const STAGED_SCENARIOS = [
  {
    id: 'quantum-catches-1',
    label: 'Quantum catches it, classical misses',
    reading: { hoistLoad: 437.5, crowdVib: 12.5, driveTemp: 200, cableTension: 200 },
    knownTruth: 'deviation',
    narrative:
      'High load and temperature/tension near their limits — a real fatigue risk. Quantum flags it; classical stays quiet.',
    reviewed: false,
  },
  {
    id: 'quantum-catches-2',
    label: 'Quantum catches it, classical misses (variant)',
    reading: { hoistLoad: 375, crowdVib: 18.75, driveTemp: 200, cableTension: 200 },
    knownTruth: 'deviation',
    narrative: 'Same failure mode, slightly different load/vibration balance.',
    reviewed: false,
  },
  {
    id: 'classical-false-alarm-1',
    label: 'Classical false-alarms, quantum stays quiet',
    reading: { hoistLoad: 500, crowdVib: 50, driveTemp: 20, cableTension: 1 },
    knownTruth: 'healthy',
    narrative:
      'High load and vibration alone, but low temperature/tension — actually within normal operating envelope. Classical over-reacts to load+vibration; quantum reads the full picture correctly.',
    reviewed: false,
  },
  {
    id: 'classical-false-alarm-2',
    label: 'Classical false-alarms, quantum stays quiet (variant)',
    reading: { hoistLoad: 437.5, crowdVib: 50, driveTemp: 20, cableTension: 50.75 },
    knownTruth: 'healthy',
    narrative: 'Same false-alarm pattern, slightly different cable tension.',
    reviewed: false,
  },
  {
    id: 'both-healthy-1',
    label: 'Both agree — healthy',
    reading: { hoistLoad: 0, crowdVib: 0, driveTemp: 200, cableTension: 200 },
    knownTruth: 'healthy',
    narrative: 'Low load and vibration — an uneventful reading both representations agree on.',
    reviewed: false,
  },
  {
    id: 'both-deviation-1',
    label: 'Both agree — deviation',
    reading: { hoistLoad: 500, crowdVib: 50, driveTemp: 20, cableTension: 200 },
    knownTruth: 'deviation',
    narrative: 'Maximum load, vibration, and tension together — an unambiguous stress case.',
    reviewed: false,
  },
];

const MATCH_TOLERANCE = 0.06; // in normalized [0,1] units, per knob

/* Returns the closest staged scenario if the given physical reading is
   within MATCH_TOLERANCE of it on every knob, otherwise null. Comparisons
   happen in normalized [0,1] space (via physicalToUnit) so a 6% tolerance
   means the same thing on every knob regardless of its physical range. */
export function matchStagedScenario(reading) {
  const x = physicalToUnit(reading);

  let best = null;
  let bestDistance = Infinity;

  for (const scenario of STAGED_SCENARIOS) {
    const sx = physicalToUnit(scenario.reading);
    const maxDiff = Math.max(...x.map((value, i) => Math.abs(value - sx[i])));

    if (maxDiff <= MATCH_TOLERANCE && maxDiff < bestDistance) {
      best = scenario;
      bestDistance = maxDiff;
    }
  }

  return best;
}
