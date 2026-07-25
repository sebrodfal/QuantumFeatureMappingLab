import React, { useMemo, useState, useRef, useEffect } from 'react';

/*
  QUANTUM FEATURE MAPPING LAB
  Story: physical machine → 4 source signals → classical or quantum
  feature-mapped representation → feature-space comparison → reference
  analytical validation at a comparable operating target (recall ≥ 80%).

  The quantum feature map does not replace the analytical system. It
  transforms the original physical signals into a derived feature space that
  downstream algorithms can use. AUC / recall / false-alarm validation is a
  secondary, reference-only signal — it does not dominate the design. The
  heatmaps and scatter plots are the primary visual evidence of how the
  feature space structure changes.
*/

const C = {
  navy: '#081120',
  panel: '#0F1B2D',
  panel2: '#14233A',
  panel3: '#192B45',
  border: '#263954',

  text: '#F7F9FC',
  white: '#F8FAFF',
  grey: '#9EACC2',

  classical: '#7C8EA8',
  classicalLight: '#AAB7C8',

  quantum: '#9B5DE5',
  quantumLight: '#D8B4FE',
  quantumDark: '#4C1D7A',

  interaction: '#8BE9FD',

  healthy: '#79C9B7',
  deviation: '#FB923C',
  selected: '#FDE68A',

  positive: '#4ADE80',
  warning: '#FBBF24',
};

const RAW = ['Load', 'Vibration', 'Temperature', 'Current'];
const UNITS = ['rel.', 'rel.', 'rel.', 'rel.'];

const QNAMES = [
  '⟨Z₀⟩',
  '⟨Z₁⟩',
  '⟨Z₂⟩',
  '⟨Z₃⟩',
  '⟨X₀⟩',
  '⟨X₁⟩',
  '⟨X₂⟩',
  '⟨X₃⟩',
  '⟨Z₀Z₁⟩',
  '⟨Z₀Z₂⟩',
  '⟨Z₀Z₃⟩',
  '⟨Z₁Z₂⟩',
  '⟨Z₁Z₃⟩',
  '⟨Z₂Z₃⟩',
];

/* ============================================================
   QUANTUM SIMULATOR: real 4-qubit statevector

   Gates actually used by the feature map (this is what the Circuit
   diagram labels are drawn from — nothing is invented):
   - RY(θ) rotations only (no RX / RZ gates are applied).
   - CNOT gates in a ring pattern for entanglement.
   - CZ gates between opposite qubits for correlation.
   - ⟨X⟩ expectation values are computed analytically from the statevector
     (no basis-change gate is applied for the X measurement).
   ============================================================ */

const DIM = 16;

const newState = () => {
  const state = new Float64Array(DIM);
  state[0] = 1;
  return state;
};

const ry = (state, qubit, theta) => {
  const cos = Math.cos(theta / 2);
  const sin = Math.sin(theta / 2);
  const mask = 1 << qubit;

  for (let k = 0; k < DIM; k++) {
    if ((k & mask) === 0) {
      const k1 = k | mask;
      const a0 = state[k];
      const a1 = state[k1];

      state[k] = cos * a0 - sin * a1;
      state[k1] = sin * a0 + cos * a1;
    }
  }
};

const cnot = (state, control, target) => {
  const controlMask = 1 << control;
  const targetMask = 1 << target;

  for (let k = 0; k < DIM; k++) {
    if (k & controlMask && !(k & targetMask)) {
      const k1 = k | targetMask;
      const temp = state[k];
      state[k] = state[k1];
      state[k1] = temp;
    }
  }
};

const cz = (state, a, b) => {
  const maskA = 1 << a;
  const maskB = 1 << b;

  for (let k = 0; k < DIM; k++) {
    if (k & maskA && k & maskB) state[k] = -state[k];
  }
};

const REPS = [
  { a: 1, b: 1 },
  { a: 0.5, b: 2 },
];

function qFeatures(x) {
  const state = newState();

  for (const rep of REPS) {
    // Encode the four sensors as RY rotations.
    for (let q = 0; q < 4; q++) {
      ry(state, q, rep.a * Math.PI * x[q]);
    }

    // Ring entanglement.
    for (let q = 0; q < 4; q++) {
      cnot(state, q, (q + 1) % 4);
    }

    // Products between neighboring sensors.
    for (let q = 0; q < 4; q++) {
      ry(state, q, rep.b * Math.PI * x[q] * x[(q + 1) % 4]);
    }

    // Correlations between opposite qubits.
    for (let q = 0; q < 4; q++) {
      cz(state, q, (q + 2) % 4);
    }
  }

  for (let q = 0; q < 4; q++) {
    ry(state, q, 0.5 * Math.PI * x[q]);
  }

  const probabilities = new Float64Array(DIM);
  for (let k = 0; k < DIM; k++) {
    probabilities[k] = state[k] * state[k];
  }

  const output = [];

  // Four Z measurements.
  for (let q = 0; q < 4; q++) {
    let expectation = 0;

    for (let k = 0; k < DIM; k++) {
      expectation += probabilities[k] * ((k >> q) & 1 ? -1 : 1);
    }

    output.push(expectation);
  }

  // Four X measurements.
  for (let q = 0; q < 4; q++) {
    const mask = 1 << q;
    let expectation = 0;

    for (let k = 0; k < DIM; k++) {
      expectation += state[k] * state[k ^ mask];
    }

    output.push(expectation);
  }

  // Six ZᵢZⱼ correlations.
  for (let a = 0; a < 4; a++) {
    for (let b = a + 1; b < 4; b++) {
      let expectation = 0;

      for (let k = 0; k < DIM; k++) {
        const signA = (k >> a) & 1 ? -1 : 1;
        const signB = (k >> b) & 1 ? -1 : 1;
        expectation += probabilities[k] * signA * signB;
      }

      output.push(expectation);
    }
  }

  return output;
}

/* ============================================================
   SYNTHETIC TWIN OF A ROTATING MACHINE
   ============================================================ */

const mulberry32 = (seed) => {
  let a = seed | 0;

  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

function genData(n, noise, seed) {
  const random = mulberry32(seed);

  const gaussian = () => {
    let u = 0;
    let v = 0;

    while (!u) u = random();
    while (!v) v = random();

    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const X = [];
  const y = [];

  for (let i = 0; i < n; i++) {
    // Load dominates the four sensors: introduces redundancy.
    const load = 0.2 + 0.8 * random();

    // 40% of the cases present an operating deviation.
    const faulty = random() < 0.4;

    // Two synthetic deviation modes.
    const sign = random() < 0.65 ? 1 : -1;
    const deviation = faulty
      ? sign * (0.11 + 0.14 * random())
      : (random() - 0.5) * 0.18;

    const sensorNoise = () => 0.018 * noise * gaussian();

    X.push([
      load + sensorNoise(),
      load * (0.5 + deviation) + sensorNoise(),
      load * (0.6 + 0.2 * deviation) + sensorNoise(),
      load * 0.9 + sensorNoise(),
    ]);

    y.push(faulty ? 1 : 0);
  }

  return { X, y };
}

/* ============================================================
   NUMERICAL UTILITIES (scaling, correlation)
   ============================================================ */

function minmax(X) {
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

function scale(X, scaler) {
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

function standardize(X) {
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

function applyStd(X, mean, sd) {
  return X.map((row) => row.map((value, j) => (value - mean[j]) / sd[j]));
}

/* Reference classifier utilities. Used to (a) pick the two most informative
   quantum observables, and (b) provide the AUC / recall / false-alarm
   validation shown at the bottom of each card and in the global metrics
   section. Same classifier, applied to two different feature spaces. */
function logreg(X, y, epochs = 900, learningRate = 0.5, l2 = 5e-4) {
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

function predict(model, X) {
  return X.map((row) => {
    let z = model.bias;

    for (let j = 0; j < row.length; j++) {
      z += model.weights[j] * row[j];
    }

    return 1 / (1 + Math.exp(-z));
  });
}

function auc(y, scores) {
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
function opPoint(y, scores, targetRecall = 0.8) {
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

function corrMatrix(X) {
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

function meanOff(matrix) {
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

/* Classifies the selected record's outcome relative to its known condition
   and the ALERT / NO ALERT decision, for the small secondary status label. */
function decisionStatus(actualLabel, alertFlag) {
  if (actualLabel === 0 && alertFlag) {
    return { label: 'False alarm', color: C.deviation };
  }

  if (actualLabel === 1 && !alertFlag) {
    return { label: 'Missed deviation', color: C.warning };
  }

  if (actualLabel === 0 && !alertFlag) {
    return { label: 'Correctly classified as healthy', color: C.healthy };
  }

  return { label: 'Correctly detected deviation', color: C.positive };
}

/* ============================================================
   FULL PIPELINE (generation + quantum feature mapping + reference validation)
   ============================================================ */

function runPipeline(noise) {
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

/* ============================================================
   VISUAL COMPONENTS
   ============================================================ */

function heatColor(r) {
  const intensity = Math.min(1, Math.abs(r)) * 0.85;

  if (r >= 0) {
    return `rgba(240, 120, 75, ${0.16 + 0.72 * intensity})`;
  }

  return `rgba(74, 125, 180, ${0.16 + 0.72 * intensity})`;
}

/* Fixed outer viewBox regardless of matrix size, so the Classical (4x4)
   and Quantum (14x14) heatmaps occupy the same total visual area — only
   the cell size differs. The matrix is centered both horizontally
   (symmetric left/right margins) and vertically within the box, so it
   lines up with the centered color legend below it. Shows values inside
   cells when there is room (classical); otherwise relies on a native SVG
   <title> tooltip per cell so the quantum matrix never gets cluttered
   with tiny numbers. */
function Heatmap({ matrix, labels, showValues = false }) {
  const n = matrix.length;
  const size = 320;
  const margin = labels ? 49 : 10;
  const cell = (size - margin * 2) / n;
  const matrixH = n * cell;
  const yOffset = (size - matrixH) / 2;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        overflow: 'visible',
      }}
    >
      {matrix.map((row, i) =>
        row.map((value, j) => {
          const isDiag = i === j;
          const rowLabel = labels ? labels[i] : `Var ${i + 1}`;
          const colLabel = labels ? labels[j] : `Var ${j + 1}`;

          return (
            <g key={`${i}-${j}`}>
              <rect
                className="heat-cell"
                x={margin + j * cell}
                y={yOffset + i * cell}
                width={cell - 2}
                height={cell - 2}
                rx="3"
                fill={isDiag ? C.border : heatColor(value)}
                stroke="rgba(255,255,255,0.10)"
              >
                {!isDiag && (
                  <title>{`${rowLabel} × ${colLabel}: ${value.toFixed(
                    2
                  )}`}</title>
                )}
              </rect>

              {!isDiag && showValues && cell > 34 && (
                <text
                  x={margin + j * cell + (cell - 2) / 2}
                  y={yOffset + i * cell + (cell - 2) / 2 + 5}
                  textAnchor="middle"
                  fontSize={cell > 60 ? '16' : '13'}
                  fill="rgba(255,255,255,0.92)"
                  fontFamily="Arial"
                  pointerEvents="none"
                >
                  {value.toFixed(2)}
                </text>
              )}
            </g>
          );
        })
      )}

      {labels &&
        labels.map((label, i) => (
          <text
            key={`row-${label}`}
            x={margin - 7}
            y={yOffset + i * cell + cell / 2 + 4}
            textAnchor="end"
            fontSize="11"
            fill={C.grey}
            fontFamily="Arial"
          >
            {label}
          </text>
        ))}
    </svg>
  );
}

function HeatmapLegend() {
  return (
    <div className="heatmap-legend">
      <span>Inverse</span>
      <span className="legend-number">−1</span>
      <div className="heatmap-gradient" />
      <span className="legend-number">+1</span>
      <span>Direct</span>
    </div>
  );
}

/* colorMode="class": point color reflects the known synthetic-twin
   condition (healthy / deviation), NOT the classifier output. Selected
   point always gets a `selected`-colored ring; class color is preserved
   underneath. */
function Scatter({ points, xLabel, yLabel, accent, highlight, labels }) {
  const width = 520;
  const height = 340;
  const padding = 46;

  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);

  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);

  const plotW = width - padding - 16;
  const plotH = height - padding - 14;

  const sx = (value) =>
    padding + ((value - xMin) / (xMax - xMin + 1e-9)) * plotW;
  const sy = (value) =>
    height - padding - ((value - yMin) / (yMax - yMin + 1e-9)) * plotH;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        overflow: 'visible',
      }}
    >
      <rect
        x={padding}
        y="10"
        width={plotW}
        height={plotH}
        fill="#0A1424"
        stroke={accent}
        strokeOpacity="0.5"
      />

      {gridLines.map((t) => (
        <line
          key={`gx-${t}`}
          x1={padding + t * plotW}
          y1={10}
          x2={padding + t * plotW}
          y2={10 + plotH}
          stroke="rgba(255,255,255,0.06)"
        />
      ))}

      {gridLines.map((t) => (
        <line
          key={`gy-${t}`}
          x1={padding}
          y1={10 + t * plotH}
          x2={padding + plotW}
          y2={10 + t * plotH}
          stroke="rgba(255,255,255,0.06)"
        />
      ))}

      {points.map((point, i) => {
        const selectedPoint = i === highlight;
        const fill = labels?.[i] ? C.deviation : C.healthy;

        return (
          <circle
            key={i}
            cx={sx(point[0])}
            cy={sy(point[1])}
            r={selectedPoint ? 8.5 : 4}
            fill={fill}
            stroke={selectedPoint ? C.selected : 'none'}
            strokeWidth={selectedPoint ? 3 : 0}
            opacity={selectedPoint ? 1 : 0.74}
            style={
              selectedPoint
                ? { filter: `drop-shadow(0 0 6px ${C.selected})` }
                : undefined
            }
          />
        );
      })}

      <text
        x={padding + plotW / 2}
        y={height - 12}
        textAnchor="middle"
        fontSize="13"
        fill={C.grey}
        fontFamily="Arial"
      >
        {xLabel}
      </text>

      <text
        x="16"
        y={10 + plotH / 2}
        textAnchor="middle"
        fontSize="13"
        fill={C.grey}
        fontFamily="Arial"
        transform={`rotate(-90 16 ${10 + plotH / 2})`}
      >
        {yLabel}
      </text>
    </svg>
  );
}

/* Single shared layout for both scatter plots so Classical and Quantum are
   guaranteed to have identical structure, size, and alignment. */
function ScatterCard({
  frameClass,
  accent,
  xLabel,
  yLabel,
  points,
  labels,
  highlight,
  note,
}) {
  return (
    <div className={`chart-frame scatter-card ${frameClass}`}>
      <div className="scatter-card-header">
        <div>
          <div className="small-label">Record Distribution</div>
          <div className="scatter-subtitle" title={`${xLabel} × ${yLabel}`}>
            {xLabel} × {yLabel}
          </div>
        </div>

        <div className="scatter-inline-legend">
          <span>
            <i className="legend-dot healthy-dot" />
            Healthy
          </span>
          <span>
            <i className="legend-dot deviation-dot" />
            Deviation
          </span>
          <span>
            <i className="legend-ring" />
            Selected
          </span>
        </div>
      </div>

      <div className="scatter-caption">
        Each point represents one synthetic operating record.
      </div>

      <div className="scatter-svg-wrap">
        <Scatter
          points={points}
          labels={labels}
          xLabel={xLabel}
          yLabel={yLabel}
          accent={accent}
          highlight={highlight}
        />
      </div>

      <div className="scatter-note">{note}</div>
    </div>
  );
}

/* Pure CSS animation: does not trigger React re-renders, so the
   pipeline computation never competes for resources. */
function SignalLine({ value, color }) {
  const values = Array.from({ length: 32 }, (_, i) => {
    const base = 0.5 + 0.18 * Math.sin(i * 0.7);
    const variation = 0.12 * Math.sin(i * 1.6 + value * 8);
    return Math.max(
      0.08,
      Math.min(0.92, base + variation + (value - 0.5) * 0.3)
    );
  });

  const path = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 200;
      const y = 52 - v * 40;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 200 58" style={{ width: '100%', height: 58 }}>
      <path d="M 0 30 L 200 30" stroke={C.border} strokeWidth="1" />
      <path
        className="signal-path"
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
      />
    </svg>
  );
}

function SensorCard({ name, value, unit, color }) {
  return (
    <div className="sensor-card">
      <div className="sensor-title">
        <span style={{ color }}>{name}</span>
        <span>
          {(value * 100).toFixed(0)} {unit}
        </span>
      </div>
      <SignalLine value={value} color={color} />
    </div>
  );
}

function MachineDiagram() {
  return (
    <svg viewBox="0 0 500 170" style={{ width: '100%', display: 'block' }}>
      <line x1="95" y1="86" x2="415" y2="86" stroke={C.grey} strokeWidth="5" />
      <circle
        cx="150"
        cy="86"
        r="48"
        fill={C.panel2}
        stroke={C.interaction}
        strokeWidth="3"
      />
      <circle
        className="pulse-ring"
        cx="150"
        cy="86"
        r="17"
        fill={C.navy}
        stroke={C.interaction}
        strokeWidth="2"
      />

      <rect
        x="270"
        y="46"
        width="90"
        height="80"
        rx="10"
        fill={C.panel2}
        stroke={C.classicalLight}
        strokeWidth="3"
      />
      <circle
        cx="315"
        cy="86"
        r="22"
        fill={C.navy}
        stroke={C.classicalLight}
        strokeWidth="2"
      />
      <path
        className="spin-blade"
        d="M 315 64 L 330 86 L 315 108 L 300 86 Z"
        fill={C.classical}
        style={{ transformOrigin: '315px 86px' }}
      />

      <circle
        cx="220"
        cy="86"
        r="20"
        fill={C.panel2}
        stroke={C.deviation}
        strokeWidth="3"
      />
      <circle className="pulse-dot" cx="220" cy="86" r="7" fill={C.deviation} />

      <line
        x1="150"
        y1="38"
        x2="150"
        y2="18"
        stroke={C.interaction}
        strokeWidth="2"
      />
      <text
        x="150"
        y="13"
        textAnchor="middle"
        fill={C.interaction}
        fontSize="12"
      >
        Load
      </text>

      <line
        x1="220"
        y1="108"
        x2="220"
        y2="145"
        stroke={C.deviation}
        strokeWidth="2"
      />
      <text
        x="220"
        y="163"
        textAnchor="middle"
        fill={C.deviation}
        fontSize="12"
      >
        Vibration
      </text>

      <line
        x1="315"
        y1="46"
        x2="315"
        y2="18"
        stroke={C.warning}
        strokeWidth="2"
      />
      <text x="315" y="13" textAnchor="middle" fill={C.warning} fontSize="12">
        Temperature
      </text>

      <line
        x1="105"
        y1="114"
        x2="66"
        y2="142"
        stroke={C.classicalLight}
        strokeWidth="2"
      />
      <text
        x="52"
        y="157"
        textAnchor="middle"
        fill={C.classicalLight}
        fontSize="12"
      >
        Current
      </text>

      <text x="150" y="91" textAnchor="middle" fill={C.white} fontSize="11">
        MOTOR
      </text>
      <text x="315" y="153" textAnchor="middle" fill={C.grey} fontSize="11">
        PUMP
      </text>
    </svg>
  );
}

/* Circuit diagram. Labels reflect exactly the gates used in qFeatures:
   RY rotations for encoding and for the product-dependent interaction
   terms, CNOT for ring entanglement, and CZ for opposite-qubit
   correlation. No RX / RZ / CRZ gates are used, so none are labeled. The
   measurement block only shows ⟨Z⟩ observables to keep the diagram clean. */
function Circuit() {
  const width = 640;
  const height = 190;
  const x0 = 66;
  const dx = 46;
  const topPad = 46;
  const y = (q) => topPad + q * 30;

  const columns = [
    { type: 'gate', kind: 'encode' },
    { type: 'entangle', kind: 'cnot' },
    { type: 'gate', kind: 'interact' },
    { type: 'entangle', kind: 'cz' },
    { type: 'gate', kind: 'encode' },
    { type: 'entangle', kind: 'cnot' },
    { type: 'gate', kind: 'interact' },
    { type: 'entangle', kind: 'cz' },
    { type: 'gate', kind: 'encode' },
  ];

  const gateTitle = (kind, q) =>
    kind === 'encode' ? `RY(x${q})` : `RY(x${q} · x${(q + 1) % 4})`;

  const stageX = {
    encoding: x0,
    interaction: x0 + 3 * dx,
    measurement: x0 + 8 * dx + 46,
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        margin: '0 auto',
      }}
    >
      <text
        x={stageX.encoding}
        y="16"
        fontSize="11"
        fill={C.grey}
        letterSpacing="0.6"
      >
        SIGNAL ENCODING
      </text>
      <text
        x={stageX.interaction}
        y="16"
        fontSize="11"
        fill={C.grey}
        letterSpacing="0.6"
      >
        FEATURE INTERACTIONS
      </text>
      <text
        x={stageX.measurement - 30}
        y="16"
        fontSize="11"
        fill={C.quantumLight}
        letterSpacing="0.6"
      >
        MEASUREMENT
      </text>

      {[0, 1, 2, 3].map((q) => (
        <g key={q}>
          <text x="8" y={y(q) + 4} fontSize="12" fill={C.grey}>
            q{q}
          </text>
          <line
            x1="30"
            y1={y(q)}
            x2={stageX.measurement + 14}
            y2={y(q)}
            stroke={C.border}
          />
        </g>
      ))}

      {columns.map((column, i) => {
        const x = x0 + i * dx;

        if (column.type === 'entangle') {
          return [0, 1, 2, 3].map((q) => (
            <g key={`${i}-${q}`}>
              <line
                x1={x}
                y1={y(q)}
                x2={x}
                y2={y((q + 1) % 4)}
                stroke={C.interaction}
                opacity="0.65"
              >
                <title>{column.kind === 'cnot' ? 'CNOT' : 'CZ'}</title>
              </line>
              <circle cx={x} cy={y(q)} r="3.2" fill={C.interaction}>
                <title>{column.kind === 'cnot' ? 'CNOT' : 'CZ'}</title>
              </circle>
            </g>
          ));
        }

        return [0, 1, 2, 3].map((q) => (
          <rect
            key={`${i}-${q}`}
            x={x - 11}
            y={y(q) - 11}
            width="22"
            height="22"
            rx="4"
            fill={C.panel3}
            stroke={C.quantum}
          >
            <title>{gateTitle(column.kind, q)}</title>
          </rect>
        ));
      })}

      {[0, 1, 2, 3].map((q) => (
        <text
          key={`z-${q}`}
          x={stageX.measurement + 24}
          y={y(q) + 4}
          fontSize="12"
          fill={C.quantumLight}
        >
          ⟨Z{q}⟩
        </text>
      ))}
    </svg>
  );
}

/* ============================================================
   APPLICATION
   ============================================================ */

export default function App() {
  const [noise, setNoise] = useState(1);
  const [sample, setSample] = useState(80);
  const [circuitOpen, setCircuitOpen] = useState(false);
  const [showThresholdExplanation, setShowThresholdExplanation] =
    useState(false);
  const [popoverStyle, setPopoverStyle] = useState({});

  const learnMoreButtonRef = useRef(null);
  const thresholdPopoverRef = useRef(null);

  // Position the popover above the button if there's room, otherwise below.
  // Recomputed on open, resize, and scroll so it tracks the sticky bar.
  useEffect(() => {
    if (!showThresholdExplanation) return undefined;

    const updatePosition = () => {
      const btn = learnMoreButtonRef.current;
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const popoverWidth = Math.min(380, window.innerWidth - 32);
      const measuredHeight = thresholdPopoverRef.current
        ? thresholdPopoverRef.current.offsetHeight
        : 210;
      const gap = 10;

      let top;
      if (rect.top > measuredHeight + gap + 12) {
        top = rect.top - measuredHeight - gap;
      } else {
        top = rect.bottom + gap;
      }
      top = Math.max(8, Math.min(top, window.innerHeight - measuredHeight - 8));

      let left = rect.left;
      left = Math.min(left, window.innerWidth - popoverWidth - 16);
      left = Math.max(left, 16);

      setPopoverStyle({
        top: `${top}px`,
        left: `${left}px`,
        width: `${popoverWidth}px`,
      });
    };

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showThresholdExplanation]);

  // Close on Escape or on click outside the popover / button.
  useEffect(() => {
    if (!showThresholdExplanation) return undefined;

    const handleKey = (event) => {
      if (event.key === 'Escape') setShowThresholdExplanation(false);
    };

    const handleClick = (event) => {
      const inPopover = thresholdPopoverRef.current?.contains(event.target);
      const inButton = learnMoreButtonRef.current?.contains(event.target);
      if (!inPopover && !inButton) setShowThresholdExplanation(false);
    };

    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [showThresholdExplanation]);

  const R = useMemo(() => runPipeline(noise), [noise]);

  const visibleCount = 220;
  const visibleSample = Math.min(sample, visibleCount - 1);

  const rawCorrelation = meanOff(R.classical.corr);
  const quantumCorrelation = meanOff(R.quantum.corr);

  const [featureA, featureB] = R.quantum.top;

  const rawPoints = R.test.X.slice(0, visibleCount).map((row) => [
    row[0],
    row[1],
  ]);

  const quantumPoints = R.test.Q.slice(0, visibleCount).map((row) => [
    row[featureA],
    row[featureB],
  ]);

  const labels = R.test.y.slice(0, visibleCount);
  const selectedSensors = R.test.X[visibleSample];
  const selectedLabel = R.test.y[visibleSample];
  const classicalScore = R.classical.scores[visibleSample];
  const quantumScore = R.quantum.scores[visibleSample];

  const classicalThreshold = R.classical.op.threshold;
  const quantumThreshold = R.quantum.op.threshold;

  const classicalAlert = classicalScore >= classicalThreshold;
  const quantumAlert = quantumScore >= quantumThreshold;

  const classicalStatus = decisionStatus(selectedLabel, classicalAlert);
  const quantumStatus = decisionStatus(selectedLabel, quantumAlert);

  const aucDelta = (R.quantum.auc - R.classical.auc) * 100;
  const falseAlarmReduction =
    Math.max(0, R.classical.op.fpr - R.quantum.op.fpr) * 100;

  const sensorColors = [
    C.interaction,
    C.deviation,
    C.warning,
    C.classicalLight,
  ];

  return (
    <div className="app">
      <style>{`
        * { box-sizing: border-box; }

        body {
          margin: 0;
          background: ${C.navy};
          color: ${C.text};
          font-family: Arial, sans-serif;
          font-size: 16px;
        }

        .app {
          min-height: 100vh;
          background: ${C.navy};
          padding: 24px;
        }

        h1, h2, h3, .section-title {
          color: ${C.white};
          font-weight: 100;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 20px;
          max-width: 1500px;
          margin: 0 auto 16px;
        }

        .brand {
          color: ${C.interaction};
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2.4px;
        }

        h1 {
          font-family:  Georgia, serif;
          margin: 7px 0 0;
          font-size: clamp(32px, 3.2vw, 43px);
          line-height: 1.08;
          font-weight: 100;
        }

        .subtitle {
          color: ${C.grey};
          font-size: 13px;
          line-height: 1.55;
          text-align: right;
        }

        .divider {
          max-width: 1500px;
          height: 2px;
          margin: 0 auto 18px;
          background: linear-gradient(90deg, ${C.classical}, ${C.quantum}, transparent);
        }

        .card {
          background: ${C.panel};
          border: 1px solid ${C.border};
          border-radius: 12px;
          padding: 18px;
          margin: 0 auto 14px;
          max-width: 1500px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        }

        .small-label {
          color: ${C.grey};
          font-size: 11px;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-family: Arial, sans-serif;
        }

        .control-text, .card-copy, .record-helper, .operating-policy p {
          color: ${C.grey};
          font-size: 13px;
          line-height: 1.55;
        }

        input[type="range"] {
          width: 100%;
          cursor: pointer;
          height: 6px;
        }

        .noise-slider { accent-color: ${C.interaction}; }
        .explore-slider { accent-color: ${C.selected}; }

        /* --- sticky plant noise + explore record --- */
        .sticky-noise-wrap {
          position: sticky;
          top: 12px;
          z-index: 40;
          max-width: 1500px;
          margin: 0 auto 18px;
        }

        .sticky-noise {
          display: grid;
          grid-template-columns:
            minmax(220px, 1fr)
            minmax(220px, 1fr)
            minmax(270px, 1.2fr)
            minmax(250px, 1.1fr);
          gap: 20px;
          align-items: center;
          margin: 0;
          max-width: none;
          padding: 16px 20px;
          background: rgba(15, 27, 45, 0.94);
          border-color: rgba(38, 57, 84, 0.96);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
          backdrop-filter: blur(14px);
        }

        .noise-explanation-area, .record-control-area, .operating-policy {
          padding-left: 18px;
          border-left: 1px solid ${C.border};
        }

        .record-summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin: 6px 0 8px;
          font-size: 13px;
        }

        .record-summary-row span:first-child {
          color: ${C.white};
          font-weight: 700;
        }

        .healthy-status, .deviation-status {
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.4px;
        }

        .healthy-status { color: ${C.healthy}; }
        .deviation-status { color: ${C.deviation}; }

        .record-helper { margin: 6px 0 0; }

        .operating-policy strong {
          display: block;
          margin: 4px 0 3px;
          color: ${C.white};
          font-size: 14px;
        }

        .operating-policy p { margin: 0; }

        .learn-more-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 8px;
          padding: 0;
          border: 0;
          background: transparent;
          color: ${C.interaction};
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
        }

        .learn-more-button:hover { color: ${C.white}; }

        .threshold-popover {
          position: fixed;
          width: min(380px, calc(100vw - 32px));
          padding: 15px 16px;
          border: 1px solid rgba(155, 93, 229, 0.52);
          border-radius: 12px;
          background:
            radial-gradient(
              circle at 90% 0%,
              rgba(216, 180, 254, 0.10),
              transparent 40%
            ),
            rgba(15, 27, 45, 0.98);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.44);
          backdrop-filter: blur(16px);
          color: ${C.grey};
          font-size: 13px;
          line-height: 1.55;
          z-index: 200;
        }

        .threshold-popover-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 9px;
          color: ${C.white};
          font-size: 14px;
          font-weight: 700;
        }

        .threshold-popover p { margin: 7px 0 0; }

        .popover-close-button {
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 7px;
          background: rgba(255, 255, 255, 0.04);
          color: ${C.white};
          font-size: 19px;
          cursor: pointer;
          flex: 0 0 auto;
        }

        .popover-close-button:hover {
          border-color: ${C.quantum};
          background: rgba(155, 93, 229, 0.14);
        }

        /* --- common data source --- */
        .source-grid {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 22px;
          align-items: center;
        }

        .tag {
          display: inline-block;
          margin-bottom: 8px;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 10px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          background: ${C.panel2};
          border: 1px solid ${C.border};
          color: ${C.grey};
        }

        .flow-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid ${C.border};
          color: ${C.grey};
          font-size: 12px;
          text-align: center;
        }

        .flow-row strong { color: ${C.white}; font-weight: 700; }
        .flow-arrow { color: ${C.interaction}; }

        .band {
          max-width: 1500px;
          margin: 0 auto 14px;
          text-align: center;
          color: ${C.grey};
          font-size: 12px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .band strong { color: ${C.selected}; }

        @keyframes signal-flow {
          0% { stroke-dashoffset: 0; opacity: 0.85; }
          50% { opacity: 1; }
          100% { stroke-dashoffset: -24; opacity: 0.85; }
        }

        .signal-path {
          stroke-dasharray: 4 3;
          animation: signal-flow 1.6s linear infinite;
        }

        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }

        .pulse-ring, .pulse-dot {
          transform-box: fill-box;
          transform-origin: center;
          animation: pulse-scale 2.4s ease-in-out infinite;
        }

        @keyframes spin-blade {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .spin-blade { animation: spin-blade 3s linear infinite; }

        .quantum-card {
          background:
            radial-gradient(
              circle at 86% 4%,
              rgba(216, 180, 254, 0.10),
              transparent 34%
            ),
            linear-gradient(145deg, #0F1B2D 0%, #17112B 100%);
          border-color: rgba(155, 93, 229, 0.45);
          box-shadow:
            0 12px 34px rgba(0, 0, 0, 0.24),
            inset 0 1px 0 rgba(248, 250, 255, 0.06);
        }

        .section-title {
          margin: 0 0 5px;
          font-family: Georgia, serif;
          font-size: clamp(21px, 1.8vw, 25px);
          line-height: 1.2;
        }

        .section-description {
          margin: 0 0 14px;
          color: ${C.grey};
          font-size: 15px;
          line-height: 1.55;
        }

        .sensor-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin: 9px 0 4px;
        }

        .sensor-card {
          padding: 16px;
          background: ${C.panel2};
          border: 1px solid ${C.border};
          border-radius: 8px;
          min-height: 108px;
        }

        .sensor-title {
          display: flex;
          justify-content: space-between;
          gap: 6px;
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        /* --- symmetric cards --- */
        .split {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: stretch;
          gap: 18px;
          max-width: 1500px;
          margin: 0 auto 14px;
        }

        .side-card {
          margin: 0;
          max-width: none;
          height: 100%;
          display: grid;
          grid-template-rows:
            82px
            minmax(440px, auto)
            420px
            158px
            minmax(210px, auto);
          gap: 14px;
          align-items: stretch;
        }

        @media (min-width: 1300px) {
          .side-card {
            grid-template-rows:
              86px
              minmax(470px, auto)
              450px
              160px
              minmax(215px, auto);
          }
        }

        .side-card-header { padding-bottom: 0; margin-bottom: 0; }
        .side-card-header .section-title { margin: 0 0 6px; font-size: 18px; }
        .side-card-header .section-description { margin: 0; font-size: 13px; line-height: 1.4; }

        /* --- unified representation map card: variables + heatmap + legend --- */
        .representation-map-card {
          display: flex;
          flex-direction: column;
          min-height: 440px;
          padding: 18px;
          overflow: visible;
          border-radius: 12px;
          background: ${C.panel2};
          border: 1px solid ${C.border};
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
        }

        .representation-map-card.classical-frame {
          background:
            radial-gradient(circle at 85% 0%, rgba(124, 142, 168, 0.08), transparent 34%),
            ${C.panel2};
          border-color: rgba(124, 142, 168, 0.5);
        }

        .representation-map-card.quantum-frame {
          background:
            radial-gradient(circle at 85% 0%, rgba(155, 93, 229, 0.10), transparent 34%),
            ${C.panel2};
          border-color: rgba(155, 93, 229, 0.4);
        }

        .heatmap-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .heatmap-title {
          color: ${C.white};
          font-size: 15px;
          font-weight: 700;
          line-height: 1.2;
        }

        .heatmap-subtitle {
          margin-top: 4px;
          color: ${C.grey};
          font-size: 12px;
          line-height: 1.4;
        }

        .heatmap-average-correlation {
          text-align: right;
          font-size: 11px;
          white-space: nowrap;
        }

        .heatmap-average-correlation span {
          display: block;
          color: ${C.grey};
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .heatmap-average-correlation strong {
          font-family: Georgia, serif;
          font-size: 17px;
          font-weight: 400;
        }

        .chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: 8px;
        }

        .chip {
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 12px;
          background: ${C.panel};
          border: 1px solid ${C.border};
          color: ${C.grey};
        }

        .chip.active-quantum {
          border-color: ${C.quantum};
          color: ${C.quantumLight};
          background: rgba(155, 93, 229, 0.16);
        }

        .chip-caption {
          margin-top: 8px;
          color: ${C.grey};
          font-size: 12px;
          line-height: 1.55;
        }

        .heatmap-matrix-viewport {
          width: min(100%, 330px);
          height: 300px;
          margin: 16px auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (min-width: 1300px) {
          .heatmap-matrix-viewport {
            width: min(100%, 350px);
            height: 320px;
          }
        }

        .heat-cell {
          transition: opacity 0.15s ease, stroke 0.15s ease;
        }

        .heat-cell:hover {
          opacity: 0.88;
          stroke: rgba(255,255,255,0.55);
        }

        .heatmap-legend {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin-top: 0;
          color: ${C.grey};
          font-size: 12px;
        }

        .legend-number {
          color: ${C.classicalLight};
          font-variant-numeric: tabular-nums;
        }

        .heatmap-gradient {
          width: min(180px, 28vw);
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            #4A7DB4 0%,
            #263954 48%,
            #F0784B 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.12);
        }

        /* --- scatter row --- */
        .chart-frame {
          min-height: 0;
          overflow: hidden;
          padding: 18px;
          background: ${C.panel2};
          border: 1px solid ${C.border};
          border-radius: 12px;
          display: flex;
          flex-direction: column;
        }

        .chart-frame.classical-frame { border-color: rgba(124, 142, 168, 0.5); }
        .chart-frame.quantum-frame { border-color: rgba(155, 93, 229, 0.4); }

        .scatter-card { height: 100%; min-height: 0; }

        .scatter-card-header {
          min-height: 54px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .scatter-subtitle {
          margin-top: 3px;
          font-family: Georgia, serif;
          font-size: 16px;
          color: ${C.white};
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .scatter-inline-legend {
          display: flex;
          flex-direction: column;
          gap: 4px;
          color: ${C.grey};
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .scatter-inline-legend span { display: inline-flex; align-items: center; gap: 6px; }

        .scatter-caption {
          margin-top: 4px;
          color: ${C.grey};
          font-size: 11px;
          font-style: italic;
        }

        .legend-dot, .legend-ring {
          width: 9px;
          height: 9px;
          display: inline-block;
          border-radius: 50%;
        }

        .healthy-dot { background: ${C.healthy}; }
        .deviation-dot { background: ${C.deviation}; }
        .legend-ring { background: transparent; border: 2px solid ${C.selected}; }

        .scatter-svg-wrap {
          flex: 1;
          min-height: 0;
          width: 100%;
          margin-top: 6px;
        }

        .scatter-svg-wrap svg {
          display: block;
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .scatter-note {
          margin-top: 8px;
          color: ${C.grey};
          font-size: 11.5px;
          line-height: 1.5;
        }

        .metric-box {
          padding: 14px;
          background: ${C.panel2};
          border-radius: 10px;
          overflow: hidden;
        }

        .metric-value {
          margin-top: 4px;
          font-family: Georgia, serif;
          font-size: clamp(25px, 2.1vw, 31px);
        }

        .metric-description {
          margin-top: 6px;
          color: ${C.grey};
          font-size: 12px;
          line-height: 1.55;
        }

        /* --- validation card: global metrics on top, selected-record decision below --- */
        .validation-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 210px;
          height: auto;
          overflow: visible;
          padding: 12px 16px;
          background: ${C.panel2};
          border-radius: 10px;
        }

        .validation-global { flex: 0 0 auto; }

        .global-metrics-row {
          display: flex;
          gap: 22px;
          margin-top: 6px;
        }

        .global-metric-label {
          color: ${C.grey};
          font-size: 9.5px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .global-metric-value {
          font-family: Georgia, serif;
          font-size: 17px;
          margin-top: 1px;
        }

        .validation-divider {
          height: 1px;
          margin: 10px 0;
          background: rgba(255, 255, 255, 0.10);
        }

        .selected-record-decision { margin-top: 2px; }

        .selected-record-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 6px;
        }

        .known-condition {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.4px;
        }

        .selected-record-content {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
        }

        .record-score-block span, .record-threshold-block span {
          display: block;
          color: ${C.grey};
          font-size: 9.5px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .record-score-block strong, .record-threshold-block strong {
          display: block;
          font-family: Georgia, serif;
          font-size: 15px;
          font-weight: 400;
          margin-top: 1px;
          color: ${C.text};
        }

        .decision-badge-wrapper {
          align-self: end;
          justify-self: end;
          text-align: right;
        }

        .decision-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 14px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.4px;
          white-space: nowrap;
        }

        .decision-badge.alert {
          color: ${C.deviation};
          background: rgba(251, 146, 60, 0.12);
          border: 1px solid rgba(251, 146, 60, 0.45);
        }

        .decision-badge.no-alert {
          color: ${C.healthy};
          background: rgba(121, 201, 183, 0.12);
          border: 1px solid rgba(121, 201, 183, 0.45);
        }

        .decision-status { margin-top: 3px; font-size: 10px; }

        .validation-note {
          display: block;
          width: 100%;
          margin-top: 10px;
          padding-top: 9px;
          border-top: 1px solid rgba(255, 255, 255, 0.10);
          color: ${C.grey};
          font-size: 12px;
          line-height: 1.45;
          white-space: normal;
          overflow-wrap: anywhere;
          font-style: italic;
        }

        .tech-note {
          margin-top: 14px;
          color: ${C.grey};
          font-size: 12px;
          line-height: 1.55;
          font-style: italic;
        }

        @media (max-width: 600px) {
          .selected-record-content { grid-template-columns: 1fr 1fr; }
          .decision-badge-wrapper {
            grid-column: 1 / -1;
            justify-self: start;
            text-align: left;
            margin-top: 4px;
          }
        }

        /* --- quantum circuit toggle --- */
        .collapsible-toggle {
          display: block;
          margin: 0 auto;
          padding: 12px 24px;
          border-radius: 24px;
          border: 1px solid ${C.quantum};
          background: linear-gradient(135deg, ${C.quantumDark}, ${C.panel3});
          color: ${C.quantumLight};
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.3px;
        }

        .collapsible-toggle:hover {
          background: linear-gradient(135deg, #5c2494, ${C.panel3});
        }

        .circuit-body {
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid ${C.border};
        }

        .circuit-stage {
          width: 100%;
          min-height: 250px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 22px 12px;
          overflow-x: auto;
        }

        .circuit-legend {
          margin-top: 10px;
          color: ${C.grey};
          font-size: 12px;
          line-height: 1.6;
          text-align: center;
        }

        .circuit-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 14px;
        }

        .circuit-step {
          padding: 12px;
          background: ${C.panel2};
          border: 1px solid ${C.border};
          border-radius: 8px;
        }

        .circuit-step-title {
          font-size: 13px;
          font-weight: 700;
          color: ${C.white};
          margin-bottom: 5px;
        }

        .circuit-step-text {
          color: ${C.grey};
          font-size: 12px;
          line-height: 1.55;
        }

        /* --- joint metrics --- */
        .metrics-subtitle {
          margin: 18px 0 8px;
          color: ${C.grey};
          font-size: 11px;
          letter-spacing: 1px;
          text-transform: uppercase;
          border-top: 1px solid ${C.border};
          padding-top: 14px;
        }

        .metrics-subtitle:first-of-type {
          border-top: none;
          padding-top: 0;
          margin-top: 6px;
        }

        .evaluation-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .evaluation-grid.three { grid-template-columns: repeat(3, 1fr); }

        .evaluation-card {
          padding: 12px;
          background: ${C.panel2};
          border: 1px solid ${C.border};
          border-radius: 10px;
        }

        .evaluation-value {
          margin-top: 5px;
          font-family: Georgia, serif;
          font-size: clamp(25px, 2.1vw, 31px);
        }

        .eval-footnote {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid ${C.border};
          color: ${C.grey};
          font-size: 12px;
          line-height: 1.6;
        }

        .methodology-note {
          border-left: 3px solid ${C.selected};
          color: ${C.grey};
          font-size: 12px;
          line-height: 1.6;
        }

        @media (max-width: 1100px) {
          .sticky-noise { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 900px) {
          .app { padding: 14px; }
          .header { align-items: start; flex-direction: column; }
          .subtitle { text-align: left; }
          .controls, .split, .evaluation-grid, .source-grid, .circuit-steps {
            grid-template-columns: 1fr;
          }
          .side-card { grid-template-rows: auto; }
          .sticky-noise-wrap { top: 6px; }
        }

        @media (max-width: 700px) {
          .sticky-noise {
            grid-template-columns: 1fr;
            gap: 12px;
            padding: 14px;
          }
          .noise-explanation-area, .record-control-area, .operating-policy {
            padding-left: 0;
            border-left: none;
            padding-top: 10px;
            border-top: 1px solid ${C.border};
          }
        }

        @media (max-width: 480px) {
          h1 { font-size: 26px; }
          .sensor-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <header className="header">
        <div>
          <div className="brand">NTT DATA</div>
          <h1>Quantum Feature Mapping Lab</h1>
        </div>

        <div className="subtitle">
          Industrial sensor signals → quantum feature map
          <br />→ derived observables for downstream analytics
        </div>
      </header>

      <div className="divider" />

      <section className="card">
        <h2 className="section-title">1. Common Source of Industrial Data</h2>
        <p className="section-description">
          A rotating machine generates four physical signals. This record is the
          shared starting point for both feature spaces.
        </p>

        <div className="source-grid">
          <div>
            <span className="tag">Physical Asset</span>
            <MachineDiagram />
          </div>

          <div>
            <span className="tag">Selected Record #{visibleSample + 1}</span>
            <div className="sensor-grid">
              {RAW.map((name, i) => (
                <SensorCard
                  key={name}
                  name={name}
                  value={selectedSensors[i]}
                  unit={UNITS[i]}
                  color={sensorColors[i]}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flow-row">
          <strong>Physical Machine</strong>
          <span className="flow-arrow">→</span>
          <strong>4 Source Signals</strong>
          <span className="flow-arrow">→</span>
          <strong>Two Feature Spaces</strong>
        </div>
      </section>

      <div className="sticky-noise-wrap">
        <section className="card controls sticky-noise">
          <div className="noise-control-area">
            <div className="small-label">
              Plant Noise —{' '}
              <strong style={{ color: C.interaction }}>
                {Math.round((noise / 3) * 100)}%
              </strong>
            </div>

            <input
              className="noise-slider"
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={noise}
              onChange={(event) => setNoise(Number(event.target.value))}
              style={{ marginTop: 8 }}
            />
          </div>

          <div className="noise-explanation-area">
            <div className="small-label">Data Perturbation</div>
            <p>
              Increase synthetic plant noise to observe how signal structure,
              correlation, and separability evolve.
            </p>
          </div>

          <div className="record-control-area">
            <div className="small-label">Explore Data Record</div>
            <div className="record-summary-row">
              <span>Selected record #{visibleSample + 1}</span>
              <span
                className={
                  selectedLabel === 0 ? 'healthy-status' : 'deviation-status'
                }
              >
                {selectedLabel === 0 ? 'HEALTHY' : 'DEVIATION'}
              </span>
            </div>

            <input
              className="explore-slider"
              type="range"
              min="0"
              max={visibleCount - 1}
              step="1"
              value={visibleSample}
              onChange={(event) => setSample(Number(event.target.value))}
              aria-label="Select data record"
            />

            <p className="record-helper">
              The selected record is highlighted in yellow in both scatter
              plots.
            </p>
          </div>

          <div className="operating-policy">
            <div className="small-label">Operating Policy</div>
            <strong>Target recall ≥ 80%</strong>
            <p>
              Thresholds are calculated independently for each representation.
            </p>

            <button
              type="button"
              ref={learnMoreButtonRef}
              className="learn-more-button"
              onClick={() => setShowThresholdExplanation((open) => !open)}
              aria-expanded={showThresholdExplanation}
            >
              {showThresholdExplanation ? 'Hide details' : 'Learn more'}
              <span>{showThresholdExplanation ? '−' : '+'}</span>
            </button>
          </div>
        </section>
      </div>

      {showThresholdExplanation && (
        <div
          ref={thresholdPopoverRef}
          className="threshold-popover"
          role="dialog"
          aria-label="How the alert threshold is chosen"
          style={popoverStyle}
        >
          <div className="threshold-popover-header">
            <span>How the alert threshold is chosen</span>
            <button
              type="button"
              className="popover-close-button"
              onClick={() => setShowThresholdExplanation(false)}
              aria-label="Close explanation"
            >
              ×
            </button>
          </div>

          <p>
            Target recall ≥ 80% is the detection goal, not a fixed 0.80 score.
            The classifier assigns every record a deviation score between 0 and
            1, and the validation set is used to find the score threshold that
            detects at least 80% of known deviations.
          </p>

          <p>
            Each representation can have a different threshold, because their
            score distributions differ. A record triggers an alert when its
            score reaches or exceeds that representation-specific threshold —
            this is exactly the threshold used to decide ALERT / NO ALERT for
            the selected record in each card. False alarms are measured at that
            same operating point.
          </p>
        </div>
      )}

      <div className="band">
        SAME DATA RECORD <strong>→</strong> TWO COMPLEMENTARY FEATURE SPACES
      </div>

      <main className="split">
        <section
          className="card side-card"
          style={{ borderTop: `3px solid ${C.classical}` }}
        >
          <div className="side-card-header">
            <h2 className="section-title">2A. Classical Representation</h2>
            <p className="section-description">
              The four physical signals are kept as original input variables.
            </p>
          </div>

          <div className="representation-map-card classical-frame">
            <div className="heatmap-header">
              <div>
                <div className="heatmap-title">Feature Dependency Matrix</div>
                <div className="heatmap-subtitle">
                  Correlation structure across the feature space
                </div>
              </div>
              <div
                className="heatmap-average-correlation"
                style={{ color: C.classicalLight }}
              >
                <span>Avg. |ρ|</span>
                <strong>{rawCorrelation.toFixed(2)}</strong>
              </div>
            </div>

            <div className="chip-row">
              {RAW.map((name) => (
                <span className="chip" key={name}>
                  {name}
                </span>
              ))}
            </div>
            <div className="chip-caption">
              Direct representation of the signals captured by the sensors.
            </div>

            <div className="heatmap-matrix-viewport">
              <Heatmap matrix={R.classical.corr} labels={RAW} showValues />
            </div>

            <HeatmapLegend />
          </div>

          <ScatterCard
            frameClass="classical-frame"
            accent={C.classical}
            xLabel="Load"
            yLabel="Vibration"
            points={rawPoints}
            labels={labels}
            highlight={visibleSample}
            note="Overlap between colors indicates records with similar sensor-space patterns."
          />

          <div className="metric-box">
            <div className="small-label">Classical Representation Result</div>
            <div className="metric-value" style={{ color: C.classicalLight }}>
              Avg. Redundancy |ρ|: {rawCorrelation.toFixed(2)}
            </div>
            <div className="metric-description">
              The four variables partially reflect the same operating cycle. The
              representation preserves useful signals but includes repeated
              dependencies between sensors.
            </div>
          </div>

          <div className="validation-card">
            <div className="validation-global">
              <div className="small-label">Global Validation</div>
              <div className="global-metrics-row">
                <div>
                  <div className="global-metric-label">AUC</div>
                  <div
                    className="global-metric-value"
                    style={{ color: C.classicalLight }}
                  >
                    {R.classical.auc.toFixed(3)}
                  </div>
                </div>
                <div>
                  <div className="global-metric-label">False alarms</div>
                  <div
                    className="global-metric-value"
                    style={{ color: C.classicalLight }}
                  >
                    {(R.classical.op.fpr * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="validation-divider" />

            <div className="selected-record-decision">
              <div className="selected-record-heading">
                <span className="small-label">
                  Selected Record #{visibleSample + 1}
                </span>
                <span
                  className="known-condition"
                  style={{ color: selectedLabel ? C.deviation : C.healthy }}
                >
                  {selectedLabel ? 'DEVIATION' : 'HEALTHY'}
                </span>
              </div>

              <div className="selected-record-content">
                <div className="record-score-block">
                  <span>Deviation score</span>
                  <strong>{classicalScore.toFixed(2)}</strong>
                </div>

                <div className="record-threshold-block">
                  <span>Operating threshold</span>
                  <strong>{classicalThreshold.toFixed(2)}</strong>
                </div>

                <div className="decision-badge-wrapper">
                  <div
                    className={`decision-badge ${
                      classicalAlert ? 'alert' : 'no-alert'
                    }`}
                  >
                    {classicalAlert ? 'ALERT' : 'NO ALERT'}
                  </div>
                  <div
                    className="decision-status"
                    style={{ color: classicalStatus.color }}
                  >
                    {classicalStatus.label}
                  </div>
                </div>
              </div>
            </div>

            <div className="validation-note">
              Threshold selected to detect at least 80% of known deviations.
            </div>
          </div>
        </section>

        <section
          className="card side-card quantum-card"
          style={{ borderTop: `3px solid ${C.quantum}` }}
        >
          <div className="side-card-header">
            <h2 className="section-title">
              2B. Quantum Feature-Mapped Representation
            </h2>
            <p className="section-description">
              The feature map enriches the representation by generating derived
              observables from the same four physical signals.
            </p>
          </div>

          <div className="representation-map-card quantum-frame">
            <div className="heatmap-header">
              <div>
                <div className="heatmap-title">Feature Dependency Matrix</div>
                <div className="heatmap-subtitle">
                  Correlation structure across the feature space
                </div>
              </div>
              <div
                className="heatmap-average-correlation"
                style={{ color: C.quantumLight }}
              >
                <span>Avg. |ρ|</span>
                <strong>{quantumCorrelation.toFixed(2)}</strong>
              </div>
            </div>

            <div className="chip-row">
              {QNAMES.map((name, i) => (
                <span
                  className={`chip ${
                    i === featureA || i === featureB ? 'active-quantum' : ''
                  }`}
                  key={name}
                >
                  {name}
                </span>
              ))}
            </div>
            <div className="chip-caption">
              14 derived quantum features, expanded from the same four physical
              signals.
            </div>

            <div className="heatmap-matrix-viewport">
              <Heatmap matrix={R.quantum.corr} />
            </div>

            <HeatmapLegend />
          </div>

          <ScatterCard
            frameClass="quantum-frame"
            accent={C.quantum}
            xLabel={QNAMES[featureA]}
            yLabel={QNAMES[featureB]}
            points={quantumPoints}
            labels={labels}
            highlight={visibleSample}
            note="The feature map can reveal alternative geometric relationships between the same records."
          />

          <div className="metric-box">
            <div className="small-label">Quantum Feature Map Result</div>
            <div className="metric-value" style={{ color: C.quantumLight }}>
              Avg. Redundancy |ρ|: {quantumCorrelation.toFixed(2)}
            </div>
            <div className="metric-description">
              The quantum feature map generates a higher-dimensional
              representation with different relationships between variables,
              while preserving traceability to the four source signals.
            </div>
          </div>

          <div className="validation-card">
            <div className="validation-global">
              <div className="small-label">Global Validation</div>
              <div className="global-metrics-row">
                <div>
                  <div className="global-metric-label">AUC</div>
                  <div
                    className="global-metric-value"
                    style={{ color: C.quantumLight }}
                  >
                    {R.quantum.auc.toFixed(3)}
                  </div>
                </div>
                <div>
                  <div className="global-metric-label">False alarms</div>
                  <div
                    className="global-metric-value"
                    style={{ color: C.quantumLight }}
                  >
                    {(R.quantum.op.fpr * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="validation-divider" />

            <div className="selected-record-decision">
              <div className="selected-record-heading">
                <span className="small-label">
                  Selected Record #{visibleSample + 1}
                </span>
                <span
                  className="known-condition"
                  style={{ color: selectedLabel ? C.deviation : C.healthy }}
                >
                  {selectedLabel ? 'DEVIATION' : 'HEALTHY'}
                </span>
              </div>

              <div className="selected-record-content">
                <div className="record-score-block">
                  <span>Deviation score</span>
                  <strong>{quantumScore.toFixed(2)}</strong>
                </div>

                <div className="record-threshold-block">
                  <span>Operating threshold</span>
                  <strong>{quantumThreshold.toFixed(2)}</strong>
                </div>

                <div className="decision-badge-wrapper">
                  <div
                    className={`decision-badge ${
                      quantumAlert ? 'alert' : 'no-alert'
                    }`}
                  >
                    {quantumAlert ? 'ALERT' : 'NO ALERT'}
                  </div>
                  <div
                    className="decision-status"
                    style={{ color: quantumStatus.color }}
                  >
                    {quantumStatus.label}
                  </div>
                </div>
              </div>
            </div>

            <div className="validation-note">
              Threshold selected to detect at least 80% of known deviations.
            </div>
          </div>
        </section>
      </main>

      <section className="card">
        <button
          type="button"
          className="collapsible-toggle"
          onClick={() => setCircuitOpen((open) => !open)}
        >
          {circuitOpen
            ? 'Hide the Quantum Circuit'
            : '⚛ Reveal the Quantum Circuit — How the Derived Features Emerge'}
        </button>

        {circuitOpen && (
          <div className="circuit-body">
            <h3 className="section-title" style={{ textAlign: 'center' }}>
              Signal Transformation via Quantum Feature Map
            </h3>

            <div className="circuit-stage">
              <Circuit />
            </div>

            <div className="circuit-legend">
              Rotation gates encode normalized sensor values.
              <br />
              Entangling gates introduce interactions between sensor variables.
              <br />
              Measurements produce derived quantum observables.
            </div>

            <div className="circuit-steps">
              <div className="circuit-step">
                <div className="circuit-step-title">1. Encoding</div>
                <div className="circuit-step-text">
                  The normalized values of Load, Vibration, Temperature, and
                  Current are encoded as RY rotations on four qubits.
                </div>
              </div>

              <div className="circuit-step">
                <div className="circuit-step-title">
                  2. Feature Interactions
                </div>
                <div className="circuit-step-text">
                  CNOT and CZ entangling gates combine with product-dependent RY
                  rotations to introduce nonlinear relationships between
                  signals.
                </div>
              </div>

              <div className="circuit-step">
                <div className="circuit-step-title">3. Measurement</div>
                <div className="circuit-step-text">
                  Measuring the ⟨Z⟩, ⟨X⟩, and ⟨ZᵢZⱼ⟩ operators produces 14
                  derived quantum features.
                </div>
              </div>
            </div>

            <div className="tech-note">
              4-qubit statevector simulation running in the browser. This demo
              illustrates the feature extraction process; it is not meant to
              demonstrate computational advantage.
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="section-title">3. Feature Space Comparison</h2>
        <p className="section-description">
          Same physical records, two feature representations, and validation at
          a comparable operating target.
        </p>

        <div className="metrics-subtitle">Feature Space</div>
        <div className="evaluation-grid">
          <div className="evaluation-card">
            <div className="small-label">Source Variables</div>
            <div
              className="evaluation-value"
              style={{ color: C.classicalLight }}
            >
              4
            </div>
          </div>

          <div className="evaluation-card">
            <div className="small-label">Derived Quantum Features</div>
            <div className="evaluation-value" style={{ color: C.quantumLight }}>
              14
            </div>
          </div>

          <div className="evaluation-card">
            <div className="small-label">Representation Expansion</div>
            <div className="evaluation-value" style={{ color: C.interaction }}>
              3.5×
            </div>
          </div>

          <div className="evaluation-card">
            <div className="small-label">Avg. Redundancy |ρ|</div>
            <div
              className="evaluation-value"
              style={{ color: C.selected, fontSize: 17 }}
            >
              {rawCorrelation.toFixed(2)} → {quantumCorrelation.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="metrics-subtitle">Downstream Validation</div>
        <div className="evaluation-grid three">
          <div className="evaluation-card">
            <div className="small-label">AUC Improvement</div>
            <div className="evaluation-value" style={{ color: C.positive }}>
              {aucDelta >= 0 ? '+' : ''}
              {aucDelta.toFixed(1)} pts
            </div>
          </div>

          <div className="evaluation-card">
            <div className="small-label">False Alarms Avoided</div>
            <div className="evaluation-value" style={{ color: C.positive }}>
              −{falseAlarmReduction.toFixed(0)}%
            </div>
          </div>

          <div className="evaluation-card">
            <div className="small-label">Target Recall</div>
            <div className="evaluation-value" style={{ color: C.grey }}>
              ≥ 80%
            </div>
          </div>
        </div>

        <div className="eval-footnote">
          The alert threshold is calculated separately for each representation
          to detect at least 80% of known deviations. False alarm rates are then
          compared at that operating target.
        </div>
      </section>

      <section className="card methodology-note">
        <div className="small-label">Methodological Note</div>
        <div style={{ marginTop: 6 }}>
          Higher dimensionality or lower redundancy alone do not guarantee
          better analytical performance. The value of the representation must be
          validated for each dataset, use case, and operational objective.
        </div>
      </section>
    </div>
  );
}
