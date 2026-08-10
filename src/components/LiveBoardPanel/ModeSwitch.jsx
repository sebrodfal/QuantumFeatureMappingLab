/* Prominent Classical/Quantum switch (docs/demo-fisico-spec.md §5.2).
   Always clickable — a board's `mode` field only syncs the starting
   position (see useLiveBoard's sync effect), it never locks the control,
   so you can always override it by hand during a simulation or a demo.
   Whichever side currently has an active alert blinks red, inviting the
   visitor to flip to it. */
export function ModeSwitch({ mode, isAuto, onSelect, classicalAlert, quantumAlert }) {
  const isQuantum = mode === 'quantum';

  return (
    <div className="mode-switch">
      <button
        type="button"
        className={[
          'mode-switch-label',
          !isQuantum && 'is-active',
          classicalAlert && 'is-alerting',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => onSelect('classical')}
      >
        Classical
      </button>

      <button
        type="button"
        className={`mode-switch-track ${isQuantum ? 'is-quantum' : 'is-classical'}`}
        onClick={() => onSelect(isQuantum ? 'classical' : 'quantum')}
        aria-label={`Switch to ${isQuantum ? 'Classical' : 'Quantum'}`}
        role="switch"
        aria-checked={isQuantum}
      >
        <span className="mode-switch-thumb" />
      </button>

      <button
        type="button"
        className={[
          'mode-switch-label',
          isQuantum && 'is-active',
          quantumAlert && 'is-alerting',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => onSelect('quantum')}
      >
        Quantum
      </button>

      {isAuto && <span className="mode-switch-source">synced from board</span>}
    </div>
  );
}
