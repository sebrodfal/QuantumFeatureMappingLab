/*
  Physical calibration for the ESP32 potentiometer board (see
  docs/demo-fisico-spec.md §5.1, §6).

  Maps each knob's real-world range to the [0,1] domain the model was
  trained on — the physical equivalent of what scale()/minmax() do for the
  synthetic dataset in the browser. This is the "capa de traducción" Adriana
  asked about: potentiometer reading (real units) -> normalized model input.

  STATUS as of docs/demo-fisico-spec.md (2026-08-10):
  - driveTemp and cableTension: Victor's proposal from the meeting, used as-is.
  - hoistLoad and crowdVib: PLACEHOLDER ranges (confirmed: false). Sebastian
    must confirm these with real shovel engineering data before the physical
    board is wired — do not treat them as final.
*/

import realCases from './realCases.json' with { type: 'json' };

// Fixed noise level the shipped model is trained and frozen at. 1.0 is the
// app's own default, per docs/demo-fisico-spec.md §6.
export const NOISE_FOR_FROZEN_MODEL = 1;

// Order matches RAW in constants.js: Hoist Load, Crowd Vib., Drive Temp., Cable Tension.
export const PHYSICAL_RANGES = {
  hoistLoad: { min: 0, max: 500, unit: 'kN', confirmed: true },
  crowdVib: { min: 0, max: 50, unit: 'mm/s', confirmed: true },
  driveTemp: { min: 20, max: 200, unit: '°C', confirmed: true },
  cableTension: { min: 1, max: 200, unit: 'MPa', confirmed: true },
};

const PHYSICAL_ORDER = ['hoistLoad', 'crowdVib', 'driveTemp', 'cableTension'];

const SCALER = realCases?.scaler || {
  lo: [5.19551183592556, 0.5478009555003811, 21.96762242597121, 3.0999924032362993],
  hi: [494.75259283183095, 50.91696152853773, 198.12324702442143, 197.71103052126077],
};

/* physicalReading: { hoistLoad, crowdVib, driveTemp, cableTension } in real
   units -> [x0, x1, x2, x3] in [0,1], aligned with dataset features. */
export function physicalToUnit(physicalReading) {
  if (!physicalReading) return [0.5, 0.5, 0.5, 0.5];
  return PHYSICAL_ORDER.map((key, i) => {
    const value = physicalReading[key] ?? ((SCALER.lo[i] + SCALER.hi[i]) / 2);
    const lo = SCALER.lo[i];
    const hi = SCALER.hi[i];
    return Math.min(1, Math.max(0, (value - lo) / (hi - lo + 1e-9)));
  });
}
