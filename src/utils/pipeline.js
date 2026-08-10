import { genData } from './syntheticData.js';
import { minmax, scale, standardize, applyStd } from './numeric.js';
import { logreg, predict, auc, opPoint } from './classifier.js';
import { corrMatrix } from './correlation.js';
import { qFeatures } from './quantumSimulator.js';

/* ============================================================
   TRAINING (single source of truth for "what a model is")

   Used both by runPipeline() for live in-browser retraining, and by
   scripts/freezeModel.js to produce the frozen weights shipped to the
   physical board — so the two paths can never drift apart.
   ============================================================ */

export function trainModels(noise) {
  const train = genData(500, noise, 42);

  const scaler = minmax(train.X);
  const trainScaled = scale(train.X, scaler);

  // Classical representation: the four scaled sensors.
  const classicalStd = standardize(trainScaled);
  const classicalModel = logreg(classicalStd.Z, train.y);

  // Quantum feature-mapped representation: 4 sensors -> 14 observables.
  const trainQuantum = trainScaled.map(qFeatures);
  const quantumStd = standardize(trainQuantum);
  const quantumModel = logreg(quantumStd.Z, train.y);

  // Two observables with the largest absolute weight in the quantum model.
  const top = quantumModel.weights
    .map((weight, i) => [Math.abs(weight), i])
    .sort((a, b) => b[0] - a[0])
    .slice(0, 2)
    .map((entry) => entry[1]);

  return {
    scaler,
    classicalModel,
    classicalStd,
    quantumModel,
    quantumStd,
    top,
    trainScaled,
    trainQuantum,
  };
}

/* ============================================================
   FULL PIPELINE (generation + quantum feature mapping + reference validation)

   frozenTraining is optional: pass the bundle returned by trainModels() (or
   reconstructed from src/data/frozenModel.json) to score against fixed
   weights instead of retraining. Omitted (default), this behaves exactly as
   before — trains fresh from `noise` on every call.
   ============================================================ */

export function runPipeline(noise, frozenTraining = null) {
  const test = genData(500, noise, 7);

  const training = frozenTraining ?? trainModels(noise);
  const {
    scaler,
    classicalModel,
    classicalStd,
    quantumModel,
    quantumStd,
    top,
    trainScaled,
    trainQuantum,
  } = training;

  const testScaled = scale(test.X, scaler);
  const classicalScores = predict(
    classicalModel,
    applyStd(testScaled, classicalStd.mean, classicalStd.sd)
  );

  const testQuantum = testScaled.map(qFeatures);
  const quantumScores = predict(
    quantumModel,
    applyStd(testQuantum, quantumStd.mean, quantumStd.sd)
  );

  const classicalOp = opPoint(test.y, classicalScores);
  const quantumOp = opPoint(test.y, quantumScores);

  // A frozen bundle doesn't ship the 500-row training set, so the
  // correlation matrices fall back to the test set's own scaled
  // representations — statistically equivalent at a fixed noise level, just
  // a different draw. The default (unfrozen) path is unaffected: it always
  // has trainScaled/trainQuantum, exactly like before this refactor.
  const classicalCorrSource = trainScaled ?? testScaled;
  const quantumCorrSource = trainQuantum ?? testQuantum;

  return {
    classical: {
      corr: corrMatrix(classicalCorrSource),
      auc: auc(test.y, classicalScores),
      op: classicalOp,
      scores: classicalScores,
    },
    quantum: {
      corr: corrMatrix(quantumCorrSource),
      auc: auc(test.y, quantumScores),
      op: quantumOp,
      scores: quantumScores,
      top,
    },
    test: {
      X: testScaled,
      Q: testQuantum,
      y: test.y,
    },
    // Exposes the trained/frozen bundle (weights, standardization stats,
    // scaler) so callers — e.g. scripts/freezeModel.js — can persist it
    // without duplicating the training logic above.
    training,
  };
}
