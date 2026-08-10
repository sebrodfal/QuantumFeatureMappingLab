import { C } from '../../data/constants';

const ALERT_COLOR = C.deviation;

/* alert: when true, the cables and sensor callouts switch from their normal
   accent colors to a single alert red, and the hoist cable animation speeds
   up — driven by classicalAlert/quantumAlert (whichever the physical
   switch currently selects) from the live board. See
   docs/demo-fisico-spec.md §5.4. Reuses the exact filter/animation
   technique already in this SVG; no new mechanism introduced. */
export function MachineDiagram({ alert = false }) {
  return (
    <svg viewBox="0 0 540 258" style={{ width: '100%', display: 'block', overflow: 'visible' }}>
      <defs>
        {/* Glow Filters */}
        <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="glow-orange" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="glow-alert" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Embedded CSS Animations */}
        <style>{`
          @keyframes cableDash {
            0% { stroke-dashoffset: 20; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes pulseRing {
            0% { r: 12px; opacity: 0.9; stroke-width: 2px; }
            50% { r: 24px; opacity: 0.3; stroke-width: 1px; }
            100% { r: 30px; opacity: 0; stroke-width: 0.5px; }
          }
          @keyframes spinSheave {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes signalFlow {
            0% { stroke-dashoffset: 30; opacity: 0.3; }
            50% { opacity: 1; }
            100% { stroke-dashoffset: 0; opacity: 0.3; }
          }
          @keyframes labelGlow {
            0%, 100% { filter: drop-shadow(0 0 2px rgba(139,233,253,0.4)); }
            50% { filter: drop-shadow(0 0 6px rgba(139,233,253,0.9)); }
          }
          @keyframes alertPulse {
            0%, 100% { opacity: 0.55; }
            50% { opacity: 1; }
          }

          .anim-cable {
            stroke-dasharray: 6 4;
            animation: cableDash 1.2s linear infinite;
          }
          .anim-cable.alert-cable {
            animation: cableDash 0.4s linear infinite;
          }
          .anim-ring-1 { animation: pulseRing 2s ease-out infinite; }
          .anim-ring-2 { animation: pulseRing 2s ease-out infinite 0.5s; }
          .anim-ring-3 { animation: pulseRing 2s ease-out infinite 1s; }
          .anim-ring-4 { animation: pulseRing 2s ease-out infinite 1.5s; }

          .anim-sheave {
            transform-origin: 380px 65px;
            animation: spinSheave 4s linear infinite;
          }
          .anim-signal-line {
            stroke-dasharray: 4 4;
            animation: signalFlow 1.5s linear infinite;
          }
          .anim-label-box {
            animation: labelGlow 3s ease-in-out infinite;
          }
          .alert-flash {
            animation: alertPulse 0.6s ease-in-out infinite;
          }
        `}</style>
      </defs>

      {/* Ground Line */}
      <line x1="20" y1="215" x2="520" y2="215" stroke={C.border} strokeWidth="2" strokeDasharray="4 4" />

      {/* Crawler Tracks Base */}
      <rect x="50" y="190" width="130" height="25" rx="8" fill={C.panel2} stroke={C.border} strokeWidth="2" />
      <circle cx="70" cy="202" r="7" fill={C.navy} stroke={C.grey} strokeWidth="1.5" />
      <circle cx="95" cy="202" r="7" fill={C.navy} stroke={C.grey} strokeWidth="1.5" />
      <circle cx="115" cy="202" r="7" fill={C.navy} stroke={C.grey} strokeWidth="1.5" />
      <circle cx="135" cy="202" r="7" fill={C.navy} stroke={C.grey} strokeWidth="1.5" />
      <circle cx="160" cy="202" r="7" fill={C.navy} stroke={C.grey} strokeWidth="1.5" />

      {/* Revolving Machinery House / Cab */}
      <path d="M 45 190 L 60 140 L 175 140 L 185 190 Z" fill={C.panel3} stroke={alert ? ALERT_COLOR : C.classicalLight} strokeWidth="2" />
      {/* Operator Window */}
      <polygon points="145,145 170,145 165,165 145,165" fill={C.navy} stroke={alert ? ALERT_COLOR : C.interaction} strokeWidth="1.5" />

      {/* Main Lattice Boom (angled upward to the right) */}
      <line x1="160" y1="165" x2="380" y2="65" stroke={C.grey} strokeWidth="8" strokeLinecap="round" />
      <line x1="160" y1="165" x2="380" y2="65" stroke={C.panel2} strokeWidth="4" strokeLinecap="round" />
      {/* Boom Lattice Crosses */}
      <line x1="210" y1="145" x2="230" y2="130" stroke={C.border} strokeWidth="2" />
      <line x1="260" y1="125" x2="280" y2="110" stroke={C.border} strokeWidth="2" />
      <line x1="310" y1="105" x2="330" y2="90" stroke={C.border} strokeWidth="2" />

      {/* Boom Point Sheave (Top Rotating Wheel) */}
      <g className="anim-sheave">
        <circle cx="380" cy="65" r="14" fill={C.panel2} stroke={alert ? ALERT_COLOR : C.interaction} strokeWidth="2.5" filter={alert ? 'url(#glow-alert)' : 'url(#glow-cyan)'} />
        <line x1="368" y1="65" x2="392" y2="65" stroke={alert ? ALERT_COLOR : C.interaction} strokeWidth="1.5" />
        <line x1="380" y1="53" x2="380" y2="77" stroke={alert ? ALERT_COLOR : C.interaction} strokeWidth="1.5" />
      </g>
      <circle cx="380" cy="65" r="4" fill={alert ? ALERT_COLOR : C.interaction} />

      {/* Crowd Arm / Dipper Handle */}
      <line x1="270" y1="120" x2="430" y2="175" stroke={alert ? ALERT_COLOR : C.classical} strokeWidth="6" strokeLinecap="round" className={alert ? 'alert-flash' : undefined} />

      {/* Dipper / Shovel Bucket */}
      <path d="M 410 165 L 455 180 L 450 208 L 400 200 Z" fill={C.panel2} stroke={alert ? ALERT_COLOR : C.warning} strokeWidth="2" />
      {/* Bucket Teeth */}
      <polygon points="455,180 465,184 458,192" fill={alert ? ALERT_COLOR : C.warning} />
      <polygon points="453,192 463,196 455,204" fill={alert ? ALERT_COLOR : C.warning} />

      {/* Animated Hoist Cable (from Winch in House -> Top Sheave -> Bucket) */}
      <line x1="130" y1="140" x2="380" y2="55" stroke={alert ? ALERT_COLOR : C.interaction} strokeWidth="2" className={`anim-cable ${alert ? 'alert-cable' : ''}`} />
      <line x1="384" y1="69" x2="425" y2="165" stroke={alert ? ALERT_COLOR : C.interaction} strokeWidth="2.5" className={`anim-cable ${alert ? 'alert-cable' : ''}`} />

      {/* SENSORS & CALLOUTS */}

      {/* Sensor 1: Hoist Load (Top Sheave) - Box comfortably placed at Y=12 */}
      <circle cx="380" cy="65" r="16" fill="none" stroke={alert ? ALERT_COLOR : C.interaction} strokeWidth="1.5" className="anim-ring-1" />
      <line x1="380" y1="48" x2="380" y2="30" stroke={alert ? ALERT_COLOR : C.interaction} strokeWidth="1.5" className="anim-signal-line" />
      <g className="anim-label-box">
        <rect x="320" y="10" width="120" height="22" rx="5" fill={C.panel2} stroke={alert ? ALERT_COLOR : C.interaction} strokeWidth="1.5" />
        <text x="380" y="25" textAnchor="middle" fill={alert ? ALERT_COLOR : C.interaction} fontSize="11" fontWeight="700" letterSpacing="0.3">
          1. Hoist Load
        </text>
      </g>

      {/* Sensor 2: Crowd Vibration (Dipper Arm Joint) */}
      <circle cx="270" cy="120" r="14" fill="none" stroke={alert ? ALERT_COLOR : C.deviation} strokeWidth="1.5" className="anim-ring-2" />
      <circle cx="270" cy="120" r="8" fill={C.navy} stroke={alert ? ALERT_COLOR : C.deviation} strokeWidth="2.5" filter={alert ? 'url(#glow-alert)' : 'url(#glow-orange)'} />
      <circle cx="270" cy="120" r="3.5" fill={alert ? ALERT_COLOR : C.deviation} />
      <line x1="270" y1="130" x2="270" y2="148" stroke={alert ? ALERT_COLOR : C.deviation} strokeWidth="1.5" className="anim-signal-line" />
      <rect x="210" y="148" width="120" height="20" rx="5" fill={C.panel2} stroke={alert ? ALERT_COLOR : C.deviation} strokeWidth="1.5" />
      <text x="270" y="162" textAnchor="middle" fill={alert ? ALERT_COLOR : C.deviation} fontSize="11" fontWeight="700">
        2. Crowd Vib.
      </text>

      {/* Sensor 3: Drive Temp (Motor House) */}
      <circle cx="110" cy="165" r="14" fill="none" stroke={alert ? ALERT_COLOR : C.warning} strokeWidth="1.5" className="anim-ring-3" />
      <circle cx="110" cy="165" r="8" fill={C.navy} stroke={alert ? ALERT_COLOR : C.warning} strokeWidth="2" />
      <circle cx="110" cy="165" r="3.5" fill={alert ? ALERT_COLOR : C.warning} />
      <line x1="110" y1="175" x2="110" y2="198" stroke={alert ? ALERT_COLOR : C.warning} strokeWidth="1.5" className="anim-signal-line" />
      <rect x="50" y="198" width="120" height="20" rx="5" fill={C.panel2} stroke={alert ? ALERT_COLOR : C.warning} strokeWidth="1.5" />
      <text x="110" y="212" textAnchor="middle" fill={alert ? ALERT_COLOR : C.warning} fontSize="11" fontWeight="700">
        3. Drive Temp.
      </text>

      {/* Sensor 4: Cable Tension (Equalizer / Hoist Drum) */}
      <circle cx="425" cy="165" r="14" fill="none" stroke={alert ? ALERT_COLOR : C.classicalLight} strokeWidth="1.5" className="anim-ring-4" />
      <circle cx="425" cy="165" r="8" fill={C.navy} stroke={alert ? ALERT_COLOR : C.classicalLight} strokeWidth="2" />
      <circle cx="425" cy="165" r="3.5" fill={alert ? ALERT_COLOR : C.classicalLight} />
      <line x1="425" y1="175" x2="425" y2="198" stroke={alert ? ALERT_COLOR : C.classicalLight} strokeWidth="1.5" className="anim-signal-line" />
      <rect x="365" y="198" width="120" height="20" rx="5" fill={C.panel2} stroke={alert ? ALERT_COLOR : C.classicalLight} strokeWidth="1.5" />
      <text x="425" y="212" textAnchor="middle" fill={alert ? ALERT_COLOR : C.classicalLight} fontSize="11" fontWeight="700">
        4. Cable Tension
      </text>

      {/* Asset Label */}
      <text x="65" y="155" fill={C.grey} fontSize="10" fontWeight="600" letterSpacing="0.5">
        Electric Rope Shovel
      </text>

      {alert && (
        <g pointerEvents="none">
          <rect x="8" y="8" width="524" height="224" rx="10" fill="none" stroke={ALERT_COLOR} strokeWidth="3" className="alert-flash" />
          <text x="270" y="250" textAnchor="middle" fill={ALERT_COLOR} fontSize="12" fontWeight="700" letterSpacing="1" className="alert-flash">
            ⚠ DEVIATION ALERT
          </text>
        </g>
      )}
    </svg>
  );
}
