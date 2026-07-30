import { C } from '../../data/constants';

/* Pure CSS animation: does not trigger React re-renders, so the
   pipeline computation never competes for resources. */
export function SignalLine({ value, color }) {
  const values = Array.from({ length: 32 }, (_, i) => {
    const base = 0.5 + 0.18 * Math.sin(i * 0.7);
    const variation = 0.12 * Math.sin(i * 1.6 + value * 8);
    return Math.max(
      0.08,
      Math.min(0.92, base + variation + (value - 0.5) * 0.3)
    );
  });

  const path = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 200;
      const y = 52 - v * 40;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 200 58" style={{ width: '100%', height: 58 }}>
      <path d="M 0 30 L 200 30" stroke={C.border} strokeWidth="1" />
      <path
        className="signal-path"
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
      />
    </svg>
  );
}
