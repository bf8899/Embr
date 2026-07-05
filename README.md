# Ember

Video worth burning for. A new home for video, built on a tip economy.

This repo implements **Phases A–F** of [the build plan](Legal/ember-build-plan.md):
auth and profiles; video upload, processing status, a tiles browse grid, and playback;
the social layer — comments, likes, follows, and a full-screen vertical Flow mode;
non-monetary tipping — a hold-to-ember mechanic, a demo wallet, per-video
leaderboards, and viewer-to-viewer comment tipping; feed intelligence — a
tag-weighted "For you" ranking with search and tag filtering; and moderation —
reporting, an admin review queue, content removal, and account suspension.

## Stack

- [Next.js](https://nextjs.org) (App Router) + [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com) for Postgres, Auth, and session management (`@supabase/ssr`)
- [Vercel](https://vercel.com) for hosting, with git-based deploys on push to `main`

## Local development

```bash
npm install
cp .env.local.example .env.local  # fill in your Supabase project URL + anon key
npm run dev
```

## Database

Schema lives in `supabase/migrations/`. Apply it to a linked Supabase project with:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

## What's implemented

- Sign up / log in / log out with session persistence (`src/proxy.ts`, `src/lib/supabase/`)
- Email confirmation via PKCE code exchange (`src/app/auth/confirm/route.ts`)
- Onboarding flow for display name, handle, and viewer/creator/both role selection
- Editable profile page
- Creator upload flow with progress, client-side thumbnail capture, and
  processing → live status handling (`src/app/(app)/upload/`)
- Tiles browse grid on the dashboard and a watch page with view counting
- Social layer: like toggle (trigger-maintained count), flat comments, and
  follows with follower counts
- Flow mode — a full-screen vertical snap feed with autoplay-on-scroll and a
  like/tip/follow action rail, toggled from the dashboard
- Non-monetary tipping (`embers`): everyone gets a demo wallet grant, and a
  hold-to-ember button moves embers from tipper to creator through a
  balance-checked `send_tip` ledger function. Received embers refill the
  recipient's spendable balance. Per-video top-emberer leaderboards and
  viewer-to-viewer comment tipping are computed from the `tips` ledger. Embers
  are play tokens (`is_demo_currency`) with no real value — the seam for real
  currency once FCA guidance lands.
- Feed intelligence (`src/lib/feed.ts`): a "For you" ranking that weights each
  video by the viewer's own tag affinity (derived from their likes and tips),
  with log-scaled popularity and recency so fresh and popular videos stay
  visible for viewers with no history yet. The dashboard and Flow both default
  to this order (toggle to "Newest"), with title search and clickable tag
  filters.
- Moderation: viewers can report videos, comments, or accounts. Admins
  (`profiles.is_admin`) get a review queue at `/admin` to remove content
  (videos → `removed`, comments soft-deleted) or suspend accounts. Enforcement
  is at the RLS layer — suspended creators' videos are hidden and their
  uploads/comments/tips are blocked, and the `is_admin`/`suspended` flags can
  only be changed by the admin-gated `SECURITY DEFINER` functions (column
  UPDATE is revoked from the app roles). Grant your first admin with:
  `update public.profiles set is_admin = true where handle = '<your-handle>';`

Video hosting sits behind `src/lib/video/provider.ts`, currently backed by Supabase
Storage (50 MB/file on the free tier). Swapping in Mux or Cloudflare Stream later
means implementing that interface — UI code stays untouched.
