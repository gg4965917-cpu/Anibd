# Anibd — Test Plan (PR #2)

## What is being verified

User asked for a site with an embedded player for Ukrainian-dubbed anime, connected to Kodik / Shikimori / Amanogawa. The PR delivers a static SPA (`index.html` + `styles.css` + `app.js`) that:

- Loads catalog via Jikan (MAL) public API — `app.js:26-30, 200-208`.
- Opens a Kodik iframe at `https://kodik.info/find-player?shikimoriID=<malId>` — `app.js:72-79`.
- Provides a "Дивитися (укр. дубляж)" button that adds `&only_translations=<UA_IDS>` — `app.js:312, 327-335, 73-76`.
- Provides a Studios section with external links to Amanogawa + others — `app.js:82-143`.

## Primary end-to-end flow

One single recorded flow that proves the feature works.

1. **Load home page** — Navigate to `http://localhost:8765/`.
   - **PASS if**: Hero heading "Аніме українською" is visible AND the "Популярне зараз" grid renders at least 6 anime cards with posters (not placeholder text or error).
   - **FAIL if**: Empty grid, error banner, or only spinner after 10s.
   - Broken-state distinguisher: a JS bug in `pageHome` or broken Jikan fetch would show the error state, not the grid.

2. **Search for a popular title** — Type `Frieren` into the header search, press Enter.
   - **PASS if**: URL hash becomes `#/search/Frieren` AND grid contains a card whose title contains "Frieren" (specifically the main series MAL #52991).
   - **FAIL if**: No results, or page stays on home.

3. **Open anime detail page** — Click the first Frieren card.
   - **PASS if**: URL hash becomes `#/anime/<id>` AND detail layout shows poster, title "Sousou no Frieren" (or similar), genres, synopsis, and 3+ buttons including "Дивитися (Kodik)", "Дивитися (укр. дубляж)", and external links (Amanogawa, AniHub, AniTube, Shikimori).
   - **FAIL if**: Detail renders error state or missing buttons.

4. **Open the player (Ukrainian filter)** — Click "Дивитися (укр. дубляж)".
   - **PASS if**: A `<dialog>` opens covering the screen AND the iframe's `src` attribute matches regex `https://kodik\.info/find-player\?shikimoriID=\d+&only_translations=[0-9,]+` AND after ≤15s the iframe paints Kodik UI (play button, episode selector, or translation selector) — i.e. not a blank page or error.
   - **FAIL if**: Iframe never loads (blank after 15s), URL does not contain `only_translations`, or dialog doesn't open.
   - Broken-state distinguisher: if `kodikPlayerUrl` had a bug or the iframe didn't mount, the dialog would stay on the "Завантаження плеєра…" placeholder.

5. **Toggle source selector** — Inside the dialog, change `Джерело` select to `Kodik (авто)`.
   - **PASS if**: Iframe `src` changes to a URL **without** `only_translations` (regex `https://kodik\.info/find-player\?shikimoriID=\d+$`).
   - **FAIL if**: Src doesn't change or still contains `only_translations`.

6. **Verify Studios page** — Close player, click "Студії" in nav.
   - **PASS if**: "Amanogawa" card is present with an `<a href="https://amanogawa.space">` link (verified via inspect / devtools). At least 8 studio cards rendered.
   - **FAIL if**: Section missing, or Amanogawa link doesn't point to `amanogawa.space`.

7. **Regression — nav active state (PR #2 fix, `app.js:540-546`)** — From the Studios page (hash `#/studios`), inspect the nav.
   - **PASS if**: Only the "Студії" link has `.is-active`; "Головна" does NOT have `.is-active`.
   - **FAIL if**: Both "Головна" and "Студії" are highlighted (this would be the pre-fix bug where `hash.startsWith('#/')` was always true for `data-route="home"`).
   - Broken-state distinguisher: if PR #2 fix is reverted, "Головна" would also glow yellow on every non-home route.

## Out of scope (explicitly not tested)

- Whether Kodik actually has a Ukrainian dub for every tested title — that depends on Kodik's catalog, not this site. The test only verifies we correctly request and embed the player with the UA filter.
- Mobile responsive breakpoints (visual regression is low-risk for a static CSS grid).
- Jikan rate limits — if Jikan 429s, the test will be re-run.
- Settings dialog persistence across sessions.

## Evidence to capture

- Screen recording of the entire flow (steps 1–6).
- Screenshot of devtools Elements panel showing the iframe `src` attribute after step 4 (concrete proof of URL format).
- Screenshot of the rendered Kodik player UI (step 4 success state).
