# Guía del Demo — Quantum Feature Mapping Lab

Referencia para quien presenta el demo a una audiencia de negocio. El orden de las secciones sigue exactamente el orden de la app, de arriba hacia abajo. Todos los números son reales, sin modificar, del benchmark corrido en Kipu Quantum Hub.

*(Los nombres de botones, pestañas y tarjetas quedan en inglés entre comillas porque así aparecen en pantalla — dígalos tal cual los ve la audiencia.)*

---

## 0. Diga esto primero

**Qué hace el modelo:** predice cuándo un cable de izaje está por romperse, con tiempo suficiente para actuar antes de que pase.

**El mensaje central — repítalo al principio, a la mitad, y al cierre:**

> No tocamos ni reemplazamos el modelo de ML del cliente. Transformamos los datos antes de que lleguen a su modelo — mismo clasificador, mismo entrenamiento, solo una vista más rica de las mismas lecturas de sensores.

**Por qué funciona:** el mapeo cuántico de features captura cómo se mueven los sensores entre sí (correlación no lineal) — algo que las 4 señales crudas no muestran por sí solas.

---

## 1. Glosario de métricas — versión corta

Use esta tabla tal cual. No improvise estas definiciones.

| Término | Qué significa |
|---|---|
| **Recall** | De todas las rupturas reales, cuántas detectó el modelo. |
| **Precision** | De todas las alertas que dio el modelo, cuántas eran rupturas reales. |
| **Average Precision (AP)** | Qué tan bien el modelo distingue rupturas reales de casos sanos, considerando todos los umbrales de alerta a la vez. Más alto = mejor separación. |
| **Average Precision Gain** | Cuánto mejor separa una representación las rupturas de los casos sanos, comparada con otra. |
| **Precision @ 90% Recall** | Fije el recall en 90% (ambos modelos detectan el mismo 90% de rupturas) y compare la precision en ese punto exacto. |
| **AUC** | La probabilidad de que el modelo puntúe más alto a una ruptura real que a un caso sano, elegidos al azar. 0.5 = adivinar al azar, 1.0 = perfecto. |
| **False Alarms (%)** | De todos los casos sanos, cuántos igual dispararon una alerta. |
| **Correlación / acoplamiento no lineal** | Cuánto se mueven las features entre sí. Bajo = no se relacionan; alto = sí. |
| **p-value** | Qué tan probable es que este resultado sea pura casualidad. Muy chico = no es casualidad. |

---

## 2. Recorriendo la pantalla

### 2.1 Datos fuente (la máquina + 4 sensores)

Diagrama animado de la pala + 4 tarjetas de sensor.

| Sensor | Unidad | Significado simple |
|---|---|---|
| Hoist Load | kN | Qué tan pesada es la carga en el cable, ahora mismo |
| Crowd Vib. | mm/s | Cuánto está vibrando el brazo de excavación |
| Drive Temp. | °C | Qué tan caliente está funcionando el motor |
| Cable Tension | MPa | Cuánta tensión está soportando el cable |

Diga: estas cuatro lecturas son lo que el modelo observa para predecir una ruptura. Los mismos cuatro números alimentan todo lo que va a ver después.

### 2.2 "Run DQFE Engine" — la revelación del benchmark real de Kipu

**Qué se ve en pantalla:** una animación de progreso, después 3 tarjetas de KPI + gráficos reales de Kipu Quantum Hub.

**Diga esto una sola vez, sobre la animación:** estos resultados ya fueron calculados por el servicio cuántico de Kipu, sobre 3.000 registros reales de la pala. La animación los está revelando, no calculándolos en vivo.

Recorra las 3 tarjetas de KPI **en este orden exacto** — así están ordenadas en pantalla, de arriba hacia abajo:

**Paso 1 — Average Precision Gain: +38.3%**
Compara dos representaciones sobre los mismos 15 splits de test: **raw** (4 sensores) vs. **hybrid** (4 sensores + 7 features cuánticas, dadas al modelo juntas). Mismo clasificador las dos veces. Estadísticamente confirmado (p ≈ 1 en mil millones).

Defina "hybrid" apenas lo diga: *"el modelo ve los sensores crudos y las features cuánticas juntas, al mismo tiempo."*

**Paso 2 — Precision @ 90% Recall: 39.0% (hybrid) vs. 26.0% (raw)**
Ambos modelos detectan el mismo 90% de las rupturas. En ese punto, las alertas de hybrid son reales el 39% de las veces, las de raw el 26%. Aproximadamente la mitad de falsas alarmas para la misma protección.

**Paso 3 — Comparación de las tres**

| Representación | Features | Average Precision |
|---|---|---|
| Raw | 4 (solo sensores) | 34.5% |
| Quantum | 7 (solo cuánticas) | 68.1% |
| Hybrid | 11 (ambas) | 72.8% |

Diga: quantum sola ya casi duplica a raw. Sumar raw encima consigue el resto de la ganancia.

### 2.3 Cómo leer los gráficos

Click en **"▼ Show Plots & Correlation Matrices"**.

**Curva Precision-Recall — esta hay que saberla de memoria:**
- Eje X: recall. Eje Y: precision.
- 4 líneas, una por representación, cada una recorriendo su umbral de alerta de estricto a laxo: raw (naranja, la más baja), quantum (celeste), selected hybrid (verde, una verificación secundaria), hybrid (azul oscuro, la más alta).
- La banda sombreada alrededor de cada línea = la dispersión entre los 15 folds de test. Las bandas de raw y de hybrid casi no se superponen — esa brecha es real, no es ruido.
- La línea gris punteada horizontal ("prevalence 0.257") = lo que puntuaría adivinar al azar.
- La línea vertical en recall 0.90 = de ahí salen los números del Paso 2 (39% / 26%).
- Average Precision = un solo número que resume toda la curva, no un punto puntual.

**Quantum Feature Matrix:** la misma grilla de correlación, pero para las 7 features cuánticas, con un gráfico de barras al lado que muestra qué feature aporta más peso predictivo. Una línea alcanza: *"esto muestra cuál de las siete features cuánticas hace más trabajo — y no es una de las cuatro lecturas directas, es una interacción entre dos sensores."*

**Raw Sensor Matrix:** la misma grilla para los 4 sensores crudos — casi todo en cero. Una línea: *"esta es la base — por sí solos, los sensores crudos casi no se relacionan entre ellos."*

### 2.4 Clásico vs. Cuántico lado a lado (2A / 2B)

Tarjeta izquierda = 4 sensores crudos. Tarjeta derecha = 7 features derivadas cuánticas. Mismo clasificador en ambos lados.

Diga: el lado izquierdo está sin tocar; el lado derecho son las mismas 4 señales pasadas por el mapeo cuántico de features. Solo cambia la representación.

**Heatmap:** cálido = las features suben juntas, frío = una sube mientras la otra baja. Raw: casi sin color. Quantum: estructura real.

**Scatter plot:** cada punto es una lectura real, naranja = desviación, verde azulado = sano. En el espacio cuántico los colores se separan. En el espacio raw se superponen.

### 2.5 Impacto (tira de 4 pasos)

Feature Expansion → Non-linear Coupling → AUC Enhancement → **False Alarms Avoided**.

Comience por False Alarms Avoided, no por AUC — es la pregunta de negocio real: menos paradas innecesarias, misma cobertura de detección.

### 2.6 Live Board — "cuántico lo detecta, clásico no"

La escena central del demo. El switch Clásico/Cuántico ahora también está visible directamente en la Sección 1, arriba del diagrama de la pala — se puede mover ahí mismo, sin abrir ningún panel. Para cargar el caso curado específico de abajo, abra **📡 Live Board** → **🎚️ Simulate perillas** → haga clic en **"Quantum catches it (Classical misses)"**.

**Carga el Record #36, una ruptura real y conocida:**

| Sensor | Valor |
|---|---|
| Hoist Load | 124.2 kN |
| Crowd Vib. | 6.6 mm/s |
| Drive Temp. | 39.7 °C |
| Cable Tension | 119.3 MPa |

Diga mientras cambia el switch: *"Mismos números, misma máquina. Clásico: sin alerta. Cuántico: la detecta."*

Haga esto dos veces — una vez en el recorrido normal, otra vez cerca del cierre, más despacio.

---

## 3. Preguntas anticipadas

| Pregunta | Respuesta |
|---|---|
| ¿Qué predice el modelo? | Si la máquina va camino a una ruptura de cable, con tiempo suficiente para actuar. |
| ¿Qué es "hybrid"? | El modelo ve los sensores crudos y las features cuánticas juntas. |
| ¿El mapeo se aplica también al lado clásico? | No — clásico queda sin tocar; cuántico son los mismos datos, mapeados. Esa asimetría es el experimento. |
| ¿Es el mejor modelo clásico posible? | No. Un modelo clásico no lineal (gradient boosting) sobre raw solo llega a AP 0.895 — se muestra en el gráfico como punto de referencia, no forma parte de la comparación testeada. La pregunta testeada es más acotada: ¿sumar features cuánticas mejora a un clasificador fijo y simple? Sí, confirmado. |
| ¿Es una afirmación de ventaja cuántica? | No. Las features cuánticas se calculan a partir de las mismas 4 lecturas de sensores. La afirmación es: esta transformación ayuda de forma medible a este clasificador, sobre estos datos. |
| ¿El dataset es real? | El benchmark de 3.000 registros es un gemelo digital sintético. El demo interactivo en vivo (2A/2B, Live Board) corre sobre 1.000 registros reales ya evaluados. |
| ¿Cada cuánto pasa una ruptura y cuánto cuesta? | Ver §4. |
| ¿Puedo tener acceso? | Sí — ver §5. |
| ¿Esto corre en una computadora cuántica real en este momento? | Los resultados del batch se calcularon una sola vez, en Kipu. Lo que se maneja en vivo con los sliders es el mismo clasificador ya entrenado puntuando casos reales — no un circuito cuántico corriendo en vivo. |

---

## 4. Cifras de negocio — no confirmadas del todo

- **Costo por ruptura:** ~USD 50.000 (mencionado en la llamada previa). Confirmar antes de citarlo como número duro.
- **Frecuencia:** no disponible. Si preguntan: *"Estamos reuniendo la frecuencia exacta con los datos operativos del cliente — lo que sabemos hoy es que cada evento es una parada costosa y no planificada, y este sistema detecta la señal temprana antes de que pase."*

---

## 5. Cierre

- **Demo en vivo:** `https://quantum-feature-mappping-lab.vercel.app/` — cualquier navegador, sin instalar, sin login.
- **Correrlo local:** repo `QuantumFeatureMapppingLab` — `npm install && npm run dev`.
- Ofrezca: "Si quieren explorar esto con sus propios datos, hablemos de qué haría falta."

---

## 6. Qué no decir

- El motor "ejecutando ahora" — diga que está "revelando" resultados ya calculados.
- "14 observables" o un circuito local corriendo en vivo — las features cuánticas reales y activas son **7**, calculadas una sola vez por Kipu.
- "Ventaja cuántica" o "le gana al mejor modelo clásico" — es una comparación con un clasificador fijo y simple; existe un modelo clásico no lineal más fuerte y está señalado en el gráfico.
- Sí use "hybrid" y "+38.3%" — son resultados reales de Kipu y el titular pensado para el demo. Solo defina "hybrid" la primera vez que lo diga.
