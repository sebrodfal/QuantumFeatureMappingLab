import { useMemo, useState } from 'react';

import { C, RAW, QNAMES } from './data/constants';
import { runPipeline } from './utils/pipeline';
import { meanOff } from './utils/correlation';
import { decisionStatus } from './utils/decisionStatus';
import { useThresholdPopover } from './hooks/useThresholdPopover';
import { useLiveBoard } from './hooks/useLiveBoard';

import { Header } from './components/Header/Header';
import { SourceDataSection } from './components/SourceDataSection/SourceDataSection';
import { StickyControls } from './components/StickyControls/StickyControls';
import { ThresholdPopover } from './components/ThresholdPopover/ThresholdPopover';
import { FeatureSpaceCard } from './components/FeatureSpaceCard/FeatureSpaceCard';
import { QuantumCircuitSection } from './components/QuantumCircuitSection/QuantumCircuitSection';
import { FeatureSpaceComparison } from './components/FeatureSpaceComparison/FeatureSpaceComparison';
import { MethodologyNote } from './components/MethodologyNote/MethodologyNote';
import { LiveBoardPanel } from './components/LiveBoardPanel/LiveBoardPanel';

/*
  QUANTUM FEATURE MAPPING LAB
  Story: physical machine → 4 source signals → classical or quantum
  feature-mapped representation → feature-space comparison → reference
  analytical validation at a comparable operating target (recall ≥ 80%).

  The quantum feature map does not replace the analytical system. It
  transforms the original physical signals into a derived feature space that
  downstream algorithms can use. AUC / recall / false-alarm validation is a
  secondary, reference-only signal — it does not dominate the design. The
  heatmaps and scatter plots are the primary visual evidence of how the
  feature space structure changes.
*/

export default function App() {
  const [noise, setNoise] = useState(1);
  const [sample, setSample] = useState(80);
  const [circuitOpen, setCircuitOpen] = useState(false);

  const {
    showThresholdExplanation,
    setShowThresholdExplanation,
    popoverStyle,
    learnMoreButtonRef,
    thresholdPopoverRef,
  } = useThresholdPopover();

  const liveBoard = useLiveBoard();
  const liveActive = liveBoard.isLive;
  const machineAlert = liveActive
    ? liveBoard.activeMode === 'classical'
      ? liveBoard.result.classicalAlert
      : liveBoard.result.quantumAlert
    : false;

  const R = useMemo(() => runPipeline(noise), [noise]);

  const visibleCount = 220;
  const visibleSample = Math.min(sample, visibleCount - 1);

  const rawCorrelation = meanOff(R.classical.corr);
  const quantumCorrelation = meanOff(R.quantum.corr);

  const [featureA, featureB] = R.quantum.top;

  const rawPoints = R.test.X.slice(0, visibleCount).map((row) => [
    row[0],
    row[1],
  ]);

  const quantumPoints = R.test.Q.slice(0, visibleCount).map((row) => [
    row[featureA],
    row[featureB],
  ]);

  const labels = R.test.y.slice(0, visibleCount);
  const selectedSensors = R.test.X[visibleSample];
  const selectedLabel = R.test.y[visibleSample];
  const classicalScore = R.classical.scores[visibleSample];
  const quantumScore = R.quantum.scores[visibleSample];

  const classicalThreshold = R.classical.op.threshold;
  const quantumThreshold = R.quantum.op.threshold;

  const classicalAlert = classicalScore >= classicalThreshold;
  const quantumAlert = quantumScore >= quantumThreshold;

  const classicalStatus = decisionStatus(selectedLabel, classicalAlert);
  const quantumStatus = decisionStatus(selectedLabel, quantumAlert);

  const aucDelta = (R.quantum.auc - R.classical.auc) * 100;
  const falseAlarmReduction =
    Math.max(0, R.classical.op.fpr - R.quantum.op.fpr) * 100;

  const sensorColors = [
    C.interaction,
    C.deviation,
    C.warning,
    C.classicalLight,
  ];

  const selectedConditionColor = selectedLabel ? C.deviation : C.healthy;

  // Section 1 (the physical source) is driven by the Live Board — real or
  // simulated perillas — when it's active; everything from Section 2 down
  // (heatmaps, scatter, Selected Record) always stays on the Explore Data
  // Record slider, exploring the synthetic dataset. The two are
  // intentionally kept from crossing.
  const liveSensorValues = liveActive ? liveBoard.result.x : selectedSensors;
  const liveSensorDisplayValues = liveActive
    ? [
        `${liveBoard.reading.hoistLoad.toFixed(1)} kN`,
        `${liveBoard.reading.crowdVib.toFixed(1)} mm/s`,
        `${liveBoard.reading.driveTemp.toFixed(1)} °C`,
        `${liveBoard.reading.cableTension.toFixed(1)} MPa`,
      ]
    : null;

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
        'The four variables partially reflect the same operating cycle. The representation preserves useful signals but includes repeated dependencies between sensors.',
    },
    validation: {
      auc: R.classical.auc,
      fpr: R.classical.op.fpr,
      color: C.classicalLight,
    },
    selected: {
      index: visibleSample,
      label: selectedLabel,
      conditionColor: selectedConditionColor,
      score: classicalScore,
      threshold: classicalThreshold,
      alert: classicalAlert,
      status: classicalStatus,
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
      '14 derived quantum features, expanded from the same four physical signals.',
    heatmap: { matrix: R.quantum.corr, labels: undefined, showValues: false },
    scatter: {
      accent: C.quantum,
      xLabel: QNAMES[featureA],
      yLabel: QNAMES[featureB],
      points: quantumPoints,
      labels,
      note: 'The feature map can reveal alternative geometric relationships between the same records.',
    },
    metric: {
      label: 'Quantum Feature Map Result',
      color: C.quantumLight,
      description:
        'The quantum feature map generates a higher-dimensional representation with different relationships between variables, while preserving traceability to the four source signals.',
    },
    validation: {
      auc: R.quantum.auc,
      fpr: R.quantum.op.fpr,
      color: C.quantumLight,
    },
    selected: {
      index: visibleSample,
      label: selectedLabel,
      conditionColor: selectedConditionColor,
      score: quantumScore,
      threshold: quantumThreshold,
      alert: quantumAlert,
      status: quantumStatus,
    },
  };

  return (
    <div className="app">
      <Header />

      <div className="divider" />

      <SourceDataSection
        visibleSample={visibleSample}
        selectedSensors={liveSensorValues}
        sensorColors={sensorColors}
        alert={machineAlert}
        liveMode={liveActive}
        sensorDisplayValues={liveSensorDisplayValues}
      />

      <LiveBoardPanel liveBoard={liveBoard} />

      <StickyControls
        noise={noise}
        onNoiseChange={setNoise}
        visibleSample={visibleSample}
        visibleCount={visibleCount}
        selectedLabel={selectedLabel}
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
    </div>
  );
}