import { standardize } from './numeric.js';

export function corrMatrix(X) {
  const dimensions = X[0].length;
  const { Z } = standardize(X);
  const matrix = Array.from({ length: dimensions }, () =>
    Array(dimensions).fill(0)
  );

  for (let a = 0; a < dimensions; a++) {
    for (let b = a; b < dimensions; b++) {
      let correlation = 0;

      for (let i = 0; i < Z.length; i++) {
        correlation += (Z[i][a] * Z[i][b]) / Z.length;
      }

      matrix[a][b] = correlation;
      matrix[b][a] = correlation;
    }
  }

  return matrix;
}

export function meanOff(matrix) {
  let sum = 0;
  let count = 0;

  for (let a = 0; a < matrix.length; a++) {
    for (let b = a + 1; b < matrix.length; b++) {
      sum += Math.abs(matrix[a][b]);
      count++;
    }
  }

  return count === 0 ? 0 : sum / count;
}

export function heatColor(r) {
  const intensity = Math.min(1, Math.abs(r)) * 0.85;

  if (r >= 0) {
    return `rgba(240, 120, 75, ${0.16 + 0.72 * intensity})`;
  }

  return `rgba(74, 125, 180, ${0.16 + 0.72 * intensity})`;
}
