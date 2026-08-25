import { useMemo, useState } from 'react';

import { C, RAW, QNAMES, QNAMES_SHORT } from './data/constants';
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

  const liveBoard = useLiveBoard();
  const liveActive = liveBoard.isLive;

  const R = useMemo(() => runPipeline(noise), [noise]);

  const visibleCount = R.records ? R.records.length : 1000;
  const visibleSample = Math.min(sample, visibleCount - 1);

  // Active record index: driven by LiveBoard when active/snapped, otherwise by explorer slider
  const activeRecordId = liveActive && liveBoard.result
    ? Math.min(liveBoard.result.recordId, visibleCount - 1)
    : visibleSample;

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

  // Instantaneous readings and scores for the active sample
  const selectedSensors = liveActive && liveBoard.result?.x
    ? liveBoard.result.x
    : R.test.X[activeRecordId] || [0.5, 0.5, 0.5, 0.5];

  const selectedLabel = liveActive && liveBoard.result
    ? liveBoard.result.label
    : (R.test.y[activeRecordId] ?? 0);

  const classicalThreshold = R.classical.op.threshold;
  const quantumThreshold = R.quantum.op.threshold;

  const classicalScore = liveActive && liveBoard.result
    ? liveBoard.result.classicalScore
    : (R.classical.scores[activeRecordId] ?? 0);

  const quantumScore = liveActive && liveBoard.result
    ? liveBoard.result.quantumScore
    : (R.quantum.scores[activeRecordId] ?? 0);

  const classicalAlert = liveActive && liveBoard.result
    ? liveBoard.result.classicalAlert
    : classicalScore >= classicalThreshold;

  const quantumAlert = liveActive && liveBoard.result
    ? liveBoard.result.quantumAlert
    : quantumScore >= quantumThreshold;

  const machineAlert = liveBoard.activeMode === 'classical' ? classicalAlert : quantumAlert;

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

  const rawRec = R.records?.[activeRecordId];
  const displayHoist = rawRec?.display?.hoistLoad || ((selectedSensors[0] * 500).toFixed(1) + ' kN');
  const displayCrowd = rawRec?.display?.crowdVib || ((selectedSensors[1] * 50).toFixed(1) + ' mm/s');
  const displayTemp = rawRec?.display?.driveTemp || ((20 + selectedSensors[2] * 180).toFixed(1) + ' °C');
  const displayTension = rawRec?.display?.cableTension || ((1 + selectedSensors[3] * 199).toFixed(1) + ' MPa');

  const sensorDisplayValues = liveActive && liveBoard.reading
    ? [
        `${liveBoard.reading.hoistLoad.toFixed(1)} kN`,
        `${liveBoard.reading.crowdVib.toFixed(1)} mm/s`,
        `${liveBoard.reading.driveTemp.toFixed(1)} °C`,
        `${liveBoard.reading.cableTension.toFixed(1)} MPa`,
      ]
    : [
        displayHoist,
        displayCrowd,
        displayTemp,
        displayTension,
      ];

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
      index: activeRecordId,
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
      '7 derived quantum features (single-body and 2-body interaction observables), extracted by Rimay DQFE from the four physical signals.',
    heatmap: { matrix: R.quantum.corr, labels: QNAMES_SHORT, showValues: false },
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
      index: activeRecordId,
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
        visibleSample={activeRecordId}
        selectedSensors={selectedSensors}
        sensorColors={sensorColors}
        alert={machineAlert}
        label={selectedLabel}
        mode={liveBoard.activeMode}
        liveMode={liveActive}
        sensorDisplayValues={sensorDisplayValues}
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