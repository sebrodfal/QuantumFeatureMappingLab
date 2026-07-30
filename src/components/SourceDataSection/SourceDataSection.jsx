import { MachineDiagram } from '../MachineDiagram/MachineDiagram';
import { SensorCard } from '../SensorCard/SensorCard';
import { RAW, UNITS } from '../../data/constants';

export function SourceDataSection({ visibleSample, selectedSensors, sensorColors }) {
  return (
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
  );
}
