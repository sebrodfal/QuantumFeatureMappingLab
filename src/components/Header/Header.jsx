import { useState } from 'react';

export function Header() {
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="header">
      <div>
        <div className="brand-container">
          {!logoError ? (
            <img
              src="/nttdata-logo.png"
              alt="NTT DATA"
              className="brand-logo-img"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="brand">NTT DATA</div>
          )}
        </div>
        <h1>Digitalized Quantum Feature Extraction (DQFE)</h1>
      </div>

      <div className="subtitle">
        Industrial Mining Telemetry → Quantum Spin Hamiltonian Feature Mapping
        <br />→ Derived Multi-Body Observables for Failure Analytics & Cost Optimization
      </div>
    </header>
  );
}
