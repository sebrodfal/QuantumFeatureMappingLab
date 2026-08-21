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

            <a href="#cloud-benchmark" className="cloud-verified-pill" style={{ textDecoration: 'none' }}>
              <span className="live-status-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#00E5FF', display: 'inline-block', boxShadow: '0 0 8px #00E5FF' }} />
              Cloud Solver Verified · +38.3% AP
            </a>
          </div>
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

