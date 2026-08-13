import { C } from '../../data/constants';

export function FeatureSpaceComparison({
  rawCorrelation,
  quantumCorrelation,
  aucDelta,
  falseAlarmReduction,
}) {
  const redundancyReduction =
    rawCorrelation > 0
      ? ((rawCorrelation - quantumCorrelation) / rawCorrelation) * 100
      : 0;

  return (
    <section className="card comparison-section">
      <h2 className="section-title">3. Enhanced Model Performance & Impact</h2>
      <p className="section-description">
        Same physical records, two feature representations, and validation at
        a comparable operating target.
      </p>

      <div className="causal-chain-grid">
        <div className="evaluation-card causal-step">
          <div className="causal-step-num">STEP 1</div>
          <div className="small-label">Feature Expansion</div>
          <div className="evaluation-value mono-val" style={{ color: C.interaction }}>
            3.5×
          </div>
          <div className="evaluation-subtext">
            4 raw signals <span className="arrow">→</span> 14 derived observables
          </div>
        </div>

        <div className="evaluation-card causal-step">
          <div className="causal-step-num">STEP 2</div>
          <div className="small-label">Redundancy Reduction</div>
          <div className="evaluation-value mono-val" style={{ color: C.selected }}>
            −{redundancyReduction.toFixed(0)}%
          </div>
          <div className="evaluation-subtext">
            {rawCorrelation.toFixed(2)} <span className="arrow">→</span> {quantumCorrelation.toFixed(2)} avg correlation |ρ|
          </div>
        </div>

        <div className="evaluation-card causal-step">
          <div className="causal-step-num">STEP 3</div>
          <div className="small-label">ROC AUC Enhancement</div>
          <div className="evaluation-value mono-val" style={{ color: C.positive }}>
            {aucDelta >= 0 ? '+' : ''}
            {aucDelta.toFixed(1)} pts
          </div>
          <div className="evaluation-subtext">
            Greater feature space separability
          </div>
        </div>

        <div className="evaluation-card causal-step highlight-step">
          <div className="causal-step-num">STEP 4</div>
          <div className="small-label">False Alarms Avoided</div>
          <div className="evaluation-value mono-val" style={{ color: C.positive }}>
            −{falseAlarmReduction.toFixed(0)}%
          </div>
          <div className="evaluation-subtext">
            Fewer unneeded downtime interruptions
          </div>
        </div>
      </div>

      <div className="eval-footnote">
        Operating thresholds are calibrated independently per representation to achieve a target recall of ≥ 80%. Metrics reflect operational false alarm rate reduction at this fixed detection benchmark.
      </div>
    </section>
  );
}


