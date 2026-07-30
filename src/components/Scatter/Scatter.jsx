import { C } from '../../data/constants';

/* colorMode="class": point color reflects the known synthetic-twin
   condition (healthy / deviation), NOT the classifier output. Selected
   point always gets a `selected`-colored ring; class color is preserved
   underneath. */
export function Scatter({ points, xLabel, yLabel, accent, highlight, labels }) {
  const width = 520;
  const height = 340;
  const padding = 46;

  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);

  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);

  const plotW = width - padding - 16;
  const plotH = height - padding - 14;

  const sx = (value) =>
    padding + ((value - xMin) / (xMax - xMin + 1e-9)) * plotW;
  const sy = (value) =>
    height - padding - ((value - yMin) / (yMax - yMin + 1e-9)) * plotH;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        overflow: 'visible',
      }}
    >
      <rect
        x={padding}
        y="10"
        width={plotW}
        height={plotH}
        fill="#0A1424"
        stroke={accent}
        strokeOpacity="0.5"
      />

      {gridLines.map((t) => (
        <line
          key={`gx-${t}`}
          x1={padding + t * plotW}
          y1={10}
          x2={padding + t * plotW}
          y2={10 + plotH}
          stroke="rgba(255,255,255,0.06)"
        />
      ))}

      {gridLines.map((t) => (
        <line
          key={`gy-${t}`}
          x1={padding}
          y1={10 + t * plotH}
          x2={padding + plotW}
          y2={10 + t * plotH}
          stroke="rgba(255,255,255,0.06)"
        />
      ))}

      {points.map((point, i) => {
        const selectedPoint = i === highlight;
        const fill = labels?.[i] ? C.deviation : C.healthy;

        return (
          <circle
            key={i}
            cx={sx(point[0])}
            cy={sy(point[1])}
            r={selectedPoint ? 8.5 : 4}
            fill={fill}
            stroke={selectedPoint ? C.selected : 'none'}
            strokeWidth={selectedPoint ? 3 : 0}
            opacity={selectedPoint ? 1 : 0.74}
            style={
              selectedPoint
                ? { filter: `drop-shadow(0 0 6px ${C.selected})` }
                : undefined
            }
          />
        );
      })}

      <text
        x={padding + plotW / 2}
        y={height - 12}
        textAnchor="middle"
        fontSize="13"
        fill={C.grey}
        fontFamily="Arial"
      >
        {xLabel}
      </text>

      <text
        x="16"
        y={10 + plotH / 2}
        textAnchor="middle"
        fontSize="13"
        fill={C.grey}
        fontFamily="Arial"
        transform={`rotate(-90 16 ${10 + plotH / 2})`}
      >
        {yLabel}
      </text>
    </svg>
  );
}
