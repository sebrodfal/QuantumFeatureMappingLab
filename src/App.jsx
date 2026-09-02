import { useMemo, useState } from 'react';

import { C, RAW, QNAMES, QNAMES_SHORT } from './data/constants';
import { runPipeline } from './utils/pipeline';
import { meanOff } from './utils/correlation';
import { decisionStatus } from './utils/decisionStatus';
import { useThresholdPopover } from './hooks/useThresholdPopover';
import { useLiveBoard } from './hooks/useLiveBoard';
import { physicalToUnit } from './data/calibration';


import { Header } from './components/Header/Header';
import { SourceDataSection } from './components/SourceDataSection/SourceDataSection';
import { StickyControls } from './components/StickyControls/StickyControls';
import { ThresholdPopover } from './components/ThresholdPopover/ThresholdPopover';
import { FeatureSpaceCard } from './components/FeatureSpaceCard/FeatureSpaceCard';
import { QuantumCircuitSection } from './components/QuantumCircuitSection/QuantumCircuitSection';
import { FeatureSpaceComparison } from './components/FeatureSpaceComparison/FeatureSpaceComparison';
import { MethodologyNote } from './components/MethodologyNote/MethodologyNote';
import { LiveBoardPanel } from './components/LiveBoardPanel/LiveBoardPanel';
import { InnovationCenterSection } from './components/InnovationCenterSection/InnovationCenterSection';


/*
  QUANTUM FEATURE MAPPING LAB (Real Dataset Mode)
  Story: physical machine → 4 source signals → classical or quantum
  feature-mapped representation → feature-space comparison → reference
  analytical validation at a comparable operating target (recall ≥ 90%).
*/

export default function App() {
  const [noise, setNoise] = useState(1);
  const [sample, setSample] = useState(0);
  const [circuitOpen, setCircuitOpen] = useState(false);

  const {
    showThresholdExplanation,
    setShowThresholdExplanation,
    popoverStyle,
    learnMoreButtonRef,
    thresholdPopoverRef,
  } = useThresholdPopover();

  // --- SECTION 1 STATE & CONTROLS: Physical / Simulated Live Board ---
  const liveBoard = useLiveBoard();

  const section1Reading = liveBoard.reading;
  const section1Result = liveBoard.result;
  const section1Sensors = section1Result?.x ?? (section1Reading ? physicalToUnit(section1Reading) : [0.5, 0.5, 0.5, 0.5]);
  const section1Label = section1Result?.label ?? (liveBoard.stagedMatch?.knownTruth === 'deviation' ? 1 : 0);
  const section1ClassicalAlert = section1Result?.classicalAlert ?? false;
  const section1QuantumAlert = section1Result?.quantumAlert ?? false;
  const section1MachineAlert = liveBoard.activeMode === 'classical' ? section1ClassicalAlert : section1QuantumAlert;
  const section1RecordId = section1Result?.recordId ?? 0;

  const section1DisplayValues = section1Reading
    ? [
        `${section1Reading.hoistLoad.toFixed(1)} kN`,
        `${section1Reading.crowdVib.toFixed(1)} mm/s`,
        `${section1Reading.driveTemp.toFixed(1)} °C`,
        `${section1Reading.cableTension.toFixed(1)} MPa`,
      ]
    : [
        '250.0 kN',
        '25.0 mm/s',
        '110.0 °C',
        '100.5 MPa',
      ];

  const sensorColors = [
    C.interaction,
    C.deviation,
    C.warning,
    C.classicalLight,
  ];

  // --- SECTION 2 STATE & CONTROLS: Plant Noise & Dataset Record Exploration (Lab Controls) ---
  const R = useMemo(() => runPipeline(noise), [noise]);

  const visibleCount = R.records ? R.records.length : 1000;
  const visibleSample = Math.min(sample, visibleCount - 1);

  const rawCorrelation = meanOff(R.classical.corr);
  const quantumCorrelation = meanOff(R.quantum.corr);

  const [featureA, featureB] = R.quantum.top || [1, 5];

  const rawPoints = R.test.X.slice(0, visibleCount).map((row) => [
    row[0],
    row[1],
  ]);

  const quantumPoints = R.test.Q.slice(0, visibleCount).map((row) => [
    row[featureA],
    row[featureB],
  ]);

  const labels = R.test.y.slice(0, visibleCount);

  // Section 2 selected record: strictly driven by Lab Controls' visibleSample
  const sec2Label = R.test.y[visibleSample] ?? 0;
  const sec2ConditionColor = sec2Label ? C.deviation : C.healthy;

  const classicalThreshold = R.classical.op.threshold;
  const quantumThreshold = R.quantum.op.threshold;

  const sec2ClassicalScore = R.classical.scores[visibleSample] ?? 0;
  const sec2QuantumScore = R.quantum.scores[visibleSample] ?? 0;

  const sec2ClassicalAlert = sec2ClassicalScore >= classicalThreshold;
  const sec2QuantumAlert = sec2QuantumScore >= quantumThreshold;

  const sec2ClassicalStatus = decisionStatus(sec2Label, sec2ClassicalAlert);
  const sec2QuantumStatus = decisionStatus(sec2Label, sec2QuantumAlert);

  const aucDelta = (R.quantum.auc - R.classical.auc) * 100;
  const falseAlarmReduction =
    Math.max(0, R.classical.op.fpr - R.quantum.op.fpr) * 100;

  const classicalCard = {
    variant: 'classical',
    borderColor: C.classical,
    title: '2A. Classical Representation',
    description:
      'The four physical signals are kept as original input variables.',
    correlation: { value: rawCorrelation, color: C.classicalLight },
    chips: RAW.map((name) => ({ label: name, active: false })),
    chipCaption: 'Direct representation of the signals captured by the sensors.',
    heatmap: { matrix: R.classical.corr, labels: RAW, showValues: true },
    scatter: {
      accent: C.classical,
      xLabel: 'Hoist Load',
      yLabel: 'Crowd Vib.',
      points: rawPoints,
      labels,
      note: 'Overlap between colors indicates records with similar sensor-space patterns.',
    },
    metric: {
      label: 'Classical Representation Result',
      color: C.classicalLight,
      description:
        'Direct sensor channels provide 1D signals but lack non-linear coupling terms, resulting in overlapping clusters and high false alarm rates.',
    },
    validation: {
      auc: R.classical.auc,
      fpr: R.classical.op.fpr,
      color: C.classicalLight,
    },
    selected: {
      index: visibleSample,
      label: sec2Label,
      conditionColor: sec2ConditionColor,
      score: sec2ClassicalScore,
      threshold: classicalThreshold,
      alert: sec2ClassicalAlert,
      status: sec2ClassicalStatus,
    },
  };

  const quantumCard = {
    variant: 'quantum',
    borderColor: C.quantum,
    title: '2B. Quantum Feature-Mapped Representation',
    description:
      'The feature map enriches the representation by generating derived observables from the same four physical signals.',
    correlation: { value: quantumCorrelation, color: C.quantumLight },
    chips: QNAMES.map((name, i) => ({
      label: name,
      active: i === featureA || i === featureB,
    })),
    chipCaption:
      '7 derived quantum features (single-body and 2-body interaction observables), extracted by Rimay DQFE from the four physical signals.',
    heatmap: { matrix: R.quantum.corr, labels: QNAMES_SHORT, showValues: true },
    scatter: {
      accent: C.quantum,
      xLabel: QNAMES[featureA],
      yLabel: QNAMES[featureB],
      points: quantumPoints,
      labels,
      note: 'Geometric separation in the Hilbert space feature map reveals the anomaly cluster hidden in raw coordinates.',
    },
    metric: {
      label: 'Quantum Feature Map Result',
      color: C.quantumLight,
      description:
        `The quantum feature map embeds 2-body interaction observables (Hilbert space), unlocking clear geometric separation and achieving +${aucDelta.toFixed(1)} pts AUC lift.`,
    },
    validation: {
      auc: R.quantum.auc,
      fpr: R.quantum.op.fpr,
      color: C.quantumLight,
    },
    selected: {
      index: visibleSample,
      label: sec2Label,
      conditionColor: sec2ConditionColor,
      score: sec2QuantumScore,
      threshold: quantumThreshold,
      alert: sec2QuantumAlert,
      status: sec2QuantumStatus,
    },
  };

  return (
    <div className="app">
      <Header />

      <div className="divider" />

      <SourceDataSection
        visibleSample={section1RecordId}
        selectedSensors={section1Sensors}
        sensorColors={sensorColors}
        alert={section1MachineAlert}
        label={section1Label}
        mode={liveBoard.activeMode}
        liveMode={true}
        sensorDisplayValues={section1DisplayValues}
        onModeChange={liveBoard.setManualMode}
        classicalAlert={section1ClassicalAlert}
        quantumAlert={section1QuantumAlert}
      />

      <LiveBoardPanel liveBoard={liveBoard} />

      <StickyControls
        noise={noise}
        onNoiseChange={setNoise}
        visibleSample={visibleSample}
        visibleCount={visibleCount}
        selectedLabel={sec2Label}
        onSampleChange={setSample}
        showThresholdExplanation={showThresholdExplanation}
        onToggleThresholdExplanation={() =>
          setShowThresholdExplanation((open) => !open)
        }
        learnMoreButtonRef={learnMoreButtonRef}
      />

      {showThresholdExplanation && (
        <ThresholdPopover
          thresholdPopoverRef={thresholdPopoverRef}
          popoverStyle={popoverStyle}
          onClose={() => setShowThresholdExplanation(false)}
        />
      )}

      <QuantumCircuitSection
        circuitOpen={circuitOpen}
        onToggle={() => setCircuitOpen((open) => !open)}
      />
      
      <div className="band">
        SAME DATA RECORD <strong>→</strong> TWO COMPLEMENTARY FEATURE SPACES
      </div>

      <main className="split">
        <FeatureSpaceCard {...classicalCard} />
        <FeatureSpaceCard {...quantumCard} />
      </main>

      <FeatureSpaceComparison
        rawCorrelation={rawCorrelation}
        quantumCorrelation={quantumCorrelation}
        aucDelta={aucDelta}
        falseAlarmReduction={falseAlarmReduction}
      />

      <MethodologyNote />

      <InnovationCenterSection />
    </div>
  );
}