import { physicalToUnit } from './calibration.js';

/*
  Staged demo scenarios mapped directly to verified samples from Kipu's
  1000-record real test dataset.
*/
export const STAGED_SCENARIOS = [
  {
    id: 'quantum-catches-1',
    recordId: 36,
    label: 'Quantum catches it (Classical misses)',
    reading: { hoistLoad: 124.2, crowdVib: 6.6, driveTemp: 39.7, cableTension: 119.3 },
    knownTruth: 'deviation',
    narrative:
      'Real deviation (Record #36). Moderate load & abnormal tension detected by quantum observables; classical linear detector stays quiet.',
    reviewed: true,
  },
  {
    id: 'quantum-catches-2',
    recordId: 59,
    label: 'Quantum flags anomaly (Subtle correlation)',
    reading: { hoistLoad: 176.3, crowdVib: 13.6, driveTemp: 45.8, cableTension: 186.9 },
    knownTruth: 'deviation',
    narrative:
      'Subtle deviation pattern (Record #59). Quantum feature mapping surfaces non-linear coupling missed by raw sensor channels.',
    reviewed: true,
  },
  {
    id: 'classical-false-alarm-1',
    recordId: 4,
    label: 'Classical false-alarms (Quantum stays quiet)',
    reading: { hoistLoad: 245.5, crowdVib: 9.3, driveTemp: 53.1, cableTension: 82.1 },
    knownTruth: 'healthy',
    narrative:
      'Normal operational envelope (Record #4). Classical model overreacts to load/vibration; quantum correctly rules out false alarm.',
    reviewed: true,
  },
  {
    id: 'both-deviation-1',
    recordId: 6,
    label: 'Both agree — Critical Deviation',
    reading: { hoistLoad: 420.5, crowdVib: 47.3, driveTemp: 161.7, cableTension: 58.9 },
    knownTruth: 'deviation',
    narrative:
      'High load, severe vibration & high temperature (Record #6). Both classical and quantum models unambiguously trigger alarm.',
    reviewed: true,
  },
  {
    id: 'both-healthy-1',
    recordId: 58,
    label: 'Both agree — Nominal Operation',
    reading: { hoistLoad: 297.2, crowdVib: 1.7, driveTemp: 150.1, cableTension: 182.4 },
    knownTruth: 'healthy',
    narrative:
      'Smooth operation with minimal vibration (Record #58). Both models report clean machine telemetry.',
    reviewed: true,
  },
];

const MATCH_TOLERANCE = 0.08; // in normalized [0,1] units, per knob

/* Returns the closest staged scenario if the given physical reading is
   within MATCH_TOLERANCE of it on every knob, otherwise null. */
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

