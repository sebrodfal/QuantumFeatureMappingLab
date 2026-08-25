import { physicalToUnit } from '../data/calibration.js';
import realCases from '../data/realCases.json' with { type: 'json' };
import frozenModel from '../data/frozenModel.json' with { type: 'json' };
import kipuCloudModel from '../data/kipuCloudModel.json' with { type: 'json' };

/*
  Find the nearest real record among the 1000 evaluated Kipu test samples.
  Computes normalized Euclidean distance across the 4 physical sensor channels.
*/
export function findNearestRealRecord(physicalReading, records = realCases.records) {
  if (!records || records.length === 0) return null;

  const target = physicalToUnit(physicalReading); // [x0..x3] in [0, 1]

  let bestRecord = records[0];
  let bestDistance = Infinity;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const s = r.sensors;
    const distSq =
      (target[0] - s[0]) ** 2 +
      (target[1] - s[1]) ** 2 +
      (target[2] - s[2]) ** 2 +
      (target[3] - s[3]) ** 2;

    if (distSq < bestDistance) {
      bestDistance = distSq;
      bestRecord = r;
    }
  }

  const distance = Math.sqrt(bestDistance);
  // Maximum possible distance in 4D unit hypercube is sqrt(4) = 2.0
  const similarity = Math.max(0, (1 - distance / 2) * 100);

  return {
    bestRecord,
    distance,
    similarity: Number(similarity.toFixed(1)),
  };
}

/*
  Scores a physical reading by snapping to the closest real sample evaluated by Kipu.
  Returns the exact 7 quantum observables (Xq) and ground-truth validation.
*/
export function liveScore(physicalReading, activeModel = realCases || kipuCloudModel || frozenModel) {
  const model = activeModel?.classical ? activeModel : realCases;
  const records = realCases?.records || [];

  const snap = findNearestRealRecord(physicalReading, records);
  const r = snap?.bestRecord || records[0];

  const classicalThreshold = model.classical?.op?.threshold ?? model.classical?.threshold ?? 0.2231;
  const quantumThreshold = model.quantum?.op?.threshold ?? model.quantum?.threshold ?? 0.2097;

  const classicalScore = r ? r.classicalScore : 0;
  const quantumScore = r ? r.quantumScore : 0;
  const classicalAlert = classicalScore >= classicalThreshold;
  const quantumAlert = quantumScore >= quantumThreshold;

  return {
    matchedRecord: r,
    recordId: r?.id ?? 0,
    distance: snap?.distance ?? 0,
    similarity: snap?.similarity ?? 100,
    x: r ? r.sensors : physicalToUnit(physicalReading),
    rawSensors: r ? r.rawSensors : physicalReading,
    display: r ? r.display : null,
    qx: r ? r.qFeatures : [0, 0, 0, 0, 0, 0, 0],
    label: r ? r.label : 0,
    classicalScore,
    classicalThreshold,
    classicalAlert,
    quantumScore,
    quantumThreshold,
    quantumAlert,
    userReading: physicalReading,
    modelSource: 'Kipu Quantum Hub Real Execution (1000 Test Records)',
  };
}

export { frozenModel, kipuCloudModel, realCases };

