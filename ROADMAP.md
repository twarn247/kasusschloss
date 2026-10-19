# Roadmap

A proposal for growing Kasusschloss into a personalized trainer within the constraints in `CLAUDE.md`: static files, no build step, offline on iPhone, and saved progress kept intact. Nothing here is built yet.

## Target layout

```
index.html            shell: tabs, today screen, shared styles
sw.js                 CORE lists every file below; bump C on every change
js/
  core.js             $, shuffle, norm, timers, today()
  store.js            load/save/migrate kasusschloss-v2 → v3, export/import
  scheduler.js        weakness score, interleaving, repair queue (lifted from today's code)
  session.js          builds the daily session from the scheduler across modules
  modules/
    rektion.js        current Bedeutung drills (de→en, en→de, sentence card)
    kasus.js          current case sprint, hooks, fade, cold check
    konjunktiv2.js    new
  ui/lag.js           lag board + rate chart
data/
  rektion.json        the 85 verb pairs + TRAP warnings; later adjectives and nouns
  kasus.json          prepositions, articles, nouns
  konjunktiv2.json    new
```

Plain `<script type="module">` with relative imports, so there is still no build step. `fetch("data/…json")` works offline because every file is in `CORE`.

## 1. Content as data files: done

The split and the content move are done. `validate.html` and the adjective and noun pairs are not.

- Move `V`, `TRAP`, `PREPS`, `ART` and `NOUNS` into JSON as they are. Item IDs stay the same, so history carries over.
- One schema for every module: `{id, module, prompt, answer, case?, confusers[], trap?, example, tags[], level}`.
- Adding content then means editing JSON only. A small `validate.html` page (also static) checks for duplicate IDs, unknown confusers and missing blanks.
- Extend Rektion to adjectives (`stolz auf`, `abhängig von`) and nouns (`Angst vor`, `Interesse an`), which are part of the diagnosed gap.

## 2. Modules

Each module exports the same small interface: `items()`, `drills()` and `render(drill, item)`. The scheduler and the session builder never need to know German grammar.

- **Konjunktiv II** (first new module): würde + infinitive vs. the synthetic forms (hätte, wäre, käme, wüsste), the past form (hätte gemacht, wäre gegangen), and uses (wishes, polite requests, unreal conditions). Its drills reuse the existing patterns: a timed recognition sprint, a typed sentence card, and near-miss options (`hatte`/`hätte`, `war`/`wäre`, `würde`/`wurde`). Interference warnings come from English: "if I would have" ≠ "wenn ich … hätte".
- Later candidates: two-way prepositions in spatial use (wo/wohin), adjective endings, and da-/wo-compounds (`darauf`, `worauf`), which build directly on Rektion.

## 3. Daily session ("Heute")

- A new first tab with one **Start** button that runs about 10 minutes:
  1. Warm-up: a 1-minute sprint on the strongest deck, so the session starts with a win.
  2. Weak-spot block: the top items by `weakness()` across all modules, interleaved with stronger ones in the existing 2:1 pattern, never one preposition in a row.
  3. A short repair round for that day's misses.
  4. New items: at most N per day, unlocked only when error rates are low.
- Items are picked across modules and weighted by weakness and time since last seen. This is a light spacing rule, not a copy of Anki: Anki keeps the plain recall cards, and this app trains speed and discrimination.

## 4. Streaks and goals

- Add `days: {"2026-10-19": {minutes, sessions, correct}}` to the store. Streak = consecutive days with a finished session.
- One daily goal (default: one Heute session), editable. Show a streak counter and a goal ring on the Heute tab.
- Mastery goals per module: an item counts as fluent once its median time is under target and it has no errors in the last 5 attempts. Show "42 / 85 Rektion pairs fluent".
- Show an export reminder after a streak milestone (iOS can evict storage).

## 5. Storage migration

- `store.js` reads `kasusschloss-v2` and writes `kasusschloss-v3` = `{version:3, it, hist, fade, cold, days, settings}`, keeping the old key as a backup for at least one release.
- Import accepts v1, v2 and v3 exports.

## Suggested order

1. ~~Split the code into modules and move content into data files, with no change in behavior.~~ Done.
2. Store v3 + streaks and goals.
3. The Heute daily session.
4. The Konjunktiv II module.
5. Extend Rektion to adjectives and nouns.

Steps 4 and 5 could also come first, inside the single file, if new content matters more right now than structure.
