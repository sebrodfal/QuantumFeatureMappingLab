import { useState } from 'react';
import { ModeSwitch } from './ModeSwitch';
import { SimulatedBoardPanel } from './SimulatedBoardPanel';

const STATUS_LABEL = {
  disconnected: 'Disconnected',
  connecting: 'Connecting…',
  connected: 'Connected',
  error: 'Error',
};

const TRUTH_LABEL = { healthy: 'HEALTHY', deviation: 'DEVIATION' };

/* Floating panel for driving "live mode" — either from the real ESP32
   board over WebSocket, or from on-screen sliders standing in for the
   potentiometers (docs/demo-fisico-spec.md §4, §7.3, plus the slider
   simulation added for demoing the concept without hardware). Mirrors
   StickyControls' floating button pattern but sits on the opposite corner
   so both can be open at once. Purely a thin UI over useLiveBoard() — all
   scoring happens in liveScore.js, this component only displays it.

   Layout: the classical/quantum switch is the hero element (what a booth
   visitor actually interacts with); the input source (board vs. sliders)
   is a secondary tab underneath it. */
export function LiveBoardPanel({ liveBoard }) {
  const {
    status,
    url,
    reading,
    result,
    stagedMatch,
    lastError,
    connect,
    disconnect,
    isSimulating,
    startSimulation,
    stopSimulation,
    updateSimulation,
    activeMode,
    setManualMode,
  } = liveBoard;

  const [isExpanded, setIsExpanded] = useState(false);
  const [urlInput, setUrlInput] = useState(url);
  const [activeTab, setActiveTab] = useState('simulate'); // 'simulate' | 'board'

  const isBusy = status === 'connected' || status === 'connecting';
  const isAutoMode = Boolean(reading?.mode);

  return (
    <div className="live-board-container">
      {!isExpanded ? (
        <button
          type="button"
          className="floating-fixed-btn live-board-fixed-btn"
          onClick={() => setIsExpanded(true)}
          aria-label="Open Live Board panel"
          title="Physical board connection (ESP32 live mode)"
        >
          <span className="btn-icon">📡</span>
          <span className="btn-title">Live Board</span>
          <span className={`live-status-dot live-status-${isSimulating ? 'connected' : status}`} />
          <span className="btn-badge">{isSimulating ? 'Simulating' : STATUS_LABEL[status]}</span>
          <span className="btn-arrow">▲</span>
        </button>
      ) : (
        <section className="card controls floating-full-panel live-board-panel">
          <div className="panel-top-bar">
            <div className="panel-top-title">
              <span className="title-icon">📡</span>
              <strong>Physical Board — Live Mode</strong>
            </div>
            <button
              type="button"
              className="panel-close-btn"
              onClick={() => setIsExpanded(false)}
              aria-label="Close Live Board panel"
            >
              <span>Minimize</span>
              <span className="close-x">✕</span>
            </button>
          </div>

          <div className="live-board-body">
            <div className="live-board-section live-board-switch-section">
              <div className="small-label">Classical / Quantum Switch</div>
              <ModeSwitch
                mode={activeMode}
                isAuto={isAutoMode}
                onSelect={setManualMode}
                classicalAlert={result?.classicalAlert ?? false}
                quantumAlert={result?.quantumAlert ?? false}
              />
              <p className="live-board-hint">
                {isAutoMode
                  ? 'Synced from the last board reading — click either side to override.'
                  : 'Manual — click either side to switch.'}
              </p>
            </div>

            {result && (
              <div className="live-board-section">
                {stagedMatch ? (
                  <div className="staged-truth-chip">
                    <span className="staged-truth-label">Staged condition:</span>
                    <strong>{TRUTH_LABEL[stagedMatch.knownTruth]}</strong>
                    <span className="staged-truth-caption">
                      {stagedMatch.label}
                      {!stagedMatch.reviewed && ' — narrative default, not engineering-reviewed'}
                    </span>
                  </div>
                ) : (
                  <p className="live-board-hint">
                    This reading doesn't match a staged scenario — showing predictions only, no known truth to compare against.
                  </p>
                )}

                <div className="live-board-verdict-row">
                  <span className={result.classicalAlert ? 'live-badge is-alert' : 'live-badge is-ok'}>
                    Classical: {result.classicalAlert ? 'ALERT' : 'OK'} ({result.classicalScore.toFixed(2)})
                    {stagedMatch && (
                      <span className="correctness-mark">
                        {(result.classicalAlert ? 'deviation' : 'healthy') === stagedMatch.knownTruth
                          ? ' ✓'
                          : ' ✗'}
                      </span>
                    )}
                  </span>
                  <span className={result.quantumAlert ? 'live-badge is-alert' : 'live-badge is-ok'}>
                    Quantum: {result.quantumAlert ? 'ALERT' : 'OK'} ({result.quantumScore.toFixed(2)})
                    {stagedMatch && (
                      <span className="correctness-mark">
                        {(result.quantumAlert ? 'deviation' : 'healthy') === stagedMatch.knownTruth
                          ? ' ✓'
                          : ' ✗'}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}

            <div className="live-board-section">
              <div className="input-source-tabs">
                <button
                  type="button"
                  className={activeTab === 'simulate' ? 'active' : ''}
                  onClick={() => setActiveTab('simulate')}
                >
                  🎚️ Simulate perillas
                </button>
                <button
                  type="button"
                  className={activeTab === 'board' ? 'active' : ''}
                  onClick={() => setActiveTab('board')}
                >
                  🔌 Real board
                </button>
              </div>

              {activeTab === 'simulate' ? (
                <SimulatedBoardPanel
                  isSimulating={isSimulating}
                  reading={reading}
                  onStart={startSimulation}
                  onChange={updateSimulation}
                  onStop={stopSimulation}
                />
              ) : (
                <div className="live-board-connection">
                  <div className="small-label">ESP32 WebSocket URL</div>
                  <div className="live-board-url-row">
                    <input
                      type="text"
                      className="live-board-url-input"
                      value={urlInput}
                      onChange={(event) => setUrlInput(event.target.value)}
                      placeholder="ws://192.168.4.1/ws"
                      disabled={isBusy}
                    />
                    {isBusy ? (
                      <button type="button" className="live-board-action-btn" onClick={disconnect}>
                        Disconnect
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="live-board-action-btn"
                        onClick={() => connect(urlInput)}
                      >
                        Connect
                      </button>
                    )}
                  </div>
                  <div className={`live-board-status live-status-${status}`}>
                    <span className={`live-status-dot live-status-${status}`} />
                    {STATUS_LABEL[status]}
                    {lastError && <span className="live-board-error"> — {lastError}</span>}
                  </div>

                  {reading && status === 'connected' && (
                    <div className="live-board-reading-grid">
                      <span>Hoist Load: {reading.hoistLoad.toFixed(1)} kN</span>
                      <span>Crowd Vib.: {reading.crowdVib.toFixed(1)} mm/s</span>
                      <span>Drive Temp.: {reading.driveTemp.toFixed(1)} °C</span>
                      <span>Cable Tension: {reading.cableTension.toFixed(1)} MPa</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
