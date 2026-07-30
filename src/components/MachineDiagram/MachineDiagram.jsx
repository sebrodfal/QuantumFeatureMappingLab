import { C } from '../../data/constants';

export function MachineDiagram() {
  return (
    <svg viewBox="0 0 500 170" style={{ width: '100%', display: 'block' }}>
      <line x1="95" y1="86" x2="415" y2="86" stroke={C.grey} strokeWidth="5" />
      <circle
        cx="150"
        cy="86"
        r="48"
        fill={C.panel2}
        stroke={C.interaction}
        strokeWidth="3"
      />
      <circle
        className="pulse-ring"
        cx="150"
        cy="86"
        r="17"
        fill={C.navy}
        stroke={C.interaction}
        strokeWidth="2"
      />

      <rect
        x="270"
        y="46"
        width="90"
        height="80"
        rx="10"
        fill={C.panel2}
        stroke={C.classicalLight}
        strokeWidth="3"
      />
      <circle
        cx="315"
        cy="86"
        r="22"
        fill={C.navy}
        stroke={C.classicalLight}
        strokeWidth="2"
      />
      <path
        className="spin-blade"
        d="M 315 64 L 330 86 L 315 108 L 300 86 Z"
        fill={C.classical}
        style={{ transformOrigin: '315px 86px' }}
      />

      <circle
        cx="220"
        cy="86"
        r="20"
        fill={C.panel2}
        stroke={C.deviation}
        strokeWidth="3"
      />
      <circle className="pulse-dot" cx="220" cy="86" r="7" fill={C.deviation} />

      <line
        x1="150"
        y1="38"
        x2="150"
        y2="18"
        stroke={C.interaction}
        strokeWidth="2"
      />
      <text
        x="150"
        y="13"
        textAnchor="middle"
        fill={C.interaction}
        fontSize="12"
      >
        Load
      </text>

      <line
        x1="220"
        y1="108"
        x2="220"
        y2="145"
        stroke={C.deviation}
        strokeWidth="2"
      />
      <text
        x="220"
        y="163"
        textAnchor="middle"
        fill={C.deviation}
        fontSize="12"
      >
        Vibration
      </text>

      <line
        x1="315"
        y1="46"
        x2="315"
        y2="18"
        stroke={C.warning}
        strokeWidth="2"
      />
      <text x="315" y="13" textAnchor="middle" fill={C.warning} fontSize="12">
        Temperature
      </text>

      <line
        x1="105"
        y1="114"
        x2="66"
        y2="142"
        stroke={C.classicalLight}
        strokeWidth="2"
      />
      <text
        x="52"
        y="157"
        textAnchor="middle"
        fill={C.classicalLight}
        fontSize="12"
      >
        Current
      </text>

      <text x="150" y="91" textAnchor="middle" fill={C.white} fontSize="11">
        MOTOR
      </text>
      <text x="315" y="153" textAnchor="middle" fill={C.grey} fontSize="11">
        PUMP
      </text>
    </svg>
  );
}
