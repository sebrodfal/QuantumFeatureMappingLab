// NOT part of docs/demo-fisico-spec.md — a local testing aid.
//
// Emulates the ESP32 board's WebSocket server so the app's Live Board
// panel (src/hooks/useLiveBoard.js) can be exercised end-to-end before
// Victor's physical hardware exists. Run with `node scripts/mockBoard.js`,
// then in the app's Live Board panel connect to ws://localhost:8787.
//
// Cycles through src/data/stagedScenarios.js — the same six curated
// combinations the app matches against for the "known truth" chip — so
// every reading this sends is guaranteed to trigger a staged match, not
// just a prediction. Also logs the {classicalAlert, quantumAlert} verdicts
// the browser sends back.

import { WebSocketServer } from 'ws';
import { STAGED_SCENARIOS } from '../src/data/stagedScenarios.js';

const PORT = 8787;
const SEND_INTERVAL_MS = 2500;

const MODE_BY_SCENARIO = {
  'quantum-catches-1': 'quantum',
  'quantum-catches-2': 'quantum',
  'classical-false-alarm-1': 'classical',
  'classical-false-alarm-2': 'classical',
  'both-healthy-1': 'quantum',
  'both-deviation-1': 'quantum',
};

const sequence = STAGED_SCENARIOS.map((scenario) => ({
  reading: scenario.reading,
  mode: MODE_BY_SCENARIO[scenario.id] ?? 'quantum',
  label: scenario.label,
}));

const wss = new WebSocketServer({ port: PORT });
console.log(`Mock ESP32 board listening at ws://localhost:${PORT}`);
console.log(`Cycling ${sequence.length} staged scenarios every ${SEND_INTERVAL_MS}ms.`);

wss.on('connection', (socket) => {
  console.log('Browser connected.');
  let i = 0;

  const timer = setInterval(() => {
    if (socket.readyState !== socket.OPEN) return;
    const { reading, mode, label } = sequence[i % sequence.length];
    i += 1;
    socket.send(JSON.stringify({ ...reading, mode }));
    console.log(`-> [${label}]`, reading, `mode=${mode}`);
  }, SEND_INTERVAL_MS);

  socket.on('message', (data) => {
    try {
      console.log('<- verdict', JSON.parse(data.toString()));
    } catch {
      console.log('<- (unparseable message)', data.toString());
    }
  });

  socket.on('close', () => {
    clearInterval(timer);
    console.log('Browser disconnected.');
  });
});
