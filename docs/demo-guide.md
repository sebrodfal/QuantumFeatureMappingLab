# Demo Guide — Quantum Feature Mapping Lab

Presenter's reference for walking a business audience through the demo. Section order matches the app, top to bottom. All numbers are real, unmodified results from the Kipu Quantum Hub benchmark run.

---

## 0. Say this first

**What the model does:** predicts when a hoist cable is heading toward a rupture, early enough to act before it happens.

**The core message — repeat it at the start, the middle, and the end:**

> We do not touch or replace the client's ML model. We transform the data before it reaches their model — same classifier, same training, just a richer view of the same sensor readings.

**Why it works:** the quantum feature map captures how sensors move together (non-linear correlation) — something the raw 4 signals don't show on their own.

---

## 1. Metrics glossary — the short version

Use this table as-is. Don't improvise these definitions.

| Term | What it means |
|---|---|
| **Recall** | Of all the real ruptures, how many the model caught. |
| **Precision** | Of all the alerts the model raised, how many were real ruptures. |
| **Average Precision (AP)** | How well the model tells real ruptures apart from healthy cases, across every alert threshold at once. Higher = better separation. |
| **Average Precision Gain** | How much better one representation separates ruptures from healthy cases than another. |
| **Precision @ 90% Recall** | Fix recall at 90% (both models catch the same 90% of ruptures) and compare precision at that one point. |
| **AUC** | The chance the model ranks a real rupture above a healthy case, picked at random. 0.5 = random guessing, 1.0 = perfect. |
| **False Alarms (%)** | Of all the healthy cases, how many still triggered an alert. |
| **Correlation / non-linear coupling** | How much the features move together. Low = they don't; high = they do. |
| **p-value** | How likely this result is due to chance. Very small = not chance. |

---

## 2. Walking the screen

### 2.1 Source Data (the machine + 4 sensors)

Animated shovel diagram + 4 sensor cards.

| Sensor | Unit | Plain meaning |
|---|---|---|
| Hoist Load | kN | How heavy the load on the cable is, right now |
| Crowd Vib. | mm/s | How much the digging arm is shaking |
| Drive Temp. | °C | How hot the motor is running |
| Cable Tension | MPa | How much strain the cable is under |

Say: these four readings are what the model watches to predict a rupture. Same four numbers feed everything else you're about to see.

### 2.2 "Run DQFE Engine" — the Kipu benchmark reveal

**What's on screen:** a progress animation, then 3 KPI cards + real plots from Kipu Quantum Hub.

**Say once, about the animation:** these results were already computed by Kipu's quantum service, on 3,000 real mining shovel records. The animation is revealing them, not computing them live.

Walk the 3 KPI cards in this order — top to bottom, left to right:

**Step 1 — Average Precision Gain: +38.3%**
Compares two representations on the same 15 test splits: **raw** (4 sensors) vs. **hybrid** (4 sensors + 7 quantum-derived features, given to the model together). Same classifier both times. Statistically confirmed (p ≈ 1 in a billion).

Define "hybrid" the moment you say it: *"the model sees the raw sensors and the quantum features together."*

**Step 2 — Precision @ 90% Recall: 39.0% (hybrid) vs. 26.0% (raw)**
Both models catch the same 90% of ruptures. At that point, hybrid's alerts are real 39% of the time, raw's 26%. Roughly half as many false alarms for the same protection.

**Step 3 — Three-way comparison**

| Representation | Features | Average Precision |
|---|---|---|
| Raw | 4 (sensors only) | 34.5% |
| Quantum | 7 (quantum only) | 68.1% |
| Hybrid | 11 (both) | 72.8% |

Say: quantum alone already nearly doubles raw. Adding raw on top gets the rest of the gain.

### 2.3 How to read the plots

Click **"▼ Show Plots & Correlation Matrices"**.

**Precision-Recall curve — know this one cold:**
- X-axis: recall. Y-axis: precision.
- 4 lines, one per representation, each sweeping its alert threshold from strict to loose: raw (orange, lowest), quantum (light blue), selected hybrid (green, a secondary check), hybrid (navy, highest).
- Shaded band around each line = spread across the 15 test folds. Raw's band and hybrid's band barely overlap — that gap is real, not random noise.
- Flat dotted grey line ("prevalence 0.257") = what a random guess would score.
- Vertical line at recall 0.90 = where the Step 2 numbers (39% / 26%) come from.
- Average Precision = one number summarizing the whole curve, not just one point on it.

**Quantum Feature Matrix:** same kind of correlation grid, for the 7 quantum features, plus a bar chart showing which feature carries the most predictive weight. One line: *"this shows which of the seven quantum features does the most work — and it's an interaction between two sensors, not a direct reading."*

**Raw Sensor Matrix:** same grid for the 4 raw sensors — near-zero everywhere. One line: *"on their own, the raw sensors barely relate to each other."*

### 2.4 Classical vs. Quantum side-by-side (2A / 2B)

Left card = 4 raw sensors. Right card = 7 quantum-derived features. Same classifier both sides.

Say: left side is untouched; right side is the same 4 signals passed through the quantum feature map. Only the representation changes.

**Heatmap:** warm = features rise together, cool = one rises as the other falls. Raw: barely any color. Quantum: real structure.

**Scatter plot:** each dot is one real reading, orange = deviation, teal = healthy. Quantum space: colors separate. Raw space: they overlap.

### 2.5 Impact (4-step strip)

Feature Expansion → Non-linear Coupling → AUC Enhancement → **False Alarms Avoided**.

Lead with False Alarms Avoided, not AUC — it answers the real business question: fewer unnecessary shutdowns, same detection coverage.

### 2.6 Live Board — "quantum catches it, classical doesn't"

The centerpiece scene. Open **📡 Live Board** → **🎚️ Simulate perillas** → click **"Quantum catches it (Classical misses)"**.

**Loads Record #36, a real, known rupture:**

| Sensor | Value |
|---|---|
| Hoist Load | 124.2 kN |
| Crowd Vib. | 6.6 mm/s |
| Drive Temp. | 39.7 °C |
| Cable Tension | 119.3 MPa |

Say while flipping the switch: *"Same numbers, same machine. Classical: no alert. Quantum: catches it."*

Do this twice — once in the walkthrough, once again near the close, slower.

---

## 3. Anticipated questions

| Question | Answer |
|---|---|
| What does the model predict? | Whether the machine is heading toward a cable rupture, early enough to act. |
| What is "hybrid"? | The model sees the raw sensors and the quantum features together. |
| Is the mapping applied to the classical side too? | No — classical is untouched; quantum is the same data, mapped. That's the experiment. |
| Is this the best possible classical model? | No. A non-linear classical model (gradient boosting) on raw alone reaches AP 0.895 — shown on the chart as a reference point, not part of the tested comparison. The tested question is narrower: does adding quantum features improve a fixed, simple classifier? Yes, confirmed. |
| Is this a quantum advantage claim? | No. The quantum features are computed from the same 4 sensor readings. The claim is: this transformation measurably helps this classifier, on this data. |
| Is the dataset real? | The 3,000-record benchmark is a synthetic digital twin. The live interactive demo (2A/2B, Live Board) runs on 1,000 real evaluated records. |
| How often does a rupture happen, and what does it cost? | See §4. |
| Can I get access? | Yes — see §5. |
| Is this running on a real quantum computer right now? | The batch results were computed once by Kipu. What you're driving live is the same trained classifier scoring real cases — not a live quantum circuit. |

---

## 4. Business figures — not fully confirmed

- **Cost per rupture:** ~$50,000 (mentioned in the prior call). Confirm before quoting as a hard number.
- **Frequency:** not available. If asked: *"We're gathering the exact frequency from the client's data — what we know today is each event is a costly, unplanned shutdown, and this system catches the early signal before it happens."*

---

## 5. Closing

- **Live demo:** `https://quantum-feature-mappping-lab.vercel.app/` — any browser, no install, no login.
- **Run it locally:** repo `QuantumFeatureMapppingLab` — `npm install && npm run dev`.
- Offer: "If you want to explore this on your own data, let's talk about what that would take."

---

## 6. Do not say

- The engine "executing now" — say "revealing" precomputed results.
- "14 observables" or a live local circuit — the real, active features are **7**, computed once by Kipu.
- "Quantum advantage" or "beats the best classical model" — it's a fixed, simple-classifier comparison; a stronger non-linear classical model exists and is disclosed on the chart.
- Do use "hybrid" and "+38.3%" — they're real Kipu results and the intended headline. Just define "hybrid" the first time you say it.
