import { Circuit } from '../Circuit/Circuit';

export function QuantumCircuitSection({ circuitOpen, onToggle }) {
  return (
    <section className="card circuit-card">
      <button
        type="button"
        className="collapsible-toggle circuit-toggle-btn"
        onClick={onToggle}
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
  );
}


