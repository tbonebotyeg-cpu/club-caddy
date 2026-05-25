# Club Caddy

Your golf bag, smart caddy, scorecard, and handicap — in one sharp app.

Mobile-first PWA built with Next.js 16, React 19, Tailwind v4, and Supabase.
Designed for on-course phone use with a dark + electric-lime aesthetic.

---

## What's inside (Phase 1)

- **Auth** — Supabase magic-link sign in
- **My Bag** — clubs (Driver → Putter) with yardages at full / 3/4 / 1/2 / 1/4 swings + notes
- **Smart Caddy** — type a target yardage, get the top 3 club + swing recommendations from your bag with optional wind/temp adjustment
- **Landing page** — marketing hero, features, CTA
- **PWA** — installable, dark theme color, manifest + icons

Phase 2 (next) adds courses, hole-by-hole scorecard, round history, and auto WHS handicap.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack default) + TypeScript |
| Styling   | Tailwind CSS v4 (CSS-first theme) |
| Database  | Supabase Postgres + Row-Level Security |
| Auth      | Supabase magic-link (`@supabase/ssr`) |
| Forms     | React Hook Form + Zod |
| Charts    | Recharts (Phase 3) |
| Icons     | Lucide |
| Toasts    | Sonner |
| Deploy    | Vercel |

## Local setup

```bash
# 1. Install
npm install

# 2. Create a Supabase project at https://supabase.com
#    Project Settings → API → copy URL + anon key

# 3. Configure env
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Run the SQL schema in Supabase SQL editor
#    (db/schema.sql)

# 5. Start dev
npm run dev
```

Open <http://localhost:3000>.

## Project layout

```
app/
  (auth)/login/        magic-link sign in
  (app)/               authed shell (bottom nav + top bar)
    bag/               club CRUD + swing yardage matrix
    caddy/             smart recommender
    round/, rounds/    scorecard (Phase 2)
    courses/           course library (Phase 2)
    stats/, goals/     dashboard + goals (Phase 3-4)
  auth/callback/       Supabase magic-link callback
  page.tsx             marketing landing
  manifest.ts          PWA manifest
  icon.tsx, apple-icon.tsx, opengraph-image.tsx   auto-generated images

components/
  ui/                  Button, Card, Input/Label/Select
  nav/                 BottomNav (mobile), TopBar (desktop), Logo
  shared/              ComingSoonShell

lib/
  supabase/            server + browser + proxy clients
  types.ts             Zod schemas + TS types
  handicap.ts          WHS score-differential + rolling index
  caddy.ts             Recommendation + weather adjustment
  utils.ts             cn(), formatYards, scoreLabel

db/
  schema.sql           Postgres tables + RLS policies

proxy.ts               (formerly middleware) refreshes Supabase session each request
```

## Deploy

```bash
gh repo create club-caddy --public --source . --remote origin --push
```

Then on [Vercel](https://vercel.com/new):
1. Import the GitHub repo
2. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
3. In Supabase Auth → URL Configuration: add `https://your-vercel-url.vercel.app/auth/callback` as a Redirect URL

## Brand & design tokens

| Token | Value |
|---|---|
| Background | `#0a0a0a` |
| Surface    | `#141414` / elevated `#1c1c1c` |
| Border     | `#262626` / strong `#2f2f2f` |
| Accent     | `#b6ff00` (electric lime) |
| Foreground | `#fafafa` / muted `#a1a1aa` / subtle `#71717a` |
| Score colors | birdie `#b6ff00`, par `#a1a1aa`, bogey `#f5a524`, double+ `#ff3d3d`, eagle `#ffd700` |
| Sans   | Geist Sans (next/font) |
| Mono   | Geist Mono — used for all numerics (`.num` utility) |

## Status

Phase 1 — foundation, complete. Phase 2 (courses + scorecard + handicap) is next.

## License

MIT
