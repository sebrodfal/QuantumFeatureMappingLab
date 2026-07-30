import { SignalLine } from './SignalLine';

export function SensorCard({ name, value, unit, color }) {
  return (
    <div className="sensor-card">
      <div className="sensor-title">
        <span style={{ color }}>{name}</span>
        <span>
          {(value * 100).toFixed(0)} {unit}
        </span>
      </div>
      <SignalLine value={value} color={color} />
    </div>
  );
}
