// Offline script — run with `node scripts/freezeModel.js`.
//
// Trains the classical + quantum models once (same code path the browser
// uses) and freezes their weights, standardization stats, and operating
// thresholds to src/data/frozenModel.json. The physical board's liveScore.js
// consumes this file directly, so the demo gives the same verdict for the
// same knob positions every time it's shown at the stand, instead of
// retraining (and drifting) on every page load.
//
// docs/demo-fisico-spec.md §3, §4, §7.1

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { runPipeline } from '../src/utils/pipeline.js';
import { NOISE_FOR_FROZEN_MODEL } from '../src/data/calibration.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'src', 'data', 'frozenModel.json');

const R = runPipeline(NOISE_FOR_FROZEN_MODEL);
const { training } = R;

const frozen = {
  noise: NOISE_FOR_FROZEN_MODEL,
  generatedAt: new Date().toISOString(),
  scaler: training.scaler,
  classical: {
    weights: training.classicalModel.weights,
    bias: training.classicalModel.bias,
    mean: training.classicalStd.mean,
    sd: training.classicalStd.sd,
    threshold: R.classical.op.threshold,
  },
  quantum: {
    weights: training.quantumModel.weights,
    bias: training.quantumModel.bias,
    mean: training.quantumStd.mean,
    sd: training.quantumStd.sd,
    threshold: R.quantum.op.threshold,
    top: training.top,
  },
};

writeFileSync(outPath, JSON.stringify(frozen, null, 2) + '\n');

console.log(`Wrote ${outPath}`);
console.log(`  noise=${NOISE_FOR_FROZEN_MODEL}`);
console.log(`  classical threshold=${frozen.classical.threshold.toFixed(4)} auc=${R.classical.auc.toFixed(4)}`);
console.log(`  quantum   threshold=${frozen.quantum.threshold.toFixed(4)} auc=${R.quantum.auc.toFixed(4)}`);
