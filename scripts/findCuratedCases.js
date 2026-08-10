// Offline script — run with `node scripts/findCuratedCases.js`.
//
// Sweeps the 4-dimensional physical knob space (using the calibration
// ranges in src/data/calibration.js) against the frozen model, and finds
// representative combinations for the three curated cases the physical
// board needs (docs/demo-fisico-spec.md §5.3):
//
//   Case 1 — classical and quantum DISAGREE (the switch narrative: "here
//            classical misses/false-alarms, quantum gets it right or vice
//            versa"). Reported in both directions.
//   Case 2/3 — classical and quantum AGREE (both healthy, or both
//            deviation) — the "most of the time both systems agree" cases.
//
// This does not decide which direction is "the demo's story" — that's a
// staging choice for Sebastian/Victor/Adriana. It just surfaces the
// cleanest candidates (largest margin from each model's own threshold) so
// the physical knob detents can be calibrated against real coordinates.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { liveScore } from '../src/utils/liveScore.js';
import { PHYSICAL_RANGES } from '../src/data/calibration.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'docs', 'curated-cases.json');

const STEPS_PER_AXIS = 9; // 9^4 = 6561 combinations — cheap, fine-grained enough for knob detents
const KEYS = ['hoistLoad', 'crowdVib', 'driveTemp', 'cableTension'];

function stepsFor(key) {
  const { min, max } = PHYSICAL_RANGES[key];
  return Array.from({ length: STEPS_PER_AXIS }, (_, i) => min + (i / (STEPS_PER_AXIS - 1)) * (max - min));
}

function sweep() {
  const axes = KEYS.map(stepsFor);
  const results = [];

  for (const hoistLoad of axes[0]) {
    for (const crowdVib of axes[1]) {
      for (const driveTemp of axes[2]) {
        for (const cableTension of axes[3]) {
          const reading = { hoistLoad, crowdVib, driveTemp, cableTension };
          const score = liveScore(reading);
          results.push({ reading, score });
        }
      }
    }
  }

  return results;
}

function margin(score) {
  const classicalMargin = score.classicalScore - score.classicalThreshold;
  const quantumMargin = score.quantumScore - score.quantumThreshold;
  return { classicalMargin, quantumMargin };
}

function topN(list, compareFn, n = 5) {
  return [...list].sort(compareFn).slice(0, n);
}

function summarize(entry) {
  const { classicalMargin, quantumMargin } = margin(entry.score);
  return {
    reading: entry.reading,
    classicalScore: entry.score.classicalScore,
    classicalAlert: entry.score.classicalAlert,
    classicalMargin,
    quantumScore: entry.score.quantumScore,
    quantumAlert: entry.score.quantumAlert,
    quantumMargin,
  };
}

const results = sweep();

const disagreeQuantumCatches = results.filter(
  (r) => !r.score.classicalAlert && r.score.quantumAlert
);
const disagreeClassicalOnly = results.filter(
  (r) => r.score.classicalAlert && !r.score.quantumAlert
);
const agreeHealthy = results.filter(
  (r) => !r.score.classicalAlert && !r.score.quantumAlert
);
const agreeDeviation = results.filter(
  (r) => r.score.classicalAlert && r.score.quantumAlert
);

// Rank disagreement cases by how confidently quantum's verdict differs from
// classical's (large |quantumMargin| + classical barely/not triggering) —
// the cleanest "quantum tells a different story than classical" moments.
const curated = {
  generatedAt: new Date().toISOString(),
  stepsPerAxis: STEPS_PER_AXIS,
  totalCombinationsSwept: results.length,
  counts: {
    disagreeQuantumCatches: disagreeQuantumCatches.length,
    disagreeClassicalOnly: disagreeClassicalOnly.length,
    agreeHealthy: agreeHealthy.length,
    agreeDeviation: agreeDeviation.length,
  },
  // Case 1 candidates: quantum flags deviation, classical stays quiet.
  case1_quantumCatchesEarly: topN(
    disagreeQuantumCatches,
    (a, b) => margin(b.score).quantumMargin - margin(a.score).quantumMargin
  ).map(summarize),
  // Case 1 (other direction): classical false-alarms, quantum stays quiet.
  case1_classicalFalseAlarm: topN(
    disagreeClassicalOnly,
    (a, b) => margin(b.score).classicalMargin - margin(a.score).classicalMargin
  ).map(summarize),
  // Case 2: both agree healthy, comfortably below both thresholds.
  case2_bothHealthy: topN(
    agreeHealthy,
    (a, b) =>
      margin(a.score).classicalMargin +
      margin(a.score).quantumMargin -
      (margin(b.score).classicalMargin + margin(b.score).quantumMargin)
  ).map(summarize),
  // Case 3: both agree deviation, comfortably above both thresholds.
  case3_bothDeviation: topN(
    agreeDeviation,
    (a, b) =>
      margin(b.score).classicalMargin +
      margin(b.score).quantumMargin -
      (margin(a.score).classicalMargin + margin(a.score).quantumMargin)
  ).map(summarize),
};

writeFileSync(outPath, JSON.stringify(curated, null, 2) + '\n');

console.log(`Wrote ${outPath}`);
console.log(`Swept ${results.length} combinations (${STEPS_PER_AXIS} steps/axis).`);
console.log('Counts:', curated.counts);
if (curated.counts.disagreeQuantumCatches + curated.counts.disagreeClassicalOnly === 0) {
  console.log(
    '\nWARNING: no disagreement cases found anywhere in the swept physical range.\n' +
      'The physical calibration ranges (src/data/calibration.js) likely need widening,\n' +
      'or Hoist Load / Crowd Vib. ranges need to be confirmed — see docs/demo-fisico-spec.md §6.'
  );
}
