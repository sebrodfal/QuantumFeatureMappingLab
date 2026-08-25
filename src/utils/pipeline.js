import realDatasetBundle from '../data/realCases.json' with { type: 'json' };
import { genData } from './syntheticData.js';
import { minmax, scale, standardize, applyStd } from './numeric.js';
import { logreg, predict, auc, opPoint } from './classifier.js';
import { corrMatrix } from './correlation.js';
import { qFeatures } from './quantumSimulator.js';

/* ============================================================
   TRAINING (single source of truth for "what a model is")
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
   FULL PIPELINE (Real Kipu Dataset by default + Dynamic Noise Perturbation)
   ============================================================ */

export function runPipeline(noise = 1, frozenTraining = null, useRealData = true) {
  if (useRealData && realDatasetBundle?.records?.length > 0) {
    const { classical, quantum, records, top, scaler } = realDatasetBundle;

    // Plant Noise: Physical sensor jitter on the shovel telemetry (noise=1: baseline, >1: plant perturbation)
    const delta = (noise - 1) * 0.04;

    const X_noisy = records.map((r, i) => {
      if (delta === 0) return r.sensors;
      // Physical sensor jitter across the 4 physical channels
      const n0 = Math.sin(i * 12.9898 + 78.233) * delta;
      const n1 = Math.cos(i * 37.719 + 11.13) * delta;
      const n2 = Math.sin(i * 7.123 + 45.98) * delta;
      const n3 = Math.cos(i * 19.456 + 82.34) * delta;
      return [
        Math.min(1, Math.max(0, r.sensors[0] + n0)),
        Math.min(1, Math.max(0, r.sensors[1] + n1)),
        Math.min(1, Math.max(0, r.sensors[2] + n2)),
        Math.min(1, Math.max(0, r.sensors[3] + n3)),
      ];
    });

    // Quantum features under Plant Noise:
    // Pure real Kipu data: No synthetic quantum noise added.
    // When plant sensors fluctuate, quantum features map to the exact Kipu observables
    // of the closest evaluated physical state.
    const Q_noisy = records.map((r, i) => {
      if (delta === 0) return r.qFeatures;
      const targetSensor = X_noisy[i];
      let bestDist = Infinity;
      let bestQ = r.qFeatures;
      // Fast local search around neighborhood
      const searchRadius = 50;
      const start = Math.max(0, i - searchRadius);
      const end = Math.min(records.length, i + searchRadius);
      for (let j = start; j < end; j++) {
        const s = records[j].sensors;
        const d =
          (targetSensor[0] - s[0]) ** 2 +
          (targetSensor[1] - s[1]) ** 2 +
          (targetSensor[2] - s[2]) ** 2 +
          (targetSensor[3] - s[3]) ** 2;
        if (d < bestDist) {
          bestDist = d;
          bestQ = records[j].qFeatures;
        }
      }
      return bestQ;
    });

    const y = records.map((r) => r.label);

    const TARGET_RECALL = 0.80;
    const classicalZ = applyStd(X_noisy, classical.mean, classical.sd);
    const classicalScores = predict(classical, classicalZ);
    const classicalAuc = delta === 0 ? classical.auc : auc(y, classicalScores);
    const classicalOp = opPoint(y, classicalScores, TARGET_RECALL);

    const quantumZ = applyStd(Q_noisy, quantum.mean, quantum.sd);
    const quantumScores = predict(quantum, quantumZ);
    const quantumAuc = delta === 0 ? quantum.auc : auc(y, quantumScores);
    const quantumOp = opPoint(y, quantumScores, TARGET_RECALL);

    return {
      classical: {
        corr: delta === 0 ? classical.corr : corrMatrix(X_noisy),
        auc: classicalAuc,
        op: classicalOp,
        scores: classicalScores,
      },
      quantum: {
        corr: delta === 0 ? quantum.corr : corrMatrix(Q_noisy),
        auc: quantumAuc,
        op: quantumOp,
        scores: quantumScores,
        top: top || [1, 5],
      },
      test: {
        X: X_noisy,
        Q: Q_noisy,
        y,
      },
      records,
      training: {
        scaler,
        classicalModel: { weights: classical.weights, bias: classical.bias },
        quantumModel: { weights: quantum.weights, bias: quantum.bias },
        top: top || [1, 5],
      },
    };
  }

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
    training,
  };
}
