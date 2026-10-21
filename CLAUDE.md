# Kasusschloss

An offline drill app for German grammar: verb/adjective/noun + preposition + case (Rektion), case sorting, and the article table. It runs as a home-screen web app on iPhone Safari and in desktop browsers. It is hosted on GitHub Pages at https://twarn247.github.io/kasusschloss/ and served from `main`, root folder.

## Curriculum: the source of truth

`curriculum.json` defines what gets taught and in what order: 58 units in 7 tracks (WO, CASE, VERB, REK, MOOD, CL, ST). It also holds the `requires`/`unlocks` prerequisite graph, the 6 drill types, the mastery levels (working / fluent / retained), the learner's placement and diagnosed gaps, and which units the app already covers. When it disagrees with anything else in the repo, the curriculum wins. Don't change its units, edges or mastery rules without the user's say-so. Propose the change instead.

- Content is built **one unit per task**, only when the user asks for that unit. Don't write lesson content for other units along the way.
- Every content item says which unit(s) it belongs to, so progress rolls up to units.
- `ROADMAP.md` describes how the app will load the graph and track unit states.

## Content accuracy

Translations, meanings, cases, example sentences and confusers must be correct. Never write or change any of them on an assumption.

- Check each item against a reference (Duden, DWDS, Langenscheidt/PONS, or a grammar reference such as Hammer's German Grammar for rules). Example sentences must be natural German, not literal English.
- List anything you're not certain of for the user to check, instead of shipping it. A missing item is better than a wrong one: wrong items get drilled into memory at speed.
- When adding content, say which sources were used and which items were flagged.

## Files

- `index.html`: markup and CSS. It loads `js/main.js` as a module, and shows a note when opened from `file://`, where modules can't load.
- `data/rektion.json`: the verb + preposition pairs. Each has `pair`, `case`, `en`, `sentence` (with `___`), `confusers` (other `pair`s), an optional `syn` group (pairs that share a meaning never appear as each other's wrong options), `core` (a tag inside the unit: core pairs come first), `unit` (REK2 for fixed-case prepositions, REK3 for an/auf/in; REK3 pairs also feed the Case sprint "an/auf/in case" deck, item keys `k:<pair>`), and an optional `trap` (the English-interference warning).
- `data/kasus.json`: prepositions by case, articles, nouns, the article-phrase `slots`, the `fade` lines (each with its `unit`), and `units` (which unit the preposition and article decks belong to).
- `js/core.js`: DOM and text helpers, plus `ui.active` (the open tab).
- `js/data.js`: loads the JSON with top-level await.
- `js/store.js`: saved progress `S`, plus `save`, `rec(key, ok, ms, unit)` (item stats, daily history and the unit's last 20 outcomes), `itemMed`, `itemErr`, `replaceState` (reset/import, which fires the `onReplace` hooks), and export/import.
- `js/units.js`: unit states from `curriculum.json` (`evaluate()`), the schema-3 migration, and the registry where drill modules declare which unit each item and sprint belongs to. Every new drill must `register()` its items and pass the unit to `rec()`.
- `js/scheduler.js`: `weakness()` and `nextItem()`, the shared interleaving and repair sequencing.
- `js/modules/rektion.js`: the Bedeutung tab. `js/modules/kasus.js`: Case sprint, Fade and Cold check. `js/ui/lag.js`: the Lag board. `js/ui/unitmap.js`: the Units tab. `js/ui/heute.js`: the Heute tab (first tab). `js/ui/tabs.js`: `showTab()` and per-tab renderers. `js/main.js`: startup and the backup footer.
- `js/session.js`: builds Heute's daily plan from unit states (retention checks, then one practice round per drill, diagnosed gaps first) and runs rounds through each module's registered `round()`/`start()`. `js/progress.js`: what improved (earliest vs latest stretch of history, per item and per unit) and what is still weak.
- `sw.js`: the service worker. It serves from the cache first and refreshes the cache in the background. The `CORE` list is precached, with `cache:"reload"` so that one install never mixes old and new files.
- `manifest.webmanifest` and the icons: what the home-screen install uses.

## Hard constraints

- Static files only. No build step, no bundler, no framework, no npm dependencies, no backend, no accounts. Google Fonts is the only external resource, and the app must still work if it fails to load.
- It must keep working on GitHub Pages under the `/kasusschloss/` subpath. Use relative URLs only, never ones starting with `/`.
- It must work offline on iPhone Safari as a home-screen app. Every file the app needs at runtime must be in `CORE` in `sw.js`. iOS can evict storage for sites that go unused, so keep export reminders visible.
- Plain ES2020 that iOS Safari 15+ runs. `<script type="module">` is fine. `fetch` of local JSON files is fine if those files are in `CORE`.
- Free tools only.

## Never break saved progress

- Progress lives in `localStorage` under `"kasusschloss-v2"`. Schema 3 has `{schema, it, hist, fade, cold, log, base, seq, units}`: `log` is `{date: {itemKey: [tries, wrong, ms of right answers]}}`, `base` is the same row format seeded once from `it` for data saved before schema 3, `seq` is the last 20 outcomes per unit, `units` holds each unit's state and dates, and `session` is today's Heute plan (`{d, rounds, i}`). Older data has only `{it, hist, fade, cold}`, and `migrate()` in `js/units.js` upgrades it on load and on import. The app also still reads the older `"kasusschloss-v1"` key.
- Keep reading `"kasusschloss-v2"`. If the shape has to change, add a versioned migration that reads the old key and writes the new one. Never delete the old key in the same release.
- Item keys in `S.it` are stable IDs: `p:<prep>`, `a:<article>-<gender>`, and `m:<mode>:<pair>`. Renaming a verb pair or a preposition orphans its history. Add an alias or a migration instead.
- Export/import must keep working. Import must accept every older export format, including files that have only `it`, `hist`, `fade` and `cold`.
- Before committing a storage change, test it: load old data into localStorage, reload the page, and confirm that nothing is lost and that export followed by import round-trips.

## Shipping a change

1. Every time `index.html` or any file in `CORE` changes, bump `C` in `sw.js` (`kasusschloss-v3` → `v4` and so on). Otherwise installed phones keep serving the old version. Adding a new runtime file means adding it to `CORE` and bumping `C`.
2. Test locally with `python3 -m http.server` from the repo root (`.claude/launch.json` sets this up for the preview pane). Modules, `fetch` and service workers don't run on `file://`. The local service worker serves from the cache first, so after editing, reload twice or unregister it. In Claude's preview pane, `requestAnimationFrame` may never fire, so the sprint clocks never run out. When testing there, stub it with `setTimeout` and add an offset to `performance.now()` to end a sprint.
3. Push to `main`. Pages redeploys in about a minute. On the phone, open the app twice: the first launch fetches the new version and the second shows it.

## Learning-design principles

The app follows these. New drills should too.

- **Fluency means speed plus accuracy.** Measure correct per minute, errors per minute, and per-item reaction time. "Right but slow" is not mastered.
- **Mix items. Never block-drill one preposition at a time.** Interleave across prepositions, cases and meanings.
- **Wrong options must be plausible confusions, never random filler.** Each item lists hand-picked confusers (`halten für` next to `halten von`, `bitten um` next to `fragen nach`). Random items only fill in when no near misses are left.
- **Weak items come up more often, between easier ones.** The current scheduler follows two stronger items with one weak one, using `weakness()` (median RT + error rate + unseen bonus). Repair mode cycles misses until each is answered right twice in a row under a target time.
- **Show an English-interference warning wherever English would mislead** (`TRAP`). For example: English says "wait *for*", German says `warten auf`. Every new item whose English preposition would lead to the wrong German one needs a warning.

## The learner

- Self-studying German toward C2. Currently around A2/B1.
- Diagnosed gaps: **Rektion** (verb/adjective/noun + preposition + case) and **Konjunktiv II**. The exact units are in `curriculum.json` → `learner` (placement: Goethe "Test your German" 16/30).
- Wants the app to show what has improved, especially former weak spots, at both the word level and the topic level, and to make it clear when a unit is solid enough to move on.
- Also uses Anki, so this app should do what Anki can't (timed fluency, near-miss discrimination, case sorting) rather than duplicate plain flashcards.
- Studies on desktop (keyboard shortcuts matter) and iPhone (tap targets, no hover-only information).
- Prefers free tools.

## Working here

- See `ROADMAP.md` for the planned structure. Don't build roadmap items unless asked.
- Keep the existing visual language: the CSS variables in `:root`, Akk blue, Dat amber, switcher purple, and both light and dark themes.
- Content must be correct German. See "Content accuracy" above.
