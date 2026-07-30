import { C } from '../../data/constants';

export function FeatureSpaceComparison({
  rawCorrelation,
  quantumCorrelation,
  aucDelta,
  falseAlarmReduction,
}) {
  return (
    <section className="card">
      <h2 className="section-title">3. Feature Space Comparison</h2>
      <p className="section-description">
        Same physical records, two feature representations, and validation at
        a comparable operating target.
      </p>

      <div className="metrics-subtitle">Feature Space</div>
      <div className="evaluation-grid">
        <div className="evaluation-card">
          <div className="small-label">Source Variables</div>
          <div
            className="evaluation-value"
            style={{ color: C.classicalLight }}
          >
            4
          </div>
        </div>

        <div className="evaluation-card">
          <div className="small-label">Derived Quantum Features</div>
          <div className="evaluation-value" style={{ color: C.quantumLight }}>
            14
          </div>
        </div>

        <div className="evaluation-card">
          <div className="small-label">Representation Expansion</div>
          <div className="evaluation-value" style={{ color: C.interaction }}>
            3.5×
          </div>
        </div>

        <div className="evaluation-card">
          <div className="small-label">Avg. Redundancy |ρ|</div>
          <div
            className="evaluation-value"
            style={{ color: C.selected, fontSize: 17 }}
          >
            {rawCorrelation.toFixed(2)} → {quantumCorrelation.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="metrics-subtitle">Downstream Validation</div>
      <div className="evaluation-grid three">
        <div className="evaluation-card">
          <div className="small-label">AUC Improvement</div>
          <div className="evaluation-value" style={{ color: C.positive }}>
            {aucDelta >= 0 ? '+' : ''}
            {aucDelta.toFixed(1)} pts
          </div>
        </div>

        <div className="evaluation-card">
          <div className="small-label">False Alarms Avoided</div>
          <div className="evaluation-value" style={{ color: C.positive }}>
            −{falseAlarmReduction.toFixed(0)}%
          </div>
        </div>

        <div className="evaluation-card">
          <div className="small-label">Target Recall</div>
          <div className="evaluation-value" style={{ color: C.grey }}>
            ≥ 80%
          </div>
        </div>
      </div>

      <div className="eval-footnote">
        The alert threshold is calculated separately for each representation
        to detect at least 80% of known deviations. False alarm rates are then
        compared at that operating target.
      </div>
    </section>
  );
}
