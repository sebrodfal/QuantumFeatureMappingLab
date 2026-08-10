import { useState, useRef, useEffect } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside the expanded panel
  useEffect(() => {
    if (!isExpanded) return undefined;

    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        !event.target.closest('.threshold-popover')
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  const noisePercentage = Math.round((noise / 3) * 100);

  return (
    <div className="floating-lab-controls-container" ref={containerRef}>
      {!isExpanded ? (
        <button
          type="button"
          className="floating-fixed-btn"
          onClick={() => setIsExpanded(true)}
          aria-label="Open Lab Controls"
          title="Click to adjust plant noise & explore records"
        >
          <span className="btn-icon">🎛️</span>
          <span className="btn-title">Lab Controls</span>
          <span className="btn-badge">{noisePercentage}% Noise</span>
          <span className="btn-arrow">▲</span>
        </button>
      ) : (
        <section className="card controls floating-full-panel">
          <div className="panel-top-bar">
            <div className="panel-top-title">
              <span className="title-icon">🎛️</span>
              <strong>Lab Parameters & Data Exploration</strong>
            </div>
            <button
              type="button"
              className="panel-close-btn"
              onClick={() => setIsExpanded(false)}
              aria-label="Close controls"
            >
              <span>Minimize</span>
              <span className="close-x">✕</span>
            </button>
          </div>

          <div className="controls-grid-body">
            <div className="noise-control-area">
              <div className="small-label">
                Plant Noise —{' '}
                <strong style={{ color: C.interaction }}>
                  {noisePercentage}%
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
          </div>
        </section>
      )}
    </div>
  );
}



