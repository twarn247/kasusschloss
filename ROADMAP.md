# Roadmap

How Kasusschloss grows from four drills into a trainer that follows `curriculum.json`. That file is the source of truth for what is taught and in what order. Everything here stays within the constraints in `CLAUDE.md`: static files, no build step, offline on iPhone, and saved progress never lost. This is a proposal. Nothing past the "Done" section is built.

## Done

- Code split into ES modules (`js/`), with content in `data/*.json`. No change in behavior.

## 1. Load the graph and track unit states

- Add `curriculum.json` to `CORE` in `sw.js` and load it in `js/data.js` next to the content files.
- New `js/units.js` holds the rules, all read from the curriculum:

| State | Meaning |
|---|---|
| **locked** | Some `requires` unit is not yet working. |
| **open** | Unlocked, but not enough attempts yet. |
| **working** | ≥ 85% accuracy over the unit's last 20 attempts. This unlocks dependents. |
| **fluent** | ≥ 95% accuracy, and at or above the unit's rate aim in a 1-minute sprint of that unit. |
| **retained** | Still fluent on a check at least 3 days after first reaching fluent. Drops to maintenance review. |
| **assumed** *(proposed)* | Placed below the learner's level, with no content yet, so treated as known for unlocking (see open question 3). |

- A unit falls back from fluent to working if accuracy drops, so states follow real performance and aren't one-way trophies.
- Units with no content yet still appear in the graph. They show as "not built yet" instead of being hidden.

## 2. Map the existing drills to units

Current progress carries over. Item IDs in `S.it` stay the same, and each item gets a `units` list in its data file.

| Existing drill / item IDs | Unit | Notes |
|---|---|---|
| Case sprint, prepositions deck (`p:*`), Hooks, Fade `pA pD pW`, Cold check prepositions | **CASE4** | Full coverage. |
| Case sprint, article-phrase deck (`a:*`), Fade `aA aD eA eD`, Cold check articles | **CASE3** | Partial: dative articles only. CASE3's pronouns and dative verbs have no items yet. |
| Bedeutung pairs with für/um/gegen/über/aus/von/mit/zu/nach/vor/unter (57 pairs, 29 core) | **REK2** | See open question 1. |
| Bedeutung pairs with an/auf/in (28 pairs, 16 core: 20 + Akk, 8 + Dat) | **REK3** | Partial: no drill yet asks for the *case* of a switcher pair (REK3's SORT). The card only asks for the preposition. |

- Sprint history (`S.hist`) seeds the "rate aim" half of fluent. Mixed-unit sprints (Bedeutung "Core"/"All", Case sprint "Mixed") count toward accuracy but not toward a single unit's rate.
- Rate aims per unit: reuse today's aims (`AIM`, `MAIM`) for the four mapped units. New units set theirs when their content is written.

## 3. Storage: history that can show improvement

The same `kasusschloss-v2` key gets new fields. It isn't renamed, because older app versions and old exports keep working when fields are only added. Export and import stay one file.

- `log`: one compact row per item per day practised (tries, wrong, median ms). This is what makes "you used to be slow on X, now you're fast" possible, at word level and summed up to units and tracks. It's small: a few hundred KB per year of daily use.
- `units`: `{id: {state, since, fluentAt, retainedAt}}`, kept so that state changes and their dates are visible.
- `seq`: the last 20 attempts per unit, for the working/fluent accuracy rule.
- `schema: 3` so later migrations know what they're reading. Existing `S.it` data seeds the first row of history. Nothing older can be recovered.

## 4. Drill engines

One engine per curriculum drill type, driven by data. A unit's content file says which engines it uses.

| Type | Today | To build |
|---|---|---|
| SORT | Case sprint | Generalize the bins (Akk/Dat/switcher → any 2–4 labels). |
| MEANING | Bedeutung multiple choice | Generalize prompt/answer fields. |
| CLOZE | Sentence card | Generalize: any gap, any accepted answers. |
| PRODUCE | – | Cue → typed form, exact match after `norm()`. |
| ORDER | – | Tap chunks into order. Needed by the whole WO track and MOOD6. |
| TRANSFORM | – | Rewrite, graded against a short list of accepted answers. |

Each engine records attempts the same way (`rec()` + `log` + unit `seq`), so the scheduler and the unit rules work for all of them.

## 5. Opening the app: "Heute"

The first tab answers "what moves me forward today?":

1. **Since last time:** items and units that improved, with former weak spots first. For example, "halten von: 2.4 s with errors → 1.1 s clean" or "REK3 reached working."
2. **Today's session** (one Start button), built from the graph:
   - retention checks that are due (fluent units ≥ 3 days old)
   - weak items from working units, interleaved 2:1 with stronger items (current scheduler)
   - a little maintenance on retained units
   - when there's room, the next open unit, preferring `diagnosed_gaps`, then `sequence`
3. **Unit map:** each track as a row of units, colored by state, with "ready to move on" when a unit turns fluent and its dependents unlock.

The existing tabs stay as free practice.

## 6. Content, one unit at a time

Each unit's content is its own task, done only when asked: `data/units/<ID>.json` with items, confusers, traps and rate aim. Every task follows "Content accuracy" in `CLAUDE.md`: sources named, doubtful items flagged for review, nothing guessed.

Graph facts that affect which content to build first:

- **REK4** (worauf/darauf) needs only REK3, so it's the next Rektion unit.
- **MOOD2** (Konjunktiv II present) needs MOOD1, WO5 and **VERB7 (Präteritum stems, B1)**. VERB7 is above the "assumed" line, so it needs content or a placement probe before Konjunktiv II unlocks.

## Suggested order

1. Units engine + mapping + history storage (sections 1–3), shown as a simple unit map. No new drills.
2. Heute: improvement summary + session builder (section 5).
3. Generalize SORT/MEANING/CLOZE, then build PRODUCE (section 4).
4. Content: REK3's case SORT, REK4, then VERB7 → MOOD1 → MOOD2, one unit per task.
5. ORDER and TRANSFORM engines when the first unit that needs them comes up.

Streaks and daily goals come last, if at all: the goal is advancing, not showing up.

## Open questions

1. **REK2 vs. REK3 split.** REK2's title says "fixed-case prepositions", but its example is *warten auf* (a switcher) and it says "~45 core pairs". The app's core set is exactly 45 pairs, 16 of them switchers. Either REK2 = the 45 core pairs (any preposition) and REK3 = the switcher pairs' case, or REK2 = fixed-case pairs only (57) and REK3 = all an/auf/in pairs (28, not ~15). Section 2 assumes the second.
2. **Partial units.** CASE3 and REK3 only have part of their scope in the app. Should a partial unit be able to reach fluent/retained on what exists, or stay at working until its content is complete?
3. **Placement.** Proposed: A1 and A2 units count as **assumed** for unlocking, unless they're in `diagnosed_gaps` or `already_in_app`, until a placement probe exists for them. Without this, REK3 stays locked behind CASE5 and the diagnosed MOOD units stay locked behind A1/A2 units that have no content.
