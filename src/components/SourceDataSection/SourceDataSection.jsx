import { MachineDiagram } from '../MachineDiagram/MachineDiagram';
import { SensorCard } from '../SensorCard/SensorCard';
import { RAW, UNITS } from '../../data/constants';

export function SourceDataSection({
  visibleSample,
  selectedSensors,
  sensorColors,
  alert = false,
  label = 0,
  mode = 'quantum',
  liveMode = false,
  sensorDisplayValues = null,
}) {
  return (
    <section className="card">
      <h2 className="section-title">1. Common Source of Industrial Data — Heavy Mining Shovel Telemetry</h2>
      <p className="section-description">
        Heavy electric rope shovels operate in high-impact mining environments where mechanical cable fatigue threatens critical operations. 
        Onboard sensors record four primary telemetry signals—measuring hoist load stress, crowd vibration, motor temperatures, and cumulative cable tension. 
        This raw telemetry stream serves as the shared starting point for both classical and quantum feature-mapped representations to predict structural cable rupture before catastrophic downtime occurs.
      </p>

      <div className="source-grid">
        <div>
          <span className="tag">Physical Asset: Electric Mining Rope Shovel</span>
          <MachineDiagram alert={alert} label={label} mode={mode} />
        </div>

        <div>
          <span className="tag">
            {liveMode
              ? 'Live Physical Reading (board)'
              : `Selected Machine Telemetry Record #${visibleSample + 1}`}
          </span>
          <div className="sensor-grid">
            {RAW.map((name, i) => (
              <SensorCard
                key={name}
                name={name}
                value={selectedSensors[i]}
                unit={UNITS[i]}
                color={sensorColors[i]}
                displayText={sensorDisplayValues ? sensorDisplayValues[i] : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="extraction-flow-container">
        <div className="flow-badge flow-badge-asset">
          <span className="flow-pulse-dot" />
          <strong>Electric Rope Shovel Asset</strong>
          <span className="flow-sub">Physical Telemetry Stream</span>
        </div>

        <div className="flow-connector">
          <span className="flow-label">Sensor Stream</span>
          <div className="flow-laser" />
        </div>

        <div className="flow-badge flow-badge-signals">
          <span className="flow-pulse-dot cyan" />
          <strong>4 Raw Signals</strong>
          <span className="flow-sub">Load, Vib, Temp, Tension</span>
        </div>

        <div className="flow-connector">
          <span className="flow-label">DQFM Encoding</span>
          <div className="flow-laser purple" />
        </div>

        <div className="flow-badge flow-badge-quantum">
          <span className="flow-pulse-dot purple" />
          <strong>Two Feature Spaces</strong>
          <span className="flow-sub">Classical vs. Quantum DQFM</span>
        </div>
      </div>
    </section>
  );
}
