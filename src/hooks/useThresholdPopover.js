import { useEffect, useRef, useState } from 'react';

export function useThresholdPopover() {
  const [showThresholdExplanation, setShowThresholdExplanation] =
    useState(false);
  const [popoverStyle, setPopoverStyle] = useState({});

  const learnMoreButtonRef = useRef(null);
  const thresholdPopoverRef = useRef(null);

  // Position the popover above the button if there's room, otherwise below.
  // Recomputed on open, resize, and scroll so it tracks the sticky bar.
  useEffect(() => {
    if (!showThresholdExplanation) return undefined;

    const updatePosition = () => {
      const btn = learnMoreButtonRef.current;
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const popoverWidth = Math.min(380, window.innerWidth - 32);
      const measuredHeight = thresholdPopoverRef.current
        ? thresholdPopoverRef.current.offsetHeight
        : 210;
      const gap = 10;

      let top;
      if (rect.top > measuredHeight + gap + 12) {
        top = rect.top - measuredHeight - gap;
      } else {
        top = rect.bottom + gap;
      }
      top = Math.max(8, Math.min(top, window.innerHeight - measuredHeight - 8));

      let left = rect.left;
      left = Math.min(left, window.innerWidth - popoverWidth - 16);
      left = Math.max(left, 16);

      setPopoverStyle({
        top: `${top}px`,
        left: `${left}px`,
        width: `${popoverWidth}px`,
      });
    };

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showThresholdExplanation]);

  // Close on Escape or on click outside the popover / button.
  useEffect(() => {
    if (!showThresholdExplanation) return undefined;

    const handleKey = (event) => {
      if (event.key === 'Escape') setShowThresholdExplanation(false);
    };

    const handleClick = (event) => {
      const inPopover = thresholdPopoverRef.current?.contains(event.target);
      const inButton = learnMoreButtonRef.current?.contains(event.target);
      if (!inPopover && !inButton) setShowThresholdExplanation(false);
    };

    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [showThresholdExplanation]);

  return {
    showThresholdExplanation,
    setShowThresholdExplanation,
    popoverStyle,
    learnMoreButtonRef,
    thresholdPopoverRef,
  };
}
