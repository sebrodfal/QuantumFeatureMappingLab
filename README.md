# Quantum Feature Mapping Lab

Demo interactivo (React + Vite) que compara dos representaciones de la
misma telemetría de una pala eléctrica de minería (shovel): una
**representación clásica** (los 4 sensores crudos) y una **representación
cuántica** (14 observables derivados de un circuito simulado de 4 qubits).
Ambas representaciones se validan con el mismo clasificador de referencia
(regresión logística) para mostrar cómo cambia el espacio de features, no
para afirmar que "lo cuántico es mejor".

Demo en producción: https://quantum-feature-mappping-lab.vercel.app/

## Cómo correrlo

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # build de producción en dist/
npm run lint      # oxlint
```

## Qué muestra el demo

1. **Fuente física** — un shovel eléctrico sintético con 4 señales: Hoist
   Load, Crowd Vib., Drive Temp., Cable Tension.
2. **Representación clásica (2A)** vs **representación cuántica (2B)** —
   mismos 4 valores, pasados por un mapeo cuántico real (RY + CNOT + CZ,
   sin librerías, `src/utils/quantumSimulator.js`) que produce 14
   observables ⟨Z⟩/⟨X⟩/⟨ZZ⟩.
3. **Comparación de espacio de features** — correlación promedio, AUC y
   tasa de falsas alarmas de cada representación, al mismo objetivo de
   recall (≥ 80%).
4. **Circuito cuántico** — diagrama de compuertas, generado desde el mismo
   código que corre el mapeo (no hay una versión "ilustrativa" aparte).

Todo el dataset es sintético y determinista para un nivel de ruido dado
(`Plant Noise`), generado en el navegador — no hay llamadas a red ni datos
reales involucrados en esta parte.

## Estructura del proyecto

```
src/
├── data/            # constants.js, calibration.js, stagedScenarios.js, frozenModel.json
├── utils/           # quantumSimulator, syntheticData, numeric, classifier,
│                     # correlation, pipeline, liveScore, decisionStatus
├── hooks/           # useThresholdPopover, useLiveBoard
├── components/      # un componente por carpeta (Header, Heatmap, Scatter,
│                     # FeatureSpaceCard, LiveBoardPanel, MachineDiagram, ...)
├── styles/App.css
└── App.jsx          # coordinador: estado + composición
scripts/
├── freezeModel.js        # congela los pesos del modelo a src/data/frozenModel.json
├── findCuratedCases.js    # barre las 4 perillas y encuentra casos de contraste
└── mockBoard.js           # servidor WS falso que emula el ESP32, para probar sin hardware
docs/
├── demo-fisico-spec.md    # spec de la fusión con el panel físico (ESP32)
└── curated-cases.json     # salida de findCuratedCases.js
```

`App.jsx` es solo el coordinador: mantiene el estado (`noise`, `sample`,
`circuitOpen`) y compone los componentes; toda la lógica de simulación,
clasificación y estilos vive en sus propios módulos.

## Panel físico / Live Board

Además del demo en navegador, el proyecto tiene una capa para fusionarse
con un panel físico (perillas + switch + buzzer en un ESP32), documentada
en detalle en [`docs/demo-fisico-spec.md`](docs/demo-fisico-spec.md).

**Idea central:** el ESP32 nunca reimplementa el clasificador ni el
simulador cuántico — es un periférico de I/O. La página web (que ya tiene
todo el modelo) recibe las lecturas físicas y calcula el veredicto.

### Modelo congelado

El pipeline normalmente reentrena en cada carga de página. Para que el
panel físico dé siempre el mismo resultado ante la misma posición de
perillas, los pesos se congelan una vez:

```bash
npm run freeze-model
```

Esto genera `src/data/frozenModel.json` (pesos, medias/desviaciones de
estandarización y umbrales de operación de ambos modelos, a `noise = 1`).
`src/utils/liveScore.js` usa ese archivo para puntuar cualquier lectura
física en tiempo real, sin reentrenar.

### Probarlo sin hardware

En el demo, botón **📡 Live Board** (arriba a la izquierda) → pestaña
**🎚️ Simulate perillas**: cuatro sliders (en unidades reales: kN, mm/s,
°C, MPa) que sustituyen a las perillas físicas. Corre 100% en el
navegador — no necesita servidor ni conexión a nada. Sirve para demos en
reuniones sin esperar al hardware de Victor.

También hay una pestaña **🔌 Real board** para conectarse por WebSocket a
un board real o al mock:

```bash
npm run mock-board   # levanta ws://localhost:8787 emulando al ESP32
```

Protocolo (mismo formato para el mock y para el ESP32 real):

```jsonc
// ESP32 -> navegador
{ "hoistLoad": 437.5, "crowdVib": 12.5, "driveTemp": 200, "cableTension": 200, "mode": "quantum" }

// navegador -> ESP32
{ "classicalAlert": false, "quantumAlert": true }
```

### Casos curados

```bash
npm run find-curated-cases
```

Barre el espacio físico de las 4 variables contra el modelo congelado y
escribe `docs/curated-cases.json` con las combinaciones más limpias donde
clásico y cuántico coinciden o discrepan — usado para calibrar las
muescas de las perillas físicas y como set de datos para
`src/data/stagedScenarios.js`.

### Rangos de calibración

`src/data/calibration.js` mapea cada perilla (unidades reales) al dominio
`[0,1]` en el que el modelo fue entrenado. **Drive Temp. y Cable Tension**
ya usan los valores propuestos por Victor; **Hoist Load y Crowd Vib.**
siguen como placeholder (`confirmed: false`) hasta validarlos con
criterio de ingeniería real.

### "Verdad conocida" (falsos positivos/negativos)

El clasificador puntúa cualquier lectura, pero no existe una verdad
independiente para una posición arbitraria de las perillas — ni el
dataset de entrenamiento ni el de test son datos reales, y una lectura
física nunca pasó por el generador que asigna etiquetas. Por eso
`src/data/stagedScenarios.js` guarda un puñado de combinaciones curadas
con una verdad asignada a mano (`knownTruth`), marcadas explícitamente
como `reviewed: false` hasta que alguien con criterio de ingeniería real
las confirme.
