import { useEffect } from 'react';
import { PHYSICAL_RANGES, SLIDER_FIELDS, midpointReading } from '../../data/calibration.js';
import { STAGED_SCENARIOS } from '../../data/stagedScenarios.js';

export { midpointReading };


/* On-screen stand-in for the physical potentiometers — drag a slider and it
   drives the same scoring path a real board message would (useLiveBoard's
   applyReading). Automatically snaps to the closest of the 1000 real Kipu test records. */
export function SimulatedBoardPanel({
  isSimulating,
  reading,
  result,
  onStart,
  onChange,
  onUpdate,
  _onStop,
}) {
  const handleUpdate = onChange || onUpdate;

  // Auto-initialize simulation if opened so sliders are immediately draggable
  useEffect(() => {
    if (!isSimulating && onStart) {
      onStart(midpointReading());
    }
  }, [isSimulating, onStart]);

  const activeReading = reading || midpointReading();

  return (
    <div className="sim-board">
      <div className="sim-board-presets no-drag">
        {STAGED_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            className="sim-preset-btn no-drag"
            title={scenario.narrative}
            onClick={() => handleUpdate && handleUpdate(scenario.reading)}
          >
            {scenario.label}
          </button>
        ))}
      </div>

      {result?.matchedRecord && (
        <div className="sim-snap-info-box no-drag">
          <div className="sim-snap-header">
            <span className="sim-snap-badge">
              📍 Snapped: Real Kipu Case #{result.recordId}
            </span>
            <span className="sim-snap-similarity">
              {result.similarity}% Match
            </span>
          </div>
          <div className="sim-snap-detail">
            <span className="sim-snap-label">Ground Truth:</span>
            <strong className={result.label === 1 ? 'is-anomaly' : 'is-healthy'}>
              {result.label === 1 ? '⚠️ DEVIATION (Real Anomaly)' : '✓ HEALTHY (Normal)'}
            </strong>
          </div>
        </div>
      )}

      {SLIDER_FIELDS.map(({ key, label }) => {
        const { min, max, unit } = PHYSICAL_RANGES[key];
        const step = Math.max(0.1, (max - min) / 200);
        const currentValue = activeReading[key] ?? ((min + max) / 2);

        return (
          <div className="sim-slider-row" key={key}>
            <div className="sim-slider-label">
              <span>{label}</span>
              <strong>
                {Number(currentValue).toFixed(1)} {unit}
              </strong>
            </div>
            <input
              type="range"
              className="sim-slider no-drag"
              min={min}
              max={max}
              step={step}
              value={currentValue}
              onChange={(event) => {
                if (handleUpdate) {
                  handleUpdate({
                    ...activeReading,
                    [key]: Number(event.target.value),
                  });
                }
              }}
              aria-label={`Simulated ${label}`}
            />
          </div>
        );
      })}

      <div className="sim-board-footer no-drag">
        <button
          type="button"
          className="live-board-action-btn sim-preset-reset-btn no-drag"
          onClick={() => handleUpdate && handleUpdate(midpointReading())}
          title="Reset all 4 knobs to baseline midpoint"
        >
          ↺ Reset Knobs
        </button>
      </div>
    </div>
  );
}

