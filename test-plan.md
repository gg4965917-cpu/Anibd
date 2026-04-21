# Test Plan — PR #16 (broken posters + home rails fix)

## What changed (user-visible)
1. Hero poster + all anime cards now load (before: every image 400). Fix: `next.config.mjs` added `myanimelist.net` + relatives to `images.remotePatterns`.
2. Home page now shows all 4 content rails (Цього сезону, Топ-рейтинг, Кращі фільми, Скоро на екранах). Before: only hero + "Не вдалося завантажити список". Fix: `lib/jikan.ts` FIFO queue with ~380 ms gap + 429 retry, so 5 parallel Jikan calls from `app/page.tsx` don't hit rate-limit.

## Primary flow
Home → click card → Watch page → play HLS episode → switch tab to YouTube.

## Concrete steps + pass/fail criteria

### T1 — Home page loads with posters and rails
- **Action**: Open `https://anibd-one.vercel.app/`.
- **Pass**: Hero shows a non-empty poster image (not blank tile) and at least one of: "Цього сезону", "Топ-рейтинг", "Кращі фільми", "Скоро на екранах" section headers is visible with ≥4 card posters each showing a real image.
- **Fail**: Hero has blank tile (as before fix) or "Не вдалося завантажити список" error banner is present.

### T2 — Card navigation works
- **Action**: Click the first card in the "Цього сезону" grid.
- **Pass**: URL becomes `/watch/<malId>` (numeric), the watch page renders a sidebar with a **visible poster** image, title, and the VideoPlayer area appears.
- **Fail**: 404, blank poster in sidebar, or no VideoPlayer rendered.

### T3 — HLS player plays
- **Action**: On the watch page with the default tab (AniLibria HLS) active, click Play on the `<video>` element.
- **Pass**: Video playback starts (time counter advances past 0:00 within 10s, frames visible, no persistent spinner).
- **Fail**: Video stays at 0:00, shows error overlay, or `<video>` never receives frames.

### T4 — Tab switching works (buttons claim)
- **Action**: Click the "Трейлер (YouTube)" tab under the player.
- **Pass**: `<video>` is replaced by a YouTube `<iframe>` whose `src` contains `youtube` and shows the trailer thumbnail.
- **Fail**: Tab click has no effect, or iframe never appears (would indicate hydration / button handler broken).

## Why each test would fail if change were broken
- T1: Before PR #16, `/_next/image?url=…myanimelist.net…` returned HTTP 400 → Next rendered broken image icons. Also, 3-4 rails were empty → only hero + error banner visible.
- T2: If images remotePatterns still wrong, sidebar poster would also fail to load.
- T3: Regression check — proves HLS pipeline still works after the rate-limit change (could regress if Jikan call failure earlier breaks the SSR chain).
- T4: Proves client-side buttons/hydration work (user reported "buttons don't work").
