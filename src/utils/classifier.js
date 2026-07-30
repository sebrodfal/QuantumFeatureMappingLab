/* Reference classifier utilities. Used to (a) pick the two most informative
   quantum observables, and (b) provide the AUC / recall / false-alarm
   validation shown at the bottom of each card and in the global metrics
   section. Same classifier, applied to two different feature spaces. */
export function logreg(X, y, epochs = 900, learningRate = 0.5, l2 = 5e-4) {
  const dimensions = X[0].length;
  const weights = Array(dimensions).fill(0);
  let bias = 0;

  for (let epoch = 0; epoch < epochs; epoch++) {
    const gradientWeights = Array(dimensions).fill(0);
    let gradientBias = 0;

    for (let i = 0; i < X.length; i++) {
      let z = bias;

      for (let j = 0; j < dimensions; j++) {
        z += weights[j] * X[i][j];
      }

      const probability = 1 / (1 + Math.exp(-z));
      const error = probability - y[i];

      for (let j = 0; j < dimensions; j++) {
        gradientWeights[j] += (error * X[i][j]) / X.length;
      }

      gradientBias += error / X.length;
    }

    for (let j = 0; j < dimensions; j++) {
      weights[j] -= learningRate * (gradientWeights[j] + l2 * weights[j]);
    }

    bias -= learningRate * gradientBias;
  }

  return { weights, bias };
}

export function predict(model, X) {
  return X.map((row) => {
    let z = model.bias;

    for (let j = 0; j < row.length; j++) {
      z += model.weights[j] * row[j];
    }

    return 1 / (1 + Math.exp(-z));
  });
}

export function auc(y, scores) {
  const positives = y.reduce((sum, label) => sum + label, 0);
  const negatives = y.length - positives;

  if (positives === 0 || negatives === 0) return 0.5;

  const ranked = scores
    .map((score, i) => [score, y[i]])
    .sort((a, b) => a[0] - b[0]);

  let rankSum = 0;
  ranked.forEach(([, label], i) => {
    if (label === 1) rankSum += i + 1;
  });

  return (
    (rankSum - (positives * (positives + 1)) / 2) / (positives * negatives)
  );
}

/* Operating policy: choose the threshold that detects at least
   `targetRecall` of the known deviations in the validation set. Classical
   and quantum feature-mapped representations get their own threshold
   because their score distributions differ. */
export function opPoint(y, scores, targetRecall = 0.8) {
  const positivesTotal = y.reduce((sum, label) => sum + label, 0);
  const negativesTotal = y.length - positivesTotal;

  if (positivesTotal === 0 || negativesTotal === 0) {
    return { recall: 0, fpr: 0, threshold: 0 };
  }

  const thresholds = [...scores].sort((a, b) => b - a);

  for (const threshold of thresholds) {
    let tp = 0;
    let fp = 0;

    for (let i = 0; i < y.length; i++) {
      if (y[i]) {
        if (scores[i] >= threshold) tp++;
      } else if (scores[i] >= threshold) {
        fp++;
      }
    }

    if (tp / positivesTotal >= targetRecall) {
      return {
        recall: tp / positivesTotal,
        fpr: fp / negativesTotal,
        threshold,
      };
    }
  }

  return { recall: 1, fpr: 1, threshold: 0 };
}
