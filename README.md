# Kasusschloss

German case + verb/preposition drill. Static files, no build step, works offline after the first load.

Live at https://twarn247.github.io/kasusschloss/

## On a Mac
Open the link above. To run a local copy, run `python3 -m http.server` in this folder and open http://localhost:8000. Double-clicking `index.html` no longer works, because the app is split into modules and data files.

## On iPhone (home-screen app, works offline)
iOS can't run a local HTML file from the Files app, so host it once:

1. Create a GitHub repo, upload everything in this folder.
2. Settings → Pages → Deploy from branch → `main` / root.
3. Open the Pages URL in Safari → Share → Add to Home Screen.

(Netlify Drop also works: drag this folder onto app.netlify.com/drop.)

## Moving progress
Progress lives in each browser separately. Use Export / Import at the bottom of the app.

## Updating
After changing any app file, bump the cache name in `sw.js` (`kasusschloss-v4` → `v5`) so phones pick up the new version. Drill content is in `data/*.json`.
