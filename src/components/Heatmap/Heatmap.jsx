import { C } from '../../data/constants';
import { heatColor } from '../../utils/correlation';

/* Scalable Heatmap component with both left row labels and top column labels.
   Expanded layout provides larger cells and clear visibility for both Classical (4x4)
   and Quantum (7x7) feature dependency matrices. */
export function Heatmap({ matrix, labels, showValues = false }) {
  const n = matrix.length;
  
  // Margins sized for row labels on left and angled column labels on top
  const marginLeft = labels ? 88 : 16;
  const marginTop = labels ? 72 : 16;
  const marginRight = 32;
  const marginBottom = 16;

  const gridSize = 320;
  const cell = gridSize / n;
  const gridWidth = gridSize;
  const gridHeight = gridSize;

  const totalWidth = marginLeft + gridWidth + marginRight;
  const totalHeight = marginTop + gridHeight + marginBottom;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        overflow: 'visible',
      }}
    >
      {/* Top Column Labels (angled for clean alignment without overlap) */}
      {labels &&
        labels.map((label, j) => {
          const colX = marginLeft + j * cell + cell / 2;
          const colY = marginTop - 10;
          return (
            <text
              key={`col-${label}-${j}`}
              x={colX}
              y={colY}
              textAnchor="start"
              transform={`rotate(-35, ${colX}, ${colY})`}
              fontSize={n > 4 ? '11.5' : '12.5'}
              fontWeight="600"
              fill={C.classicalLight}
              fontFamily="Arial, sans-serif"
            >
              {label}
            </text>
          );
        })}

      {/* Grid Cells & Numerical Values */}
      {matrix.map((row, i) =>
        row.map((value, j) => {
          const isDiag = i === j;
          const rowLabel = labels ? labels[i] : `Var ${i + 1}`;
          const colLabel = labels ? labels[j] : `Var ${j + 1}`;
          const cellX = marginLeft + j * cell;
          const cellY = marginTop + i * cell;

          return (
            <g key={`${i}-${j}`}>
              <rect
                className="heat-cell"
                x={cellX}
                y={cellY}
                width={cell - 2}
                height={cell - 2}
                rx="4"
                fill={isDiag ? C.border : heatColor(value)}
                stroke="rgba(255,255,255,0.12)"
              >
                {!isDiag && (
                  <title>{`${rowLabel} × ${colLabel}: ${value.toFixed(2)}`}</title>
                )}
              </rect>

              {!isDiag && showValues && cell >= 32 && (
                <text
                  x={cellX + (cell - 2) / 2}
                  y={cellY + (cell - 2) / 2 + 5}
                  textAnchor="middle"
                  fontSize={cell > 55 ? '15' : '11'}
                  fontWeight={cell > 55 ? '700' : '600'}
                  fill="rgba(255,255,255,0.95)"
                  fontFamily="'JetBrains Mono', Arial, sans-serif"
                  pointerEvents="none"
                >
                  {value.toFixed(2)}
                </text>
              )}
            </g>
          );
        })
      )}

      {/* Left Row Labels */}
      {labels &&
        labels.map((label, i) => (
          <text
            key={`row-${label}-${i}`}
            x={marginLeft - 10}
            y={marginTop + i * cell + cell / 2 + 4.5}
            textAnchor="end"
            fontSize={n > 4 ? '11.5' : '12.5'}
            fontWeight="600"
            fill={C.grey}
            fontFamily="Arial, sans-serif"
          >
            {label}
          </text>
        ))}
    </svg>
  );
}
