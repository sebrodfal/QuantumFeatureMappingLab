/* ============================================================
   NUMERICAL UTILITIES (scaling, correlation)
   ============================================================ */

export function minmax(X) {
  const dimensions = X[0].length;
  const lo = Array(dimensions).fill(1e9);
  const hi = Array(dimensions).fill(-1e9);

  X.forEach((row) => {
    row.forEach((value, j) => {
      if (value < lo[j]) lo[j] = value;
      if (value > hi[j]) hi[j] = value;
    });
  });

  return { lo, hi };
}

export function scale(X, scaler) {
  return X.map((row) =>
    row.map((value, j) =>
      Math.min(
        1,
        Math.max(
          0,
          (value - scaler.lo[j]) / (scaler.hi[j] - scaler.lo[j] + 1e-9)
        )
      )
    )
  );
}

export function standardize(X) {
  const dimensions = X[0].length;
  const mean = Array(dimensions).fill(0);
  const variance = Array(dimensions).fill(0);

  X.forEach((row) => {
    row.forEach((value, j) => {
      mean[j] += value / X.length;
    });
  });

  X.forEach((row) => {
    row.forEach((value, j) => {
      variance[j] += (value - mean[j]) ** 2 / X.length;
    });
  });

  const sd = variance.map((value) => Math.sqrt(value) + 1e-9);

  return {
    Z: X.map((row) => row.map((value, j) => (value - mean[j]) / sd[j])),
    mean,
    sd,
  };
}

export function applyStd(X, mean, sd) {
  return X.map((row) => row.map((value, j) => (value - mean[j]) / sd[j]));
}
