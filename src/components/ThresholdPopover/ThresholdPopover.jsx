export function ThresholdPopover({
  thresholdPopoverRef,
  popoverStyle,
  onClose,
}) {
  return (
    <div
      ref={thresholdPopoverRef}
      className="threshold-popover"
      role="dialog"
      aria-label="How the alert threshold is chosen"
      style={popoverStyle}
    >
      <div className="threshold-popover-header">
        <span>How the alert threshold is chosen</span>
        <button
          type="button"
          className="popover-close-button"
          onClick={onClose}
          aria-label="Close explanation"
        >
          ×
        </button>
      </div>

      <p>
        Target recall ≥ 80% is the detection goal, not a fixed 0.80 score.
        The classifier assigns every record a deviation score between 0 and
        1, and the validation set is used to find the score threshold that
        detects at least 80% of known deviations.
      </p>

      <p>
        Each representation can have a different threshold, because their
        score distributions differ. A record triggers an alert when its
        score reaches or exceeds that representation-specific threshold —
        this is exactly the threshold used to decide ALERT / NO ALERT for
        the selected record in each card. False alarms are measured at that
        same operating point.
      </p>
    </div>
  );
}
