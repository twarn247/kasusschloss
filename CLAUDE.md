# Kasusschloss

An offline drill app for German grammar: verb/adjective/noun + preposition + case (Rektion), case sorting, and the article table. It runs as a home-screen web app on iPhone Safari and in desktop browsers. It is hosted on GitHub Pages at https://twarn247.github.io/kasusschloss/ and served from `main`, root folder.

## Files

- `index.html`: the whole app, with HTML, CSS and JS in one file. Content (the `V` verb array, `TRAP` warnings, `PREPS`, `ART`, `NOUNS`) is inline in the script for now.
- `sw.js`: the service worker. It serves from the cache first and refreshes the cache in the background. The `CORE` list is precached.
- `manifest.webmanifest` and the icons: what the home-screen install uses.

## Hard constraints

- Static files only. No build step, no bundler, no framework, no npm dependencies, no backend, no accounts. Google Fonts is the only external resource, and the app must still work if it fails to load.
- It must keep working on GitHub Pages under the `/kasusschloss/` subpath. Use relative URLs only, never ones starting with `/`.
- It must work offline on iPhone Safari as a home-screen app. Every file the app needs at runtime must be in `CORE` in `sw.js`. iOS can evict storage for sites that go unused, so keep export reminders visible.
- Plain ES2020 that iOS Safari 15+ runs. `<script type="module">` is fine. `fetch` of local JSON files is fine if those files are in `CORE`.
- Free tools only.

## Never break saved progress

- Progress lives in `localStorage` under `"kasusschloss-v2"`, with the shape `{it, hist, fade, cold}`. The app also still reads the older `"kasusschloss-v1"` key.
- Keep reading `"kasusschloss-v2"`. If the shape has to change, add a versioned migration that reads the old key and writes the new one. Never delete the old key in the same release.
- Item keys in `S.it` are stable IDs: `p:<prep>`, `a:<article>-<gender>`, and `m:<mode>:<pair>`. Renaming a verb pair or a preposition orphans its history. Add an alias or a migration instead.
- Export/import must keep working. Import must accept every older export format, including files that have only `it`, `hist`, `fade` and `cold`.
- Before committing a storage change, test it: load old data into localStorage, reload the page, and confirm that nothing is lost and that export followed by import round-trips.

## Shipping a change

1. Every time `index.html` or any file in `CORE` changes, bump `C` in `sw.js` (`kasusschloss-v3` → `v4` and so on). Otherwise installed phones keep serving the old version. Adding a new runtime file means adding it to `CORE` and bumping `C`.
2. Test locally with `python3 -m http.server` from the repo root. Service workers don't run on `file://`.
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
- Diagnosed gaps: **Rektion** (verb/adjective/noun + preposition + case) and **Konjunktiv II**.
- Also uses Anki, so this app should do what Anki can't (timed fluency, near-miss discrimination, case sorting) rather than duplicate plain flashcards.
- Studies on desktop (keyboard shortcuts matter) and iPhone (tap targets, no hover-only information).
- Prefers free tools.

## Working here

- See `ROADMAP.md` for the planned structure. Don't build roadmap items unless asked.
- Keep the existing visual language: the CSS variables in `:root`, Akk blue, Dat amber, switcher purple, and both light and dark themes.
- Content must be correct German. When unsure about a case or a preposition, say so instead of guessing.
