import { qFeatures } from './quantumSimulator.js';
import { applyStd } from './numeric.js';
import { predict } from './classifier.js';
import { physicalToUnit } from '../data/calibration.js';
import frozenModel from '../data/frozenModel.json' with { type: 'json' };

/*
  Scores a live physical reading from the ESP32 board against the frozen
  classical and quantum models (src/data/frozenModel.json, produced by
  scripts/freezeModel.js). Runs the exact same qFeatures()/predict() code
  used everywhere else in the app — no duplicated logic, no separate
  "board" model. docs/demo-fisico-spec.md §4, §7.2.

  physicalReading: { hoistLoad, crowdVib, driveTemp, cableTension } in real
  units (kN, mm/s, °C, MPa).
*/
export function liveScore(physicalReading) {
  const x = physicalToUnit(physicalReading); // [x0..x3] in [0,1], same domain scale() produces

  const classicalX = applyStd(
    [x],
    frozenModel.classical.mean,
    frozenModel.classical.sd
  );
  const classicalScore = predict(frozenModel.classical, classicalX)[0];
  const classicalAlert = classicalScore >= frozenModel.classical.threshold;

  const qx = qFeatures(x);
  const quantumX = applyStd(
    [qx],
    frozenModel.quantum.mean,
    frozenModel.quantum.sd
  );
  const quantumScore = predict(frozenModel.quantum, quantumX)[0];
  const quantumAlert = quantumScore >= frozenModel.quantum.threshold;

  return {
    x,
    qx,
    classicalScore,
    classicalThreshold: frozenModel.classical.threshold,
    classicalAlert,
    quantumScore,
    quantumThreshold: frozenModel.quantum.threshold,
    quantumAlert,
  };
}

export { frozenModel };
