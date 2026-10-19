# Roadmap

How Kasusschloss grows from four drills into a trainer that follows `curriculum.json`. That file is the source of truth for what is taught, in what order, and by which rules. Everything here stays within the constraints in `CLAUDE.md`: static files, no build step, offline on iPhone, and saved progress never lost. Nothing past the "Done" section is built.

## Done

- Code split into ES modules (`js/`), with content in `data/*.json`. No change in behavior.
- Curriculum decisions applied to `curriculum.json` and validated:
  - REK2/REK3 split by preposition type.
  - REK3 requires CASE4 only.
  - MOOD2 no longer requires VERB7.
  - `content_complete` set per unit.
  - "assumed" and unlock rules defined in `mastery`.
  - `learner.placement_level: "A2"` added.

## 1. Unit states

`js/units.js` reads the rules from `curriculum.json` (`mastery`, `learner`) instead of hard-coding them.

| State | Rule |
|---|---|
| **locked** | Some `requires` unit is not satisfied. |
| **open** | Unlocked, not yet working. |
| **working** | ≥ 85% accuracy over the unit's last 20 attempts. Satisfies dependents. |
| **fluent** | ≥ 95% accuracy and at or above the unit's rate aim in a 1-minute sprint of that unit. Requires `content_complete`. |
| **retained** | Still fluent on a check ≥ 3 days after first reaching fluent. Maintenance review only. Requires `content_complete`. |
| **assumed** | No content, at or below `placement_level` (A2), not tagged `diagnosed-gap`. Satisfies dependents. Shown as **unverified**. Never stored as retained. B1+ is never assumed. |

- **Unlocking:** a unit unlocks when every unit in `requires` is working, fluent, retained or assumed.
- **Never re-lock:** once a unit is unlocked, it stays unlocked, even if a prerequisite later drops back or an assumed unit fails its probe.
  - The four units the app already has (CASE3, CASE4, REK2, REK3) count as unlocked from the first release. Otherwise today's preposition sprint and Bedeutung tab would be locked until CASE3 reaches working.
- **Partial units:** with `content_complete: false` (currently CASE3 and REK3), a unit can reach working but not fluent or retained, because fluent must mean the whole unit. This blocks nothing, since dependents unlock on working. Progress is stored per item, so practice done now still counts once the missing content arrives.
- **Placement probe:** when content is built for an assumed unit, the app runs a short probe. Pass → retained. Fail → working. Units downstream that were already unlocked stay unlocked either way.
- **States follow performance:** a fluent unit falls back to working if accuracy drops. Only "unlocked" is permanent.

## 2. Existing drills → units

Item IDs in `S.it` don't change. Each item gets a `units` list (and `core: true/false`) in its data file, so current progress carries over.

| Existing drill / item IDs | Unit | Coverage |
|---|---|---|
| Case sprint prepositions (`p:*`), Hooks, Fade `pA pD pW`, Cold check prepositions | **CASE4** | complete |
| Case sprint article phrases (`a:*`), Fade `aA aD eA eD`, Cold check articles | **CASE3** | partial: dative pronouns and dative verbs missing |
| Bedeutung pairs with a fixed-case preposition: für/um/gegen/über/aus/von/mit/zu/nach/vor/unter (57 pairs, 29 core) | **REK2** | complete. Preposition + meaning; the case comes from the CASE4 lock. |
| Bedeutung pairs with an/auf/in (28 pairs, 16 core) | **REK3** | partial: no drill yet for the case each pair takes |

- **"Core" is a tag inside a unit, not a unit boundary.** Within REK2 and REK3, core pairs are introduced and drilled first; the rest follow.
- **Mixed sprints** (Bedeutung "All", Case sprint "Mixed") count toward per-item accuracy, but not toward one unit's 1-minute rate.
- **Rate aims:** the four mapped units reuse today's aims (`AIM`, `MAIM`). Each new unit sets its own when its content is written.

## 3. Storage: history that can show improvement

The same `kasusschloss-v2` key gets new fields. Adding fields keeps older app versions and old exports working, and export/import stays one file.

- `log`: one compact row per item per day practised (tries, wrong, median ms). This drives "you used to struggle with X" at the word level, and summed to sub-skills, units and tracks.
- `units`: `{id: {state, unlockedAt, since, fluentAt, retainedAt, probe}}`.
- `seq`: the last 20 attempts per unit, for the working/fluent rules.
- `schema: 3`. Existing `S.it` data seeds the first history rows. Nothing older can be recovered.

## 4. Drill engines

One engine per curriculum drill type, driven by data. Every engine records attempts the same way (`rec()` + `log` + unit `seq`).

| Type | Today | To build |
|---|---|---|
| SORT | Case sprint | Generalize the bins to any 2–4 labels. First new use: **REK3 case per switcher pair** (Akk/Dat). |
| MEANING | Bedeutung multiple choice | Generalize prompt/answer fields. |
| CLOZE | Sentence card | Any gap, any accepted answers. |
| PRODUCE | – | Cue → typed form, exact match after `norm()`. |
| ORDER | – | Tap chunks into order. Needed for WO8 and the WO track. |
| TRANSFORM | – | Rewrite, graded against a short list of accepted answers. |

## 5. Opening the app: "Heute"

1. **Since last time:** what improved, with former weak spots first, at item and unit level. Units that changed state ("REK3 reached working").
2. **Today's session** (one Start button), built from the graph:
   - retention checks that are due
   - weak items from working units, interleaved 2:1 with stronger ones
   - light maintenance of retained units
   - when there's room, the next open unit with content, preferring `diagnosed_gaps`, then `sequence`
3. **Unit map:** the tracks with each unit colored by state. Assumed units are marked unverified, and units without content are marked "not built yet".

The existing tabs stay as free practice.

## 6. Content queue

Each unit's content is its own task, done only when asked: `data/units/<ID>.json` with items, `units`/`core` tags, confusers, traps and a rate aim. Every task follows "Content accuracy" in `CLAUDE.md`.

**Build-order rule:** when a diagnosed-gap unit is blocked by a contentless unit above A2, that blocker goes to the front of the queue and is built as part of the gap's work, not assumed. Applied to the current graph:

| Blocker (no content, above A2) | Blocks diagnosed gap | Build it with |
|---|---|---|
| VERB7 Präteritum stems (B1) | MOOD5 synthetic Konjunktiv II | the Konjunktiv II work, before MOOD5 |
| CL3 zu-infinitives (B1) | REK5 da-compound + clause | the Rektion work, before REK5 |
| WO8 double infinitive (B2) | MOOD6 modal double infinitive in Konjunktiv II | the Konjunktiv II work, before MOOD6 (needs ORDER) |

Resulting queue for the diagnosed gaps:

1. REK3 completion: the case-per-pair SORT drill.
2. REK4.
3. MOOD2, which unlocks on day one under the placement rule.
4. MOOD3, MOOD4.
5. VERB7 → MOOD5.
6. CL3 → REK5.
7. WO8 → MOOD6.

CASE3 completion (dative pronouns and dative verbs) can slot in anywhere: it isn't a diagnosed gap, but it caps CASE3 at working until then.

## Day one under these rules

18 units are **assumed** (unverified): WO1–WO5, VERB1–VERB6, CASE1, CASE2, CASE5, CASE6, REK1, MOOD1, CL1.

- **Playable:** CASE3, CASE4, REK2, REK3 (unlocked from the start; see "never re-lock").
- **Unlocked, needs content:** MOOD2, VERB7, CL3, WO8, WO6, CASE7, VERB9, CL5.
- **Once CASE3, CASE4, REK2, REK3 reach working**, these also unlock: REK4, REK6, REK7, WO7, CASE9, CL2.
- Everything else (22 units) stays locked until its prerequisites are worked through.

## Suggested build order

1. Units engine + drill mapping + history storage (sections 1–3), with a simple unit map. No new drills.
2. Heute: improvement summary + session builder (section 5).
3. Generalize SORT, then the REK3 case drill (completes REK3's content), then MEANING/CLOZE.
4. Content, one unit per task, in the queue order above. Build PRODUCE, ORDER and TRANSFORM when the first unit that needs them comes up.

Streaks and daily goals come last, if at all: the goal is advancing, not showing up.
