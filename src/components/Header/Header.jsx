import { useState } from 'react';

export function Header() {
  const [nttLogoError, setNttLogoError] = useState(false);
  const [kipuLogoError, setKipuLogoError] = useState(false);

  return (
    <header className="header">
      <div>
        <div className="brand-container">
          <div className="brand-logos-row">
            {!nttLogoError ? (
              <img
                src="/nttdata-logo.png"
                alt="NTT DATA"
                className="brand-logo-img ntt-logo"
                onError={() => setNttLogoError(true)}
              />
            ) : (
              <div className="brand">NTT DATA</div>
            )}

            {!kipuLogoError ? (
              <img
                src="/kipu-logo.png"
                alt="Kipu Quantum"
                className="brand-logo-img kipu-logo"
                onError={() => setKipuLogoError(true)}
              />
            ) : (
              <div className="brand brand-kipu">KIPU QUANTUM</div>
            )}
          </div>
        </div>
        <h1>Digitized Quantum Feature Extraction (DQFE)</h1>
      </div>

      <div className="subtitle">
        Industrial Mining Telemetry → Quantum Spin Hamiltonian Feature Mapping
        <br />→ Derived Multi-Body Observables for Failure Analytics & Cost Optimization
      </div>
    </header>
  );
}

