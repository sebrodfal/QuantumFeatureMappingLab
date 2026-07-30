import { C } from '../../data/constants';
import { heatColor } from '../../utils/correlation';

/* Fixed outer viewBox regardless of matrix size, so the Classical (4x4)
   and Quantum (14x14) heatmaps occupy the same total visual area — only
   the cell size differs. The matrix is centered both horizontally
   (symmetric left/right margins) and vertically within the box, so it
   lines up with the centered color legend below it. Shows values inside
   cells when there is room (classical); otherwise relies on a native SVG
   <title> tooltip per cell so the quantum matrix never gets cluttered
   with tiny numbers. */
export function Heatmap({ matrix, labels, showValues = false }) {
  const n = matrix.length;
  const size = 320;
  const margin = labels ? 49 : 10;
  const cell = (size - margin * 2) / n;
  const matrixH = n * cell;
  const yOffset = (size - matrixH) / 2;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        overflow: 'visible',
      }}
    >
      {matrix.map((row, i) =>
        row.map((value, j) => {
          const isDiag = i === j;
          const rowLabel = labels ? labels[i] : `Var ${i + 1}`;
          const colLabel = labels ? labels[j] : `Var ${j + 1}`;

          return (
            <g key={`${i}-${j}`}>
              <rect
                className="heat-cell"
                x={margin + j * cell}
                y={yOffset + i * cell}
                width={cell - 2}
                height={cell - 2}
                rx="3"
                fill={isDiag ? C.border : heatColor(value)}
                stroke="rgba(255,255,255,0.10)"
              >
                {!isDiag && (
                  <title>{`${rowLabel} × ${colLabel}: ${value.toFixed(
                    2
                  )}`}</title>
                )}
              </rect>

              {!isDiag && showValues && cell > 34 && (
                <text
                  x={margin + j * cell + (cell - 2) / 2}
                  y={yOffset + i * cell + (cell - 2) / 2 + 5}
                  textAnchor="middle"
                  fontSize={cell > 60 ? '16' : '13'}
                  fill="rgba(255,255,255,0.92)"
                  fontFamily="Arial"
                  pointerEvents="none"
                >
                  {value.toFixed(2)}
                </text>
              )}
            </g>
          );
        })
      )}

      {labels &&
        labels.map((label, i) => (
          <text
            key={`row-${label}`}
            x={margin - 7}
            y={yOffset + i * cell + cell / 2 + 4}
            textAnchor="end"
            fontSize="11"
            fill={C.grey}
            fontFamily="Arial"
          >
            {label}
          </text>
        ))}
    </svg>
  );
}
