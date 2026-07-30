import { C } from '../../data/constants';

export function StickyControls({
  noise,
  onNoiseChange,
  visibleSample,
  visibleCount,
  selectedLabel,
  onSampleChange,
  showThresholdExplanation,
  onToggleThresholdExplanation,
  learnMoreButtonRef,
}) {
  return (
    <section className="card controls sticky-noise">
      <div className="noise-control-area">
        <div className="small-label">
          Plant Noise —{' '}
          <strong style={{ color: C.interaction }}>
            {Math.round((noise / 3) * 100)}%
          </strong>
        </div>

        <input
          className="noise-slider"
          type="range"
          min="0"
          max="3"
          step="0.1"
          value={noise}
          onChange={(event) => onNoiseChange(Number(event.target.value))}
          style={{ marginTop: 8 }}
        />
      </div>

      <div className="noise-explanation-area">
        <div className="small-label">Data Perturbation</div>
        <p>
          Increase synthetic plant noise to observe how signal structure,
          correlation, and separability evolve.
        </p>
      </div>

      <div className="record-control-area">
        <div className="small-label">Explore Data Record</div>
        <div className="record-summary-row">
          <span>Selected record #{visibleSample + 1}</span>
          <span
            className={
              selectedLabel === 0 ? 'healthy-status' : 'deviation-status'
            }
          >
            {selectedLabel === 0 ? 'HEALTHY' : 'DEVIATION'}
          </span>
        </div>

        <input
          className="explore-slider"
          type="range"
          min="0"
          max={visibleCount - 1}
          step="1"
          value={visibleSample}
          onChange={(event) => onSampleChange(Number(event.target.value))}
          aria-label="Select data record"
        />

        <p className="record-helper">
          The selected record is highlighted in yellow in both scatter
          plots.
        </p>
      </div>

      <div className="operating-policy">
        <div className="small-label">Operating Policy</div>
        <strong>Target recall ≥ 80%</strong>
        <p>
          Thresholds are calculated independently for each representation.
        </p>

        <button
          type="button"
          ref={learnMoreButtonRef}
          className="learn-more-button"
          onClick={onToggleThresholdExplanation}
          aria-expanded={showThresholdExplanation}
        >
          {showThresholdExplanation ? 'Hide details' : 'Learn more'}
          <span>{showThresholdExplanation ? '−' : '+'}</span>
        </button>
      </div>
    </section>
  );
}
