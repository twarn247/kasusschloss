# Kasusschloss

German case + verb/preposition drill. Plain HTML, no build step, works offline after the first load.

## On a Mac
Double-click `index.html`. It opens in your browser and saves progress there.

## On iPhone (home-screen app, works offline)
iOS can't run a local HTML file from the Files app, so host it once:

1. Create a GitHub repo, upload everything in this folder.
2. Settings → Pages → Deploy from branch → `main` / root.
3. Open the Pages URL in Safari → Share → Add to Home Screen.

(Netlify Drop also works: drag this folder onto app.netlify.com/drop.)

## Moving progress
Progress lives in each browser separately. Use Export / Import at the bottom of the app.

## Updating
Replace `index.html` and bump the cache name in `sw.js` (`kasusschloss-v3` → `v4`) so phones pick up the new version.
