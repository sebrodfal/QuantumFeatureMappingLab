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
            <div className="heatmap-title-row">
              <span className="heatmap-title">Feature Dependency Matrix</span>
              <span
                className="feature-count-badge"
                style={{
                  color: correlation.color,
                  borderColor: correlation.color,
                }}
              >
                {variant === 'classical'
                  ? `Source Variables: ${heatmap.matrix.length} (${heatmap.matrix.length} × ${heatmap.matrix.length})`
                  : `Derived Quantum Features: ${heatmap.matrix.length} (${heatmap.matrix.length} × ${heatmap.matrix.length})`}
              </span>
            </div>
            <div className="heatmap-subtitle">
              {variant === 'classical'
                ? `Correlation structure across ${heatmap.matrix.length} original telemetry signals`
                : `Correlation structure across ${heatmap.matrix.length} derived quantum observables`}
            </div>
          </div>
          <div
            className="heatmap-average-correlation"
            style={{ color: correlation.color }}
          >
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

      <div className="validation-card">
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
