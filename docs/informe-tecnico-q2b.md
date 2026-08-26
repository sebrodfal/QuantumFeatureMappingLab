# Informe técnico — Quantum Feature Mapping Lab

**Para:** preparación del stand NTT DATA × Kipu Quantum, Q2B Copenhagen
**Alcance:** segunda pasada, verificando línea por línea qué código se ejecuta realmente al abrir la app (no solo qué existe en el repo). Fecha 2026-08-25.

> **Nota sobre la primera versión de este informe:** describía `quantumSimulator.js` como "el simulador que corre el mapeo, generando el diagrama de circuito que ve el visitante" — siguiendo lo que dice `README.md`. Al rastrear cada `import` desde `App.jsx` hacia abajo, eso resultó **falso para el estado actual del repo**: ese simulador no tiene ningún llamador alcanzable, y no existe ningún componente de diagrama de circuito en la UI actual. Esta versión corrige eso y, en general, distingue explícitamente **qué corre de verdad** de **qué quedó de una versión anterior del proyecto**.

---

## 1. Qué es esto, en una frase

Una app web (React + Vite) que muestra, para cada uno de 1000 casos reales de telemetría de una pala eléctrica de minería, dos representaciones del mismo dato — **clásica** (4 sensores) y **cuántica** (7 observables, calculados una vez por Kipu Quantum Hub) — y compara cómo se comporta un clasificador de referencia sobre cada una.

Demo en producción: `https://quantum-feature-mappping-lab.vercel.app/`

Hay **dos artefactos distintos** en este repo que no hay que confundir:

| | Qué es | Dónde vive | Implementado en código? |
|---|---|---|---|
| **A. Demo web interactivo** | La app React de este informe | `src/`, `scripts/` | Sí — es lo que se audita acá |
| **B. "Estación 1 — El Encoder"** | Instalación física conceptual (LEDs + fibra óptica sobre topología heavy-hex de IBM) para el stand físico de Q2B | `documentation.md`/`.pdf` | No — es una spec de diseño industrial, sin una línea de código en este repo |

---

## 2. Mapa honesto: qué se ejecuta realmente al abrir la app

Esto es lo que cambia respecto a la primera versión del informe. Trazando cada import desde `App.jsx` hacia abajo, con `src/data/realCases.json` presente en el repo (siempre lo está — es un archivo versionado, ~1000 registros), el flujo real es:

```
App.jsx
  └─ runPipeline(noise)              [src/utils/pipeline.js]
       └─ if (useRealData && realDatasetBundle.records.length > 0)  ← SIEMPRE true
             usa src/data/realCases.json directamente
             recalcula scores/AUC/corr en vivo solo si noise ≠ 1
             return ...                                              ← corta acá
       (todo lo que sigue después de este `if` nunca se ejecuta)
```

`useRealData` tiene default `true`, y los **tres únicos lugares** del repo que llaman a `runPipeline` (`App.jsx`, `scripts/freezeModel.js`, `scripts/syncKipuResults.js`) lo hacen sin pasar ese argumento. Como `realCases.json` siempre trae registros, la condición del `if` es verdadera el 100% de las veces — nunca en la práctica actual se llega al código posterior a ese `return`.

### Tabla: vivo vs. residual

| Pieza | ¿Se ejecuta en la app real? | Detalle |
|---|---|---|
| `src/data/realCases.json` | ✅ Sí, siempre | Fuente única de sensores, `qFeatures`, scores y pesos del modelo |
| `predict()` (`classifier.js`) | ✅ Sí | Recalcula el score clásico y cuántico de cada registro con los pesos de `realCases.json`, cada vez que se mueve el slider de *Plant Noise* |
| `corrMatrix()`, `auc()`, `opPoint()` (`correlation.js`/`classifier.js`) | ✅ Sí, condicional | Se recalculan en vivo solo cuando `noise ≠ 1` (con `noise = 1`, valor por defecto, se reutilizan los `corr`/`auc`/`op` ya guardados en el JSON) |
| `findNearestRealRecord()` / `liveScore()` (`liveScore.js`) | ✅ Sí | Usado por el Live Board (perillas simuladas o ESP32 real): busca el registro real más parecido y **lee su score ya calculado** — no ejecuta ningún modelo |
| `quantumSimulator.js` (`qFeatures`, RY+CNOT+CZ, 14 observables) | ❌ No, inalcanzable | Importado solo por la rama muerta de `pipeline.js` (ver abajo) |
| `trainModels()`, `logreg()` (entrenamiento) | ❌ No, inalcanzable | Misma rama muerta — nada entrena en el navegador hoy |
| `genData()` (`syntheticData.js`) | ❌ No, inalcanzable *desde `pipeline.js`* — pero sí lo usa `scripts/generateDatapool.js` de forma independiente, offline | Generador del dataset sintético original |
| `src/data/frozenModel.json` | ❌ No, efectivamente | Ver sección 4 — se importa pero nunca se usa por un detalle de cortocircuito de JS |
| Diagrama de circuito cuántico (gates) | ❌ No existe | No hay ningún componente `Circuit*.jsx` en `src/components` hoy; `QuantumCircuitSection.jsx` es solo una animación de texto + `CloudBenchmarkSection` |

---

## 3. Por qué `quantumSimulator.js` es código residual

`src/utils/pipeline.js` tiene dos ramas dentro de `runPipeline()`:

```js
export function runPipeline(noise = 1, frozenTraining = null, useRealData = true) {
  if (useRealData && realDatasetBundle?.records?.length > 0) {
    // ... arma todo desde realCases.json y hace return acá
    return { classical, quantum, test, records, training };
  }

  // ---- todo lo de abajo es inalcanzable en el estado actual del repo ----
  const test = genData(500, noise, 7);
  const training = frozenTraining ?? trainModels(noise);   // trainModels() usa qFeatures()
  const testQuantum = testScaled.map(qFeatures);            // única otra llamada a qFeatures()
  ...
}
```

`qFeatures()` (el simulador de 4 qubits con `ry`/`cnot`/`cz` sobre un statevector de 16 amplitudes) solo se invoca dentro de `trainModels()` y en esa segunda mitad de `runPipeline()` — ambas alcanzables únicamente si `useRealData` fuera `false` o si `realCases.json` no existiera. Ninguna de las dos condiciones ocurre hoy.

Tampoco hay ningún componente de UI que lo importe directamente para dibujar un circuito: busqué cualquier archivo `Circuit*.jsx` o referencia a compuertas en `src/components` y no existe. `QuantumCircuitSection.jsx` (el botón "⚡ Run DQFE Engine") es una animación de progreso con texto tipo *"Executing Trotterized Counterdiabatic Evolution..."* que, al completarse, simplemente muestra `CloudBenchmarkSection` — gráficos e imágenes ya generados, no nada calculado en el momento.

**Conclusión:** `quantumSimulator.js` es casi con certeza el mapeo cuántico *original* del proyecto (antes de integrar el dataset real de Kipu) — coherente con lo que describen `README.md` y `docs/demo-fisico-spec.md`, ambos escritos para una versión anterior en la que todo se entrenaba y simulaba en el navegador. Cuando se integró `realCases.json`, se agregó el `return` temprano y esa rama quedó sin ningún llamador alcanzable, pero el archivo nunca se borró. Es residuo, no una simulación pedagógica activa.

---

## 4. El Live Board / panel físico tampoco ejecuta el modelo — hace *nearest-neighbor lookup*

Otra corrección importante respecto al primer informe: ni el modo "Simulate perillas" ni el WebSocket a un ESP32 real corren el clasificador en vivo. `src/utils/liveScore.js`:

```js
export function liveScore(physicalReading, activeModel = realCases || kipuCloudModel || frozenModel) {
  const model = activeModel?.classical ? activeModel : realCases;
  const records = realCases?.records || [];
  const snap = findNearestRealRecord(physicalReading, records);
  const r = snap?.bestRecord || records[0];
  ...
  const classicalScore = r ? r.classicalScore : 0;   // leído del JSON, no calculado
  const quantumScore = r ? r.quantumScore : 0;        // leído del JSON, no calculado
  ...
}
```

El parámetro por defecto `activeModel = realCases || kipuCloudModel || frozenModel` es un `||` encadenado: como `realCases` (el JSON importado) siempre es un objeto truthy, **siempre** gana el primer operando. `kipuCloudModel` y `frozenModel` nunca se evalúan como resultado — quedan importados pero inertes en esta función. Y el propio `model` reasignado dos líneas después también termina siendo `realCases`, porque `realCases.classical` existe.

Lo que hace `liveScore()` es: tomar la lectura física (perilla o ESP32), convertirla a `[0,1]` con `calibration.js`, buscar por distancia euclídea el registro más parecido entre los 1000 de `realCases.json`, y **devolver el `classicalScore`/`quantumScore` que ya venían guardados en ese registro** — sin correr `predict()`, sin `qFeatures()`, sin ningún modelo. Es un *snap* a un resultado precalculado, no una inferencia en vivo.

**Consecuencia práctica:** `src/data/frozenModel.json` — el archivo que `README.md` y `docs/demo-fisico-spec.md` describen como la pieza central que hace "reproducible" al panel físico ("el board da siempre el mismo veredicto ante la misma posición de perillas") — **no se usa hoy para ese propósito**. La reproducibilidad viene, en la práctica, de que `realCases.json` es un archivo estático: el mismo registro más cercano siempre da el mismo score guardado, con o sin `frozenModel.json` en el medio.

Además: no hay ningún script en este repo que genere `realCases.json`. Rastreé todos los `scripts/*.js`/`*.py` y ninguno lo escribe — a diferencia de `frozenModel.json` (`scripts/freezeModel.js`) o `kipuCloudModel.json` (`scripts/syncKipuResults.js`), que sí tienen su script de generación visible. `realCases.json` llegó al repo por otra vía (probablemente un proceso ad-hoc del lado de Kipu o un script no versionado) — no es reproducible solo con lo que hay acá.

---

## 5. Lo que sí es real y vivo: recalculo en vivo al mover el slider de ruido

No todo el lado "clásico" del código es residual — esto es importante para no sobrecorregir. Dentro de la rama real de `runPipeline()`:

```js
const classicalScores = predict(classical, classicalZ);         // SIEMPRE se recalcula
const classicalAuc = delta === 0 ? classical.auc : auc(y, classicalScores);   // solo si noise≠1
const classicalOp = opPoint(classicalScores, TARGET_RECALL);      // solo si noise≠1 (via corr también)
```

- `predict()` (`classifier.js`) se recalcula **siempre**, en cada render, aplicando los pesos ya entrenados (guardados en `realCases.json`) sobre los 4 sensores — perturbados por el slider de *Plant Noise* — para producir el score que se ve en el scatter plot y en la tarjeta de cada registro.
- `corrMatrix()`, `auc()` y `opPoint()` se recalculan **solo cuando `noise ≠ 1`** (el `delta` de la perturbación es distinto de cero); con el valor por defecto se reutilizan los `corr`/`auc`/`op` ya guardados en el JSON, por eficiencia.
- Para el lado cuántico, el mismo `predict()` corre sobre los `qFeatures` — pero esos `qFeatures`, al mover el ruido, **no se recalculan vía ningún circuito**: se obtiene el `qFeatures` del registro real más cercano dentro de un radio de búsqueda de ±50 posiciones (mismo patrón de "snap" que en `liveScore.js`).

O sea: el clasificador de regresión logística (`predict`/`auc`/`opPoint`/`corrMatrix`) **sí está vivo y corre en el navegador** — es la parte de entrenamiento (`logreg`) y de generación de features cuánticos nuevos (`qFeatures`) lo que no lo está.

---

## 6. `kipuCloudModel.json` — parcialmente vivo, parcialmente residual

Este archivo se importa en dos lugares independientes, con destinos distintos:

- **`CloudBenchmarkSection.jsx`** lo importa directamente y usa su campo `cloudMetrics` (AP raw/quantum/hybrid, p-valor, curvas PR) para pintar los KPIs y las imágenes de la sección "4. Real Cloud Solver Benchmark". **Esto sí es visible y vivo.**
- **`liveScore.js`** también lo importa, pero — como se explicó en la sección 4 — nunca se usa por el cortocircuito del `||`. Los campos `classical`/`quantum` (pesos, threshold) que trae este archivo, que según `docs/kipu-integration-review.md` son numéricamente idénticos a los de `frozenModel.json`, no llegan a pintarse en ningún lado.

---

## 7. El recorrido narrativo de la UI (confirmado, sin cambios respecto a la primera pasada)

1. **Sección 1 — Fuente física.** `MachineDiagram.jsx` + 4 `SensorCard`.
2. **Botón "Run DQFE Engine"** (`QuantumCircuitSection.jsx`) → animación de progreso → revela `CloudBenchmarkSection.jsx` (KPIs y plots reales de Kipu Hub).
3. **Sección 2A/2B** (`FeatureSpaceCard.jsx`, un único componente parametrizado): heatmap (`Heatmap.jsx`), scatter (`Scatter.jsx`/`ScatterCard.jsx`), métricas de validación y veredicto del registro seleccionado.
4. **Sección 3 — Impacto agregado** (`FeatureSpaceComparison.jsx`): cadena causal de 4 pasos.
5. **Nota metodológica** (`MethodologyNote.jsx`).

Controles: `StickyControls.jsx` (sliders de *Plant Noise* y de registro, ambos paneles flotantes y arrastrables vía `useDraggable.js`) y `LiveBoardPanel.jsx` (switch clásico/cuántico vía `ModeSwitch.jsx`, y `SimulatedBoardPanel.jsx` con los 4 sliders "perilla").

Detalle menor de cableado, sin impacto visible: `LiveBoardPanel.jsx` pasa un prop `onStop={stopSimulation}` a `SimulatedBoardPanel`, pero ese componente desestructura `_onStop` (no `onStop`) y no tiene ningún botón "Stop" propio — el prop simplemente no se usa. No rompe nada porque nada lo necesita, pero es la misma clase de desalineación entre lo que se pasa y lo que se consume.

> **Actualización:** este detalle de cableado ya se corrigió en el código (ver sesión posterior) — `onStop` está conectado y hay un botón "⏻ Exit Simulation" en `SimulatedBoardPanel.jsx`.

---

## 8. Los "dos" mapeos cuánticos — versión corregida

| | `quantumSimulator.js` (local) | Rimay DQFE (Kipu, real) |
|---|---|---|
| ¿Corre hoy en la app? | **No** — inalcanzable | **No en vivo** — corrió una vez, offline, y sus resultados quedaron guardados en `realCases.json`/`kipuCloudModel.json` |
| Qué produce | 14 observables (4×⟨Z⟩, 4×⟨X⟩, 6×⟨ZZ⟩) | 7 observables (`q0..q3`, `corr_0_1`, `corr_1_2`, `corr_1_3`) |
| Compuertas | RY + CNOT + CZ, diseño propio | Dinámica counterdiabatic trotterizada, algoritmo propietario de Kipu (no replicado acá) |
| Se ve en la UI hoy | No — no hay diagrama de circuito en pantalla | Indirectamente — sus resultados alimentan todos los números y gráficos que sí se ven |

En ambos casos, lo que el visitante ve en pantalla **no es un cómputo cuántico ejecutándose frente a sus ojos** — es, en el mejor de los casos, la revelación de un resultado ya calculado en la nube de Kipu; en el peor (si se pregunta específicamente por el simulador local o el diagrama de compuertas), es simplemente código que ya no está conectado a nada.

---

## 9. Integración con Kipu Quantum Hub — pipeline offline (sin cambios respecto a la primera pasada)

Estos scripts siguen siendo precisos tal como se documentaron antes — son herramientas de build-time/offline, no parte del runtime del navegador:

1. **`generateDatapool.js`** — genera el dataset sintético (2000 train / 1000 test) en formato Rimay (`data.json`), usando `genData()` de forma independiente de `pipeline.js`.
2. **`kipuDatapool.js`** — crea/gestiona DataPools de entrada/salida en Kipu Hub (`@quantum-hub/qhub-api`), sube `data.json`.
3. **`submitRimayJob.js`** / **`run_rimay.py`** — envían el job al servicio `crane-anomaly-demo` (backend `ibm_aer`) vía `@quantum-hub/qhub-service`.
4. **`syncKipuResults.js`** — descarga métricas/plots a `public/cloud_artifacts/` (confirmé que los 3 archivos referenciados por `CloudBenchmarkSection.jsx` existen ahí) y regenera `kipuCloudModel.json` — pero llama a `runPipeline()` para obtener `training.classicalModel`/`quantumModel`, y como se explicó en la sección 2, `runPipeline()` hoy **no entrena nada** — solo repackagea los pesos que ya vienen en `realCases.json`. Es decir, `npm run kipu-sync` hoy no "sincroniza pesos nuevos", solo copia los existentes con un timestamp nuevo.
5. **`freezeModel.js`** — mismo problema: llama a `runPipeline(1)`, que no entrena, así que `frozenModel.json` hoy es efectivamente una copia con otro formato de los pesos de `realCases.json` — y, como se vio en la sección 4, ese archivo ni siquiera se usa después.
6. **`inspectKipuService.js`** — introspección del servicio de marketplace (OpenAPI), utilidad de debugging.

**Pendiente ya señalado por el propio equipo** en `docs/kipu-integration-review.md`: el Output DataPool debía recibir los arrays crudos `Xq_train`/`Xq_test` de Rimay, pero `syncKipuResults.js` nunca los descarga — solo métricas/gráficos. Sin eso, no hay forma de re-entrenar contra datos cuánticos nuevos ni de que `freezeModel.js`/`kipu-sync` dejen de ser una repackagearon de lo mismo.

---

## 10. Panel físico / Live Board (ESP32) — sección de arquitectura sin cambios, con la corrección de la sección 4

Documentado en `docs/demo-fisico-spec.md`. La arquitectura descrita (ESP32 como periférico I/O puro, WebSocket bidireccional, `useLiveBoard.js`, `mockBoard.js`, `stagedScenarios.js`, `findCuratedCases.js`, `calibration.js`) es correcta como descripción de la interfaz — lo único que cambia respecto al primer informe es **qué hace `liveScore.js` con esos datos una vez que llegan**: no corre el modelo, hace *nearest-neighbor snap* contra `realCases.json` (sección 4).

`src/data/calibration.js` sigue teniendo `hoistLoad`/`crowdVib` como placeholder (`confirmed: false`) — sin validar con ingeniería real, tal como estaba documentado.

---

## 11. "Estación 1 — El Encoder" — instalación conceptual para Q2B (no es código, sin cambios)

`documentation.md`/`.pdf` sigue siendo un documento de diseño físico separado, no implementado en este repositorio. Ver la primera pasada de este informe si se necesita el detalle completo (Hamiltoniano, convención de color morado/cian, topología heavy-hex de 25 nodos, pendientes explícitos del documento). No encontré nada en `src/` o `scripts/` que lo referencie o lo consuma — es completamente independiente del código auditado en este informe.

---

## 12. Cómo correrlo

```bash
npm install
npm run dev                # http://localhost:5173 — demo web

npm run freeze-model       # regenera frozenModel.json (hoy: no usado en runtime, ver §4)
npm run find-curated-cases # regenera docs/curated-cases.json (calibración de perillas físicas)
npm run mock-board         # servidor WS falso en :8787

npm run generate-datapool  # genera datapool_artifacts/data.json (dataset sintético, formato Rimay)
npm run kipu-datapool      # gestiona DataPools en Kipu Hub (requiere .env)
npm run kipu-submit        # envía el job Rimay DQFE a Kipu Hub
npm run kipu-sync          # descarga métricas/plots + regenera kipuCloudModel.json (hoy: no re-entrena, ver §9)
npm run kipu-inspect       # inspecciona el servicio de marketplace de Kipu
```

---

## 13. Recomendaciones antes del evento

1. **Si alguien técnico pregunta "¿qué corre en vivo cuando aprieto Run DQFE Engine o muevo una perilla?"**, la respuesta verificada es: se recalcula en vivo la regresión logística (`predict()`) sobre pesos ya entrenados, y para el lado cuántico se hace *snap* al registro real más parecido de los 1000 ya evaluados por Kipu — ningún circuito cuántico corre en el navegador, ni siquiera el simulador local, que hoy no tiene ningún llamador activo.
2. **`README.md` y `docs/demo-fisico-spec.md` describen una versión anterior del proyecto** (entrenamiento en el navegador, simulador cuántico local activo, `frozenModel.json` como pieza central del panel físico). Vale la pena actualizarlos o al menos anotar en el propio repo que quedaron desactualizados tras integrar `realCases.json`, para que nadie del equipo asuma que ese comportamiento sigue vigente.
3. **Decidir qué hacer con el código muerto** (`quantumSimulator.js`, `trainModels`/`logreg` en `pipeline.js`, la rama sintética de `runPipeline`, `frozenModel.json`): mantenerlo como estaba en la primera versión antes de la integración con Kipu (documentado, con test aparte) o eliminarlo — hoy convive en el repo sin indicación de que esté desconectado, lo cual generó exactamente la confusión que motivó esta segunda revisión.
4. **Aclarar la procedencia de `realCases.json`** antes del evento — no hay script en el repo que lo regenere; si se pierde o hay que reproducirlo (por ejemplo para otro dataset), hoy no hay un camino documentado para hacerlo desde cero con lo que hay en `scripts/`.
5. Los puntos de honestidad ya señalados por el propio equipo en `docs/kipu-integration-review.md` (headline "+38.3% AP" comparando hybrid vs. raw en vez de quantum vs. raw, el baseline clásico no-lineal `hgb_raw` que gana a todo, el copy de la animación afirmando una ejecución que no ocurre) siguen vigentes y aplican con más fuerza ahora que se confirmó que ni siquiera el simulador local corre — el copy actual sobre-promete dos veces, no una.
