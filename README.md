# Anime Hub

Ukrainian-dubbed anime portal. **Work-in-progress migration** from a vanilla-JS SPA to a full
Next.js (App Router) + Tailwind + TypeScript application.

## Stack

- [Next.js 15](https://nextjs.org/) App Router (SSR + ISR)
- TypeScript (`strict`)
- [Tailwind CSS](https://tailwindcss.com/) (dark theme, `bg-slate-950`)
- [Jikan v4](https://docs.api.jikan.moe/) (MyAnimeList) for metadata (public, no auth)
- [AniLibria v1](https://anilibria.top/api/docs/v1) for direct HLS streams
- Kodik mirrors + YouTube trailer as fallbacks

## Routes

| Path                | Purpose                                         |
|---------------------|-------------------------------------------------|
| `/`                 | Hero slider + "Latest updates" `AnimeCard` grid |
| `/catalog`          | Search/list view (`?q=` wires into Jikan search)|
| `/watch/[id]`       | SSR detail/watch page (trailer + sidebar)       |
| `/genres`           | Genres landing (placeholder)                    |
| `/studios`          | Ukrainian dub studios                            |
| `/api/anime`        | JSON — `list=top|latest|search&q=&limit=`       |
| `/api/sources/[id]` | Aggregated video sources for a MAL id           |

## Dev

```bash
npm install
npm run dev
# http://localhost:3000
```

Lint / typecheck:

```bash
npm run lint
npm run typecheck
```

## Legacy

The previous static build lives under `legacy/` (`index.html`, `app.js`,
`styles.css`) for reference. It is not served by Next.
