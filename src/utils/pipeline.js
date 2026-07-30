import { genData } from './syntheticData';
import { minmax, scale, standardize, applyStd } from './numeric';
import { logreg, predict, auc, opPoint } from './classifier';
import { corrMatrix } from './correlation';
import { qFeatures } from './quantumSimulator';

/* ============================================================
   FULL PIPELINE (generation + quantum feature mapping + reference validation)
   ============================================================ */

export function runPipeline(noise) {
  const train = genData(500, noise, 42);
  const test = genData(500, noise, 7);

  const scaler = minmax(train.X);
  const trainScaled = scale(train.X, scaler);
  const testScaled = scale(test.X, scaler);

  // Classical representation: the four scaled sensors.
  const classicalStd = standardize(trainScaled);
  const classicalModel = logreg(classicalStd.Z, train.y);
  const classicalScores = predict(
    classicalModel,
    applyStd(testScaled, classicalStd.mean, classicalStd.sd)
  );

  // Quantum feature-mapped representation: 4 sensors -> 14 observables.
  const trainQuantum = trainScaled.map(qFeatures);
  const testQuantum = testScaled.map(qFeatures);
  const quantumStd = standardize(trainQuantum);
  const quantumModel = logreg(quantumStd.Z, train.y);
  const quantumScores = predict(
    quantumModel,
    applyStd(testQuantum, quantumStd.mean, quantumStd.sd)
  );

  // Two observables with the largest absolute weight in the quantum model.
  const top = quantumModel.weights
    .map((weight, i) => [Math.abs(weight), i])
    .sort((a, b) => b[0] - a[0])
    .slice(0, 2)
    .map((entry) => entry[1]);

  const classicalOp = opPoint(test.y, classicalScores);
  const quantumOp = opPoint(test.y, quantumScores);

  return {
    classical: {
      corr: corrMatrix(trainScaled),
      auc: auc(test.y, classicalScores),
      op: classicalOp,
      scores: classicalScores,
    },
    quantum: {
      corr: corrMatrix(trainQuantum),
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
  };
}
