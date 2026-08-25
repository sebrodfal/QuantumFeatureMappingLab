# Revisión de la integración Kipu — lista de pendientes para Adriana

Contexto: revisión del storytelling del demo tras la integración con Kipu Quantum Hub. Ordenado de lo más general/fácil a lo más específico/dependiente de datos, siguiendo la prioridad que definimos con Sebastián.

## 1. Reordenar la narrativa: resultados primero, teoría después ✅ viable ya mismo

Mover el contenido de la Sección 4 (resultados reales de Kipu) para que aparezca **dentro del reveal del botón "Run DQFE Engine"**, justo después de la Sección 1 (la máquina) — antes del heatmap/scatter/circuito. Primero el "wow, esto funciona" (engancha tanto a público técnico como no técnico), después el "así es como se logra". Esto también es lo que pidió Kipu. Sin dependencias de datos — es reordenar JSX.

## 2. Viabilidad de usar SOLO data de Kipu (perillas + explicación) — revisado, resultado: condicional

Antes de pedirte nada, evaluamos si se puede dejar de usar nuestra data sintética generada localmente, tanto en las perillas como en la explicación de "cómo funciona", y usar solo lo que viene de Kipu (incluyendo reemplazar AUC por sus métricas reales, manteniendo el flag de alerta por caso puntual).

**Conclusión: todo cuelga de una sola cosa — si logramos sincronizar los arrays cuánticos crudos por registro del Output DataPool de Kipu (ver punto 3 abajo).** Si eso sale bien:
- Perillas: dejarían de ser "mové libremente cualquier valor" y pasarían a ser "recorré los ~720 registros reales que Kipu ya evaluó" — es un cambio de tipo de interacción, no solo de fuente de datos, porque no tenemos el algoritmo de Kipu para calcular features nuevas sobre valores que ellos nunca vieron.
- Heatmap/scatter cuántico: se podrían reconstruir con datos reales en vez de la imagen estática que tenemos hoy.
- Métricas: swap directo de AUC por AP/Precision@Recall de Kipu — ya tenemos esos números, no depende de nada más.
- Alerta por caso (enfermo/no enfermo): viable si entrenamos nosotros, localmente, un clasificador sobre las features reales de Kipu (mismo protocolo que usaron ellos: StandardScaler + LogisticRegression, umbral a recall≥90%).

**Límite que no se resuelve aunque la sincronización salga bien:** el diagrama interactivo del circuito (`Circuit.jsx`) no puede mostrar el algoritmo real de Kipu (DQFE/evolución counterdiabatic) porque no tenemos su definición exacta de compuertas — es propietario. Como mucho podemos explicarlo a nivel conceptual/fórmula (como ya hace `documentation.md` con el Hamiltoniano del paper), no como un diagrama gate-por-gate afirmando ser el algoritmo real. Esto no depende de ningún dato que puedas sincronizar — es un techo estructural.

## 3. 🎯 El pedido central para ti: confirmar y sincronizar los arrays cuánticos crudos

`kipuDatapool.js` (línea ~133) describe el Output DataPool como destinado a *"receiving Rimay Quantum Feature Extraction numpy arrays (Xq_train, Xq_test)"*, pero `syncKipuResults.js` **solo descarga** archivos que empiezan con `metrics-`, `pr_curves-`, o `matrix_` (líneas 74-79) — nunca bajó nada más.

**Acción concreta:**
1. Correr `npm run kipu-inspect` (o listar archivos del output datapool a mano) para ver el listado completo.
2. Confirmar si están los arrays `Xq_train`/`Xq_test` (o como se llamen exactamente).
3. Si existen: extender `syncKipuResults.js` para bajarlos también, y avisarnos el formato (numpy/CSV/JSON) para adaptarlo del lado web.
4. Si no existen: avisarnos también — cambia el alcance de todo el punto 2.

Casi todo lo demás de esta lista depende de esta respuesta.

## 4. Detalles técnicos encontrados en la revisión (arreglar en paralelo, no dependen del punto 3)

**Crítico — antes de mostrarlo a alguien técnico:**

- **La animación de "Run DQFE Engine" afirma algo que no pasa.** Muestra texto tipo *"Executing Trotterized Counterdiabatic Evolution on DQFE Core..."*, pero eso no corre localmente — el simulador del navegador sigue siendo nuestro circuito simple RY+CNOT+CZ. Lo real corrió una sola vez, offline, en la nube de Kipu. Reformular el copy para no afirmar ejecución en vivo de algo que no se ejecuta, o enmarcarlo como "revelando resultados ya calculados en la nube". La nota técnica honesta que antes existía ("no pretende demostrar ventaja cuántica") desapareció — traerla de vuelta.

- **El titular "+38.3% AP" omite salvedades que el propio JSON de Kipu ya trae escritas** (`kipuCloudModel.json` → `cloudMetrics.scope`): es *hybrid vs raw*, no *quantum vs raw* (la barra de al lado dice "Quantum: 68.1%", comparación distinta mostrada como la misma historia); `hgb_raw` (clásico no-lineal, sin nada cuántico) saca 89.5% AP, le gana a todo, y el JSON lo advierte explícitamente; la comparación contra un baseline clásico "justo" da "not significant"; el dataset es sintético diseñado a propósito para este resultado. Agregar al menos 1-2 líneas de salvedad visibles cerca del titular.

**Etiquetado — no rompe nada, pero es engañoso si preguntan:**

- El `source: "Kipu Quantum Hub..."` en `kipuCloudModel.json` no corresponde a los pesos que puntúan el Live Board — esos son los locales de siempre (número por número idénticos a `frozenModel.json`). Corregir el `source` o aclarar en el panel que las perillas son simulación local, separado de los resultados reales de Kipu.
- Naming inconsistente: Kipu/scripts dicen "crane", la UI dice "mining shovel". Alinear.
