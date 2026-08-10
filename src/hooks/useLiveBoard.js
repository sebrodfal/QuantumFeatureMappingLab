import { useCallback, useEffect, useRef, useState } from 'react';
import { liveScore } from '../utils/liveScore.js';
import { matchStagedScenario } from '../data/stagedScenarios.js';

/*
  WebSocket client for the physical ESP32 board (docs/demo-fisico-spec.md
  §4, §7.3). The board is a pure I/O peripheral: it sends raw knob/switch
  readings, and this hook is the only place that turns those into a verdict
  — by calling liveScore(), the exact same qFeatures()/predict() path the
  rest of the app uses. The board never runs its own copy of the model.

  Wire format (per spec):
    ESP32 -> browser: { hoistLoad, crowdVib, driveTemp, cableTension, mode }
    browser -> ESP32: { classicalAlert, quantumAlert }

  Also supports a "simulated board" mode: dragging the sliders in
  SimulatedBoardPanel calls updateSimulation() directly, going through the
  exact same applyReading() path a real WS message would — so demoing the
  concept in a meeting (no hardware, no waiting for a timer to cycle) shows
  the real scoring pipeline, not a mock of it.
*/

const RECONNECT_DELAY_MS = 3000;

export function useLiveBoard() {
  const [status, setStatus] = useState('disconnected'); // disconnected | connecting | connected | error
  const [url, setUrl] = useState('ws://192.168.4.1/ws');
  const [enabled, setEnabled] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [reading, setReading] = useState(null); // last { hoistLoad, crowdVib, driveTemp, cableTension, mode? }
  const [result, setResult] = useState(null); // last liveScore() output
  const [stagedMatch, setStagedMatch] = useState(null); // matched src/data/stagedScenarios.js entry, or null
  const [lastError, setLastError] = useState(null);
  const [manualMode, setManualMode] = useState('quantum'); // used until the board sends a real `mode`

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // Single place that turns a raw 4-value reading into a verdict — used by
  // both the WS message handler and the slider-driven simulation, so
  // there's exactly one scoring path regardless of where the reading came
  // from.
  const applyReading = useCallback((nextReading) => {
    setReading(nextReading);
    const score = liveScore(nextReading);
    setResult(score);
    setStagedMatch(matchStagedScenario(nextReading));
    return score;
  }, []);

  const disconnect = useCallback(() => {
    setEnabled(false);
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  const connect = useCallback(
    (targetUrl) => {
      setIsSimulating(false);
      setUrl(targetUrl);
      setEnabled(true);
    },
    []
  );

  const startSimulation = useCallback(
    (initialReading) => {
      disconnect();
      setIsSimulating(true);
      applyReading(initialReading);
    },
    [disconnect, applyReading]
  );

  const stopSimulation = useCallback(() => {
    setIsSimulating(false);
  }, []);

  const updateSimulation = useCallback(
    (nextReading) => {
      applyReading(nextReading);
    },
    [applyReading]
  );

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    const open = () => {
      if (cancelled) return;

      setStatus('connecting');
      setLastError(null);

      let socket;
      try {
        socket = new WebSocket(url);
      } catch (err) {
        setStatus('error');
        setLastError(err.message);
        return;
      }
      wsRef.current = socket;

      socket.onopen = () => {
        if (cancelled) return;
        setStatus('connected');
      };

      socket.onmessage = (event) => {
        if (cancelled) return;

        let payload;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return; // ignore malformed frames rather than crashing the demo
        }

        const {
          hoistLoad,
          crowdVib,
          driveTemp,
          cableTension,
          mode,
        } = payload;

        if (
          typeof hoistLoad !== 'number' ||
          typeof crowdVib !== 'number' ||
          typeof driveTemp !== 'number' ||
          typeof cableTension !== 'number'
        ) {
          return;
        }

        const nextReading = { hoistLoad, crowdVib, driveTemp, cableTension, mode };
        const score = applyReading(nextReading);

        if (socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              classicalAlert: score.classicalAlert,
              quantumAlert: score.quantumAlert,
            })
          );
        }
      };

      socket.onerror = () => {
        if (cancelled) return;
        setStatus('error');
        setLastError('WebSocket error');
      };

      socket.onclose = () => {
        if (cancelled) return;
        wsRef.current = null;
        if (enabledRef.current) {
          setStatus('connecting');
          reconnectTimerRef.current = setTimeout(open, RECONNECT_DELAY_MS);
        } else {
          setStatus('disconnected');
        }
      };
    };

    open();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, url]);

  // The switch is always clickable — a board's `mode` field just syncs the
  // starting position, it never locks the on-screen control. Otherwise a
  // simulated or manually-testing session could get stuck unable to flip it.
  useEffect(() => {
    if (reading?.mode) setManualMode(reading.mode);
  }, [reading?.mode]);

  const activeMode = manualMode;
  const isLive = (status === 'connected' || isSimulating) && result !== null;

  return {
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
    isLive,
    activeMode,
    manualMode,
    setManualMode,
  };
}
