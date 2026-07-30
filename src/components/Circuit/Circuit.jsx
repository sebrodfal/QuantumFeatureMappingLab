import { C } from '../../data/constants';

/* Circuit diagram. Labels reflect exactly the gates used in qFeatures:
   RY rotations for encoding and for the product-dependent interaction
   terms, CNOT for ring entanglement, and CZ for opposite-qubit
   correlation. No RX / RZ / CRZ gates are used, so none are labeled. The
   measurement block only shows ⟨Z⟩ observables to keep the diagram clean. */
export function Circuit() {
  const width = 640;
  const height = 190;
  const x0 = 66;
  const dx = 46;
  const topPad = 46;
  const y = (q) => topPad + q * 30;

  const columns = [
    { type: 'gate', kind: 'encode' },
    { type: 'entangle', kind: 'cnot' },
    { type: 'gate', kind: 'interact' },
    { type: 'entangle', kind: 'cz' },
    { type: 'gate', kind: 'encode' },
    { type: 'entangle', kind: 'cnot' },
    { type: 'gate', kind: 'interact' },
    { type: 'entangle', kind: 'cz' },
    { type: 'gate', kind: 'encode' },
  ];

  const gateTitle = (kind, q) =>
    kind === 'encode' ? `RY(x${q})` : `RY(x${q} · x${(q + 1) % 4})`;

  const stageX = {
    encoding: x0,
    interaction: x0 + 3 * dx,
    measurement: x0 + 8 * dx + 46,
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        margin: '0 auto',
      }}
    >
      <text
        x={stageX.encoding}
        y="16"
        fontSize="11"
        fill={C.grey}
        letterSpacing="0.6"
      >
        SIGNAL ENCODING
      </text>
      <text
        x={stageX.interaction}
        y="16"
        fontSize="11"
        fill={C.grey}
        letterSpacing="0.6"
      >
        FEATURE INTERACTIONS
      </text>
      <text
        x={stageX.measurement - 30}
        y="16"
        fontSize="11"
        fill={C.quantumLight}
        letterSpacing="0.6"
      >
        MEASUREMENT
      </text>

      {[0, 1, 2, 3].map((q) => (
        <g key={q}>
          <text x="8" y={y(q) + 4} fontSize="12" fill={C.grey}>
            q{q}
          </text>
          <line
            x1="30"
            y1={y(q)}
            x2={stageX.measurement + 14}
            y2={y(q)}
            stroke={C.border}
          />
        </g>
      ))}

      {columns.map((column, i) => {
        const x = x0 + i * dx;

        if (column.type === 'entangle') {
          return [0, 1, 2, 3].map((q) => (
            <g key={`${i}-${q}`}>
              <line
                x1={x}
                y1={y(q)}
                x2={x}
                y2={y((q + 1) % 4)}
                stroke={C.interaction}
                opacity="0.65"
              >
                <title>{column.kind === 'cnot' ? 'CNOT' : 'CZ'}</title>
              </line>
              <circle cx={x} cy={y(q)} r="3.2" fill={C.interaction}>
                <title>{column.kind === 'cnot' ? 'CNOT' : 'CZ'}</title>
              </circle>
            </g>
          ));
        }

        return [0, 1, 2, 3].map((q) => (
          <rect
            key={`${i}-${q}`}
            x={x - 11}
            y={y(q) - 11}
            width="22"
            height="22"
            rx="4"
            fill={C.panel3}
            stroke={C.quantum}
          >
            <title>{gateTitle(column.kind, q)}</title>
          </rect>
        ));
      })}

      {[0, 1, 2, 3].map((q) => (
        <text
          key={`z-${q}`}
          x={stageX.measurement + 24}
          y={y(q) + 4}
          fontSize="12"
          fill={C.quantumLight}
        >
          ⟨Z{q}⟩
        </text>
      ))}
    </svg>
  );
}
