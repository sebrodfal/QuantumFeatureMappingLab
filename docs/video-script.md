# Video Script — Quantum Feature Mapping Lab

Narrated screen recording, ~8–9 minutes. Read the narration as written; **[SCREEN]** tells you what to click. All numbers are real, unmodified results from the Kipu Quantum Hub benchmark run.

**Rule:** every visual on screen gets a spoken line.

---

## 0. Cold open (0:00–0:30)

**[SCREEN]** Landing view.

**Narration:**
> "This is a live demo, no login, runs in any browser. Here's the goal: predict when a hoist cable is heading toward a rupture, early enough to act before it happens. And here's the one idea behind everything you'll see: **we don't touch or replace your ML model. We transform the data before it reaches your model** — same classifier, same training, just a richer view of the same sensor readings."

---

## 1. The source data (0:30–1:15)

**[SCREEN]** Section 1 — shovel diagram + 4 sensor cards.

**Narration:**
> "Four sensors on an electric mining shovel. **Hoist Load** — how heavy the load on the cable is. **Crowd Vibration** — how much the digging arm is shaking. **Drive Temperature** — how hot the motor is running. **Cable Tension** — how much strain the cable is under. These four readings are what the model watches to predict a rupture. Same data, feeding everything you're about to see."

---

## 2. Revealing the real cloud results (1:15–4:15)

**[SCREEN]** Click **"⚡ Run DQFE Engine — Reveal Key Insights"**.

**Narration:**
> "These results were already computed by Kipu's quantum service, on 3,000 real mining shovel records. This is revealing them, not computing them live."

### 2a. Average Precision Gain

**[SCREEN]** Point at the first KPI card ("+38.3%").

**Narration:**
> "First number: Average Precision Gain, plus 38.3 points. Average Precision measures how well the model tells real ruptures apart from healthy machines, across every alert threshold at once — the higher it is, the cleaner that separation. This number compares two setups on the same 15 test splits: **raw**, just the four sensors, versus **hybrid** — the model sees the four sensors *and* the seven quantum-derived features together. Same classifier both times. And it's statistically solid: the odds of this happening by chance are about one in a billion."

### 2b. Precision @ 90% Recall

**[SCREEN]** Point at the second KPI card ("39.0% vs 26.0%").

**Narration:**
> "Here's the same idea at one fixed point. Recall is: of all the real ruptures, how many did the model catch. Precision is: of all the alerts it raised, how many were real. Fix recall at 90 percent for both — both models catch the same 90 percent of ruptures — and compare precision there. Raw: **26 percent**. Hybrid: **39 percent**. Same coverage, about half as many false alarms."

### 2c. Three-way comparison

**[SCREEN]** Point at the third KPI card.

**Narration:**
> "Break it apart. Raw alone: **34.5 percent**. Quantum features alone, no raw sensors at all: **68.1 percent** — nearly double, by themselves. Hybrid, both together: **72.8 percent**. Quantum is where the jump happens; adding raw on top gets the rest."

### 2d. Reading the Precision-Recall curve

**[SCREEN]** Click "▼ Show Plots & Correlation Matrices", stay on Precision-Recall Curves.

**Narration:**
> "Quick guide to this chart. Bottom axis: recall. Side axis: precision. Each line sweeps one setup's alert threshold from strict to loose. Orange, at the bottom, is raw. Light blue is quantum. Navy is hybrid, on top. The shaded band around each line is the spread across the 15 test folds — raw's band and hybrid's barely overlap, so this gap is real, not noise.
>
> This flat grey line is what random guessing would score. Raw drifts down toward it; hybrid and quantum stay well above. This vertical line, at recall 0.90, is where the 39 percent and 26 percent numbers came from. And Average Precision — the number we opened with — is just this whole curve summarized into one figure."

---

## 3. Classical vs. Quantum, side by side (4:15–5:30)

**[SCREEN]** Scroll to the 2A/2B cards.

**Narration:**
> "Left: the four raw signals, untouched. Right: the same four signals, passed through the quantum feature map, producing seven derived features. Same classifier on both sides. Only the representation changes."

**[SCREEN]** Point to the heatmap, then the scatter plot.

**Narration:**
> "This grid shows how features move together. Raw: barely any color. Quantum: real structure — the sensors relate to each other once mapped.
>
> Each dot here is one real reading, orange for a rupture, teal for healthy. Raw space: they overlap. Quantum space: they separate into clear groups."

---

## 4. Impact — false alarms, not AUC (5:30–6:10)

**[SCREEN]** Scroll to Section 3.

**Narration:**
> "Four signals become seven quantum features. Correlation goes up. Detection accuracy improves. But the number that matters for operations is the last one: **false alarms avoided**. Same detection coverage, fewer unnecessary shutdowns."

---

## 5. Quantum catches it, classical doesn't (6:10–7:45)

**[SCREEN]** Open **📡 Live Board** → **🎚️ Simulate perillas** → click **"Quantum catches it (Classical misses)"**.

**Narration:**
> "One real case — Record 36, a known rupture. Hoist Load 124 kN, Crowd Vibration 6.6 mm/s, Drive Temp 40°C, Cable Tension 119 MPa.
>
> Watch the switch. Classical: no alert. Same numbers, same machine — flip to Quantum." **[SCREEN]** flip the switch. **"It catches it."**

**[SCREEN]** Pause, then flip back and forth once more, slower.

**Narration:**
> "One more time, slowly. Classical: quiet. Quantum: catches the real rupture. Same data, same kind of model. Only the representation changed."

---

## 6. Close (7:45–8:15)

**Narration:**
> "We're not replacing your ML model. We're transforming the data that feeds it, so the same model catches more real problems with fewer false alarms.
>
> This demo is live at **quantum-feature-mappping-lab.vercel.app** — no install, try it yourself. If you want to run this on your own data, let's talk."

**[END]**

---

## Production notes

- Target runtime: ~8–9 minutes. If cutting, cut Section 3's heatmap line before anything in Section 5 or 2d.
- Rehearse the click path in Section 5 before recording — verify against the current build, not from memory.
- Don't ad-lib Section 2 — the order and the "hybrid" definition are scripted on purpose.
- Business figures are unconfirmed: cost per rupture ~$50,000, frequency unknown. Keep off-camera. If asked live: *"We're gathering the exact frequency from the client's data — each event is a costly, unplanned shutdown, and this system catches the early signal before it happens."*
