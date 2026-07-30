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

export const DIM = 16;

export const newState = () => {
  const state = new Float64Array(DIM);
  state[0] = 1;
  return state;
};

export const ry = (state, qubit, theta) => {
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

export const cnot = (state, control, target) => {
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

export const cz = (state, a, b) => {
  const maskA = 1 << a;
  const maskB = 1 << b;

  for (let k = 0; k < DIM; k++) {
    if (k & maskA && k & maskB) state[k] = -state[k];
  }
};

export const REPS = [
  { a: 1, b: 1 },
  { a: 0.5, b: 2 },
];

export function qFeatures(x) {
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
