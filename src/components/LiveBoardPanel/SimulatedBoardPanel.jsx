import { PHYSICAL_RANGES } from '../../data/calibration.js';
import { STAGED_SCENARIOS } from '../../data/stagedScenarios.js';

const SLIDER_FIELDS = [
  { key: 'hoistLoad', label: 'Hoist Load' },
  { key: 'crowdVib', label: 'Crowd Vib.' },
  { key: 'driveTemp', label: 'Drive Temp.' },
  { key: 'cableTension', label: 'Cable Tension' },
];

export function midpointReading() {
  return SLIDER_FIELDS.reduce((acc, { key }) => {
    const { min, max } = PHYSICAL_RANGES[key];
    acc[key] = Math.round(((min + max) / 2) * 10) / 10;
    return acc;
  }, {});
}

/* On-screen stand-in for the physical potentiometers — drag a slider and it
   drives the same scoring path a real board message would (useLiveBoard's
   applyReading). Meant for showing the concept in a meeting, without
   waiting for hardware or for scripts/mockBoard.js's auto-cycling timer. */
export function SimulatedBoardPanel({ isSimulating, reading, onStart, onChange, onStop }) {
  if (!isSimulating || !reading) {
    return (
      <div className="sim-board-start">
        <p className="control-text">
          No physical board yet? Drag on-screen sliders to stand in for the
          four potentiometers and drive the demo live.
        </p>
        <button type="button" className="live-board-action-btn" onClick={() => onStart(midpointReading())}>
          🎚️ Start simulating perillas
        </button>
      </div>
    );
  }

  return (
    <div className="sim-board">
      <div className="sim-board-presets">
        {STAGED_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            className="sim-preset-btn"
            title={scenario.narrative}
            onClick={() => onChange(scenario.reading)}
          >
            {scenario.label}
          </button>
        ))}
      </div>

      {SLIDER_FIELDS.map(({ key, label }) => {
        const { min, max, unit } = PHYSICAL_RANGES[key];
        const step = Math.max(0.1, (max - min) / 200);

        return (
          <div className="sim-slider-row" key={key}>
            <div className="sim-slider-label">
              <span>{label}</span>
              <strong>
                {reading[key].toFixed(1)} {unit}
              </strong>
            </div>
            <input
              type="range"
              className="sim-slider"
              min={min}
              max={max}
              step={step}
              value={reading[key]}
              onChange={(event) =>
                onChange({ ...reading, [key]: Number(event.target.value) })
              }
              aria-label={`Simulated ${label}`}
            />
          </div>
        );
      })}

      <button type="button" className="live-board-action-btn sim-stop-btn" onClick={onStop}>
        Stop simulating
      </button>
    </div>
  );
}
