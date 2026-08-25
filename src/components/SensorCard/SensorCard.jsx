import { SignalLine } from './SignalLine';

/* displayText, when given, overrides the default "scaled-value-as-percent"
   readout — used when Section 1 is driven by the Live Board (real or
   simulated knobs) to show real units (e.g. "437.5 kN") instead of the
   synthetic dataset's 0-100 convention. `value` still drives the
   SignalLine animation either way, since that only needs a roughly-[0,1]
   number, not a real unit. */
export function SensorCard({ name, value, unit, color, displayText }) {
  return (
    <div className="sensor-card">
      <div className="sensor-title">
        <span style={{ color }}>{name}</span>
        <span className="sensor-value-monospaced">{displayText ?? `${(value * 100).toFixed(0)} ${unit}`}</span>
      </div>
      <SignalLine value={value} color={color} />
    </div>
  );
}
