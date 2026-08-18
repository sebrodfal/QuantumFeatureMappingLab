import { useState, useRef, useEffect } from 'react';
import { ModeSwitch } from './ModeSwitch';
import { SimulatedBoardPanel } from './SimulatedBoardPanel';
import { useDraggable } from '../../hooks/useDraggable';

const STATUS_LABEL = {
  disconnected: 'Disconnected',
  connecting: 'Connecting…',
  connected: 'Connected',
  error: 'Error',
};

const TRUTH_LABEL = { healthy: 'HEALTHY', deviation: 'DEVIATION' };

/* Floating panel for driving "live mode" — either from the real ESP32
   board over WebSocket, or from on-screen sliders standing in for the
   potentiometers. Fully draggable and movable across the viewport so it
   never blocks machine telemetry or feature space visualizations. */
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
  const containerRef = useRef(null);

  const { panelRef, position, isDragging, dragHandleProps } = useDraggable();

  const isBusy = status === 'connected' || status === 'connecting';
  const isAutoMode = Boolean(reading?.mode);

  // Close when clicking outside the expanded panel (unless dragging)
  useEffect(() => {
    if (!isExpanded || isDragging) return undefined;

    const handleClickOutside = (event) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        !event.target.closest('.live-board-fixed-btn')
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, isDragging, panelRef]);

  const panelStyle = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        right: 'auto',
        bottom: 'auto',
        margin: 0,
        zIndex: 10001,
      }
    : undefined;

  return (
    <div className="live-board-container" ref={containerRef}>
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
        <section
          ref={panelRef}
          style={panelStyle}
          className={`card controls floating-full-panel live-board-panel live-board-movable ${isDragging ? 'is-dragging' : ''}`}
        >
          <div className="panel-top-bar" {...dragHandleProps}>
            <div className="panel-top-title">
              <span className="drag-handle-grip" title="Click and drag to move panel">⠿</span>
              <span className="title-icon">📡</span>
              <strong>Physical Board — Live Mode</strong>
              <span className="drag-hint-badge">drag to move</span>
            </div>
            <button
              type="button"
              className="panel-close-btn no-drag"
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
                  <div className="live-board-status-row">
                    <span>Active Decision:</span>
                    <strong className={result[`${activeMode}Alert`] ? 'alert-active' : 'alert-healthy'}>
                      {result[`${activeMode}Alert`] ? 'ALERT ACTIVE' : 'ALL CLEAR'}
                    </strong>
                  </div>
                )}
              </div>
            )}

            <div className="live-board-section">
              <div className="live-board-tabs no-drag">
                <button
                  type="button"
                  className={`live-board-tab-btn ${activeTab === 'simulate' ? 'active' : ''}`}
                  onClick={() => setActiveTab('simulate')}
                >
                  🎚️ Simulate perillas
                </button>
                <button
                  type="button"
                  className={`live-board-tab-btn ${activeTab === 'board' ? 'active' : ''}`}
                  onClick={() => setActiveTab('board')}
                >
                  🔌 Real board (WS)
                </button>
              </div>

              {activeTab === 'simulate' ? (
                <SimulatedBoardPanel
                  isSimulating={isSimulating}
                  reading={reading}
                  onStart={startSimulation}
                  onStop={stopSimulation}
                  onUpdate={updateSimulation}
                />
              ) : (
                <div className="live-board-ws-controls">
                  <div className="live-board-url-row">
                    <input
                      type="text"
                      className="live-board-url-input"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="ws://192.168.4.1/ws"
                      disabled={isBusy}
                    />
                    <button
                      type="button"
                      className={`live-board-action-btn ${isBusy ? 'live-board-disconnect-btn' : ''}`}
                      onClick={() => (isBusy ? disconnect() : connect(urlInput))}
                    >
                      {isBusy ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                  {lastError && <div className="live-board-error-msg">{lastError}</div>}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
