# Ember

Video worth burning for. A new home for video, built on a tip economy.

This repo implements **Phase A** of [the build plan](Legal/ember-build-plan.md): project
scaffolding, authentication, and a basic profile page with viewer/creator role selection.

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
- Editable profile page and an empty authenticated dashboard
