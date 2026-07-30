import { Scatter } from './Scatter';

/* Single shared layout for both scatter plots so Classical and Quantum are
   guaranteed to have identical structure, size, and alignment. */
export function ScatterCard({
  frameClass,
  accent,
  xLabel,
  yLabel,
  points,
  labels,
  highlight,
  note,
}) {
  return (
    <div className={`chart-frame scatter-card ${frameClass}`}>
      <div className="scatter-card-header">
        <div>
          <div className="small-label">Record Distribution</div>
          <div className="scatter-subtitle" title={`${xLabel} × ${yLabel}`}>
            {xLabel} × {yLabel}
          </div>
        </div>

        <div className="scatter-inline-legend">
          <span>
            <i className="legend-dot healthy-dot" />
            Healthy
          </span>
          <span>
            <i className="legend-dot deviation-dot" />
            Deviation
          </span>
          <span>
            <i className="legend-ring" />
            Selected
          </span>
        </div>
      </div>

      <div className="scatter-caption">
        Each point represents one synthetic operating record.
      </div>

      <div className="scatter-svg-wrap">
        <Scatter
          points={points}
          labels={labels}
          xLabel={xLabel}
          yLabel={yLabel}
          accent={accent}
          highlight={highlight}
        />
      </div>

      <div className="scatter-note">{note}</div>
    </div>
  );
}
