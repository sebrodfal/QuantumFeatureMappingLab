import { Heatmap } from '../Heatmap/Heatmap';
import { HeatmapLegend } from '../Heatmap/HeatmapLegend';
import { ScatterCard } from '../Scatter/ScatterCard';

/* Shared layout for the Classical (2A) and Quantum (2B) representation
   cards. Both cards are structurally identical — only the data, labels,
   and accent colors differ — so a single parametrized component renders
   both, avoiding a ~150-line duplicate JSX block. */
export function FeatureSpaceCard({
  variant,
  borderColor,
  title,
  description,
  correlation,
  chips,
  chipCaption,
  heatmap,
  scatter,
  metric,
  validation,
  selected,
}) {
  const frameClass = `${variant}-frame`;

  return (
    <section
      className={`card side-card ${variant === 'quantum' ? 'quantum-card' : ''}`}
      style={{ borderTop: `3px solid ${borderColor}` }}
    >
      <div className="side-card-header">
        <h2 className="section-title">{title}</h2>
        <p className="section-description">{description}</p>
      </div>

      <div className={`representation-map-card ${frameClass}`}>
        <div className="heatmap-header">
          <div>
            <div className="heatmap-title">Feature Dependency Matrix</div>
            <div className="heatmap-subtitle">
              Correlation structure across the feature space
            </div>
          </div>
          <div
            className="heatmap-average-correlation"
            style={{ color: correlation.color }}
          >
            <span>Avg. |ρ|</span>
            <strong>{correlation.value.toFixed(2)}</strong>
          </div>
        </div>

        <div className="chip-row">
          {chips.map((chip) => (
            <span
              className={`chip ${chip.active ? 'active-quantum' : ''}`}
              key={chip.label}
            >
              {chip.label}
            </span>
          ))}
        </div>
        <div className="chip-caption">{chipCaption}</div>

        <div className="heatmap-matrix-viewport">
          <Heatmap
            matrix={heatmap.matrix}
            labels={heatmap.labels}
            showValues={heatmap.showValues}
          />
        </div>

        <HeatmapLegend />
      </div>

      <ScatterCard
        frameClass={frameClass}
        accent={scatter.accent}
        xLabel={scatter.xLabel}
        yLabel={scatter.yLabel}
        points={scatter.points}
        labels={scatter.labels}
        highlight={selected.index}
        note={scatter.note}
      />

      <div className="metric-box">
        <div className="small-label">{metric.label}</div>
        <div className="metric-value" style={{ color: metric.color }}>
          Avg. Redundancy |ρ|: {correlation.value.toFixed(2)}
        </div>
        <div className="metric-description">{metric.description}</div>
      </div>

      <div className="validation-card">
        <div className="validation-global">
          <div className="small-label">Global Validation</div>
          <div className="global-metrics-row">
            <div>
              <div className="global-metric-label">AUC</div>
              <div
                className="global-metric-value"
                style={{ color: validation.color }}
              >
                {validation.auc.toFixed(3)}
              </div>
            </div>
            <div>
              <div className="global-metric-label">False alarms</div>
              <div
                className="global-metric-value"
                style={{ color: validation.color }}
              >
                {(validation.fpr * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        <div className="validation-divider" />

        <div className="selected-record-decision">
          <div className="selected-record-heading">
            <span className="small-label">
              Selected Record #{selected.index + 1}
            </span>
            <span
              className="known-condition"
              style={{ color: selected.conditionColor }}
            >
              {selected.label ? 'DEVIATION' : 'HEALTHY'}
            </span>
          </div>

          <div className="selected-record-content">
            <div className="record-score-block">
              <span>Deviation score</span>
              <strong>{selected.score.toFixed(2)}</strong>
            </div>

            <div className="record-threshold-block">
              <span>Operating threshold</span>
              <strong>{selected.threshold.toFixed(2)}</strong>
            </div>

            <div className="decision-badge-wrapper">
              <div
                className={`decision-badge ${
                  selected.alert ? 'alert' : 'no-alert'
                }`}
              >
                {selected.alert ? 'ALERT' : 'NO ALERT'}
              </div>
              <div
                className="decision-status"
                style={{ color: selected.status.color }}
              >
                {selected.status.label}
              </div>
            </div>
          </div>
        </div>

        <div className="validation-note">
          Threshold selected to detect at least 80% of known deviations.
        </div>
      </div>
    </section>
  );
}
