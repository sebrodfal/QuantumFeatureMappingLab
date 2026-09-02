import { STAGED_SCENARIOS } from '../../data/stagedScenarios.js';

/* First, default tab of the Live Board panel — a short, client-facing list
   of the 4 curated cases (docs/curated-cases.json), one click each. Kept
   deliberately minimal (label only, narrative on hover) so the panel reads
   as a quick-access remote, not a technical control surface. Uses the same
   engage-or-start scoring path as the sliders in SimulatedBoardPanel, so
   clicking a case is functionally identical to what it always was — just
   moved out of the "Advanced" tab into its own front-and-center view. */
export function KnownCasesPanel({ isSimulating, onStart, onUpdate }) {
  const engage = (reading) => {
    if (!isSimulating && onStart) {
      onStart(reading);
    } else if (onUpdate) {
      onUpdate(reading);
    }
  };

  return (
    <div className="known-cases-list no-drag">
      {STAGED_SCENARIOS.map((scenario) => (
        <button
          key={scenario.id}
          type="button"
          className="known-case-btn no-drag"
          title={scenario.narrative}
          onClick={() => engage(scenario.reading)}
        >
          {scenario.label}
        </button>
      ))}
    </div>
  );
}
