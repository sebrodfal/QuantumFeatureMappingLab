import { useState, useEffect, useRef } from 'react';
import { CloudBenchmarkSection } from '../CloudBenchmarkSection/CloudBenchmarkSection';

export function QuantumCircuitSection({ circuitOpen, onToggle }) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasExecuted, setHasExecuted] = useState(false);
  const [stageText, setStageText] = useState('');
  const intervalRef = useRef(null);

  const startExecution = () => {
    setIsExecuting(true);
    setProgress(0);
    setStageText('Phase 1/3: Encoding 4 physical signals into multi-qubit Spin Hamiltonian H(x)...');

    if (intervalRef.current) clearInterval(intervalRef.current);

    const startTime = Date.now();
    const duration = 1400; // 1.4s satisfying tactile execution

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 30) {
        setStageText('Phase 1/3: Encoding 4 physical signals into multi-qubit Spin Hamiltonian H(x)...');
      } else if (pct < 70) {
        setStageText('Phase 2/3: Executing Trotterized Counterdiabatic Evolution on DQFE Core...');
      } else if (pct < 100) {
        setStageText('Phase 3/3: Measuring 14 Multi-Body Observables ⟨Zᵢ⟩, ⟨Xᵢ⟩, ⟨ZᵢZⱼ⟩ across Hilbert Space...');
      } else {
        setStageText('✓ Execution Complete — Derived Quantum Observables Extracted!');
        clearInterval(intervalRef.current);
        setIsExecuting(false);
        setHasExecuted(true);
      }
    }, 30);
  };

  const handleMainButtonClick = () => {
    if (!circuitOpen) {
      onToggle();
      if (!hasExecuted) {
        startExecution();
      }
    } else {
      onToggle();
    }
  };

  const handleReRun = (e) => {
    e.stopPropagation();
    startExecution();
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <section className="card kq-pipeline-card">
      <div className="kq-toggle-container">
        <button
          type="button"
          className={`kq-gold-btn ${circuitOpen ? 'kq-gold-btn-active' : ''} ${isExecuting ? 'kq-gold-btn-loading' : ''}`}
          onClick={handleMainButtonClick}
          disabled={isExecuting}
        >
          <span className="kq-btn-icon">{isExecuting ? '⏳' : '⚡'}</span>
          <span className="kq-btn-text">
            {isExecuting
              ? 'Executing DQFE Pipeline...'
              : circuitOpen
              ? '▲ Hide DQFE Preliminary Insights'
              : '⚡ Run Digitized Counterdiabatic DQFE Engine — Reveal Key Insights'}
          </span>
          <span className="kq-btn-badge">DQFE ENGINE</span>
        </button>

        {circuitOpen && hasExecuted && !isExecuting && (
          <button
            type="button"
            className="kq-rerun-btn"
            onClick={handleReRun}
            title="Re-run the feature extraction pipeline"
          >
            ↻ Re-Run Pipeline
          </button>
        )}
      </div>

      {circuitOpen && (
        <div className="kq-pipeline-body">
          {/* Animated Loading Bar during execution */}
          {isExecuting && (
            <div className="kq-progress-wrapper">
              <div className="kq-progress-header">
                <div className="kq-progress-title">
                  <span className="kq-pulse-dot" />
                  Digitized Counterdiabatic DQFE Engine Active
                </div>
                <div className="kq-progress-percentage mono-val">{progress}%</div>
              </div>

              <div className="kq-progress-bar-track">
                <div
                  className="kq-progress-bar-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="kq-progress-stage-text mono-val">
                {stageText}
              </div>
            </div>
          )}

          {/* Results revealed after execution */}
          {hasExecuted && !isExecuting && (
            <div className="kq-results-container">
              <div className="kq-results-banner">
                <div className="kq-banner-pill">PRELIMINARY HIGHLIGHTS</div>
                <h3 className="kq-results-title">
                  Digitized Counterdiabatic DQFE — Key Preliminary Insights
                </h3>
                <p className="kq-results-subtitle">
                  High-dimensional quantum state evolution transforms noisy industrial telemetry into decorrelated, high-entropy observables before classical classification.
                </p>
              </div>

              <CloudBenchmarkSection />
            </div>
          )}
        </div>
      )}
    </section>
  );
}