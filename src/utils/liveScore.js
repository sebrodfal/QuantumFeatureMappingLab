import { qFeatures } from './quantumSimulator.js';
import { applyStd } from './numeric.js';
import { predict } from './classifier.js';
import { physicalToUnit } from '../data/calibration.js';
import frozenModel from '../data/frozenModel.json' with { type: 'json' };
import kipuCloudModel from '../data/kipuCloudModel.json' with { type: 'json' };

/*
  Scores a live physical reading from the ESP32 board or simulated perillas
  against either the Kipu Cloud Model (Rimay DQFE) or the frozen reference model.
  
  physicalReading: { hoistLoad, crowdVib, driveTemp, cableTension } in real
  units (kN, mm/s, °C, MPa).
*/
export function liveScore(physicalReading, activeModel = kipuCloudModel || frozenModel) {
  const model = activeModel?.classical ? activeModel : frozenModel;
  const x = physicalToUnit(physicalReading); // [x0..x3] in [0,1], same domain scale() produces

  const classicalX = applyStd(
    [x],
    model.classical.mean,
    model.classical.sd
  );
  const classicalScore = predict(model.classical, classicalX)[0];
  const classicalAlert = classicalScore >= model.classical.threshold;

  const qx = qFeatures(x);
  const quantumX = applyStd(
    [qx],
    model.quantum.mean,
    model.quantum.sd
  );
  const quantumScore = predict(model.quantum, quantumX)[0];
  const quantumAlert = quantumScore >= model.quantum.threshold;

  return {
    x,
    qx,
    classicalScore,
    classicalThreshold: model.classical.threshold,
    classicalAlert,
    quantumScore,
    quantumThreshold: model.quantum.threshold,
    quantumAlert,
    modelSource: model.source || 'Local Simulator',
  };
}

export { frozenModel, kipuCloudModel };
