# Ember — Native App Build Plan

A build specification for Claude Code. Read this file in full before writing any code.

---

## 0. Context

Ember is a short-form video platform (existing web app: Next.js App Router, Supabase, Stripe, Vercel, deployed at e-mbr.uk). We are building a **native mobile app** in React Native, reusing the existing Supabase backend.

**Key change from previous plans:** the crypto/token element is removed entirely. There is no blockchain, no Solana, no tradeable token, no cash-out of embers by ordinary users. Embers are a **non-refundable, non-transferable virtual gifting currency**, bought with real money and spent on gifts to creators — the same model as TikTok Coins or Kick.

Do not add any wallet, chain, swap, or token-transfer code. If you find remnants of it in the existing repo, leave them alone and flag them rather than migrating them.

---

## 1. Product shape

Two content modes, both first-class:

1. **Short-form** — vertical swipe feed of videos up to 90 seconds.
2. **Live** — creators broadcast live; viewers watch, chat, and send gifts in real time.

Gifting is the economic engine of both. Leaderboards are the engagement engine.

The app should feel live-first: the home screen surfaces live streams above the video feed when any followed creator is broadcasting.

---

## 2. Tech stack (use exactly this — do not substitute)

| Layer | Choice |
|---|---|
| Framework | React Native via Expo (managed workflow) |
| Router | Expo Router (file-based) |
| Language | TypeScript, strict mode |
| Backend | Existing Supabase project (Postgres, Auth, Storage, Realtime, Edge Functions) |
| Video playback | `expo-video` |
| Feed list | `@shopify/flash-list` |
| Live streaming | Mux Live (RTMP ingest, HLS playback) |
| Live chat + gift events | Supabase Realtime channels |
| Gift animations | `lottie-react-native` |
| Payments (mobile) | `expo-in-app-purchases` — **see §7, this is not Stripe** |
| State | Zustand for client state, TanStack Query for server state |
| Builds | EAS Build + EAS Submit |

---

## 3. Repository layout

Create a new repo, `ember-app`, separate from the Next.js web repo. Structure:

```
ember-app/
  app/                      # Expo Router routes
    (auth)/
      sign-in.tsx
      sign-up.tsx
    (tabs)/
      index.tsx             # Home: live rail + short-form feed
      discover.tsx
      create.tsx
      leaderboards.tsx
      profile.tsx
    live/[id].tsx           # Live stream viewer
    video/[id].tsx          # Single video
    creator/[handle].tsx
    wallet/
      index.tsx             # Ember balance
      purchase.tsx          # Ember top-up
  src/
    components/
      feed/
      live/
      gifts/
      leaderboards/
      ui/                   # Design primitives
    hooks/
    lib/
      supabase.ts
      analytics.ts
    stores/
    types/
  assets/
    lottie/                 # Gift animations
    fonts/
supabase/
  migrations/               # New SQL migrations live here
  functions/                # New Edge Functions live here
```

---

## 4. Data model

Add these tables via Supabase migrations. Do not modify existing tables destructively — add columns, never drop.

### `ember_balances`
| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid PK, FK auth.users | |
| `balance` | bigint, default 0 | Embers held, never negative |
| `lifetime_purchased` | bigint, default 0 | |
| `updated_at` | timestamptz | |

### `ember_transactions`
Append-only ledger. Never update or delete rows.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `type` | enum | `purchase`, `gift_sent`, `gift_received`, `payout`, `adjustment` |
| `amount` | bigint | Signed |
| `balance_after` | bigint | |
| `reference_id` | uuid nullable | Links to gift_events or purchase record |
| `created_at` | timestamptz | |

### `gifts`
Catalogue of sendable gifts.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | e.g. "Spark", "Bonfire" |
| `ember_cost` | int | |
| `tier` | enum | `spark`, `flame`, `blaze`, `inferno` |
| `lottie_key` | text | Filename in assets/lottie |
| `animation_duration_ms` | int | |
| `is_fullscreen` | bool | High-tier gifts take over the screen |
| `active` | bool | |

### `gift_events`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `sender_id` | uuid FK | |
| `recipient_id` | uuid FK | |
| `gift_id` | uuid FK | |
| `quantity` | int | Combo sends |
| `ember_total` | bigint | |
| `context_type` | enum | `live`, `video` |
| `context_id` | uuid | Stream or video id |
| `created_at` | timestamptz | |

### `watch_sessions`
Powers the watcher leaderboard. See §6 for anti-cheat rules.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `context_type` | enum | `live`, `video` |
| `context_id` | uuid | |
| `attention_seconds` | int | Not wall-clock — see §6 |
| `interactions` | int | Comments, reactions, gifts in session |
| `started_at` / `ended_at` | timestamptz | |

### `leaderboard_entries`
Materialised leaderboard rows, rebuilt on a schedule.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `board` | enum | `top_gifters`, `top_receivers`, `top_watchers` |
| `scope` | enum | `global`, `creator`, `crew` |
| `scope_id` | uuid nullable | |
| `period` | enum | `daily`, `weekly`, `seasonal` |
| `period_start` | date | |
| `user_id` | uuid FK | |
| `score` | bigint | |
| `rank` | int | |

### `live_streams`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `creator_id` | uuid FK | |
| `mux_stream_id` / `mux_playback_id` | text | |
| `status` | enum | `idle`, `live`, `ended` |
| `title` | text | |
| `viewer_peak` | int | |
| `embers_received` | bigint | |
| `started_at` / `ended_at` | timestamptz | |

---

## 5. Gifting system

### Gift catalogue

Build four tiers. Each needs a Lottie animation in `assets/lottie`.

| Tier | Ember cost range | Behaviour on screen |
|---|---|---|
| Spark | 1–20 | Small icon floats up the right edge, 1.5s |
| Flame | 25–200 | Larger animation, centre-right, 3s, sender's name shown |
| Blaze | 250–2,000 | Half-screen animation, 5s, banner with sender name and avatar |
| Inferno | 2,500+ | Full-screen takeover, 8s, screen shake, queued so two never overlap |

Rules to implement:

1. Gifts of the same type sent within 3 seconds **combo** — the animation does not replay, a multiplier counter increments beside it.
2. Blaze and Inferno gifts enter a **queue**. Only one plays at a time; others wait. Show a small "next up" indicator.
3. A user can mute gift animations in settings, but the chat banner still appears.
4. Every gift writes a `gift_events` row and two `ember_transactions` rows (sender debit, recipient credit) inside a single Postgres transaction via an Edge Function. Never do this client-side.

### Ember balance safety

1. All balance mutations go through a Supabase Edge Function named `send-gift`, using `SELECT ... FOR UPDATE` on the sender's balance row.
2. The function must reject the send if balance is insufficient. Never allow a negative balance.
3. The client optimistically decrements the displayed balance, then reconciles from the server response.

---

## 6. Leaderboards

Three boards, each available at three scopes (global, per-creator, per-crew) and three periods (daily, weekly, seasonal).

### Top Gifters
Score = embers spent on gifts in the period.

### Top Receivers
Score = embers received from gifts in the period.

### Top Watchers — this is the hard one

Watch time is trivially gamed by leaving a phone playing. Score on **attention**, not duration:

1. Only count seconds where the app is in the foreground (`AppState === 'active'`).
2. Only count seconds where the video or stream is actually playing and not muted below 10% volume.
3. Cap contribution from a single creator at 30% of a user's daily watch score — forces breadth.
4. Award interaction bonuses: comment = +30s equivalent, reaction = +10s, gift = +60s.
5. Require a periodic liveness signal: every 8–12 minutes (randomised), show an unobtrusive "still watching?" tap target that fades after 15 seconds. Miss it and attention accrual pauses until the next interaction.
6. Hard daily cap of 6 hours of attention score.

Recompute leaderboards every 60 seconds for daily boards via a `pg_cron` job calling a `rebuild-leaderboards` function. Live-stream-scoped boards update in realtime from the gift event stream instead.

### Presentation

1. Leaderboards tab shows the three boards as swipeable segments.
2. Always pin the current user's own row at the bottom of the list, showing their rank and the gap to the position above. The gap is the motivating number — show it explicitly, e.g. "420 embers behind #7".
3. Top 3 get distinct treatments, not just a number — crown, colour, animated border.
4. Seasonal boards reset monthly. Archive final standings to a permanent Hall of Fame on each user's profile.

---

## 7. Payments — read carefully

**This is the single biggest constraint on the project.**

Embers are digital goods consumed inside the app. Apple's App Store Review Guideline 3.1.1 and Google Play's Payments policy both require that digital content consumed within the app is sold through their in-app purchase systems. You cannot use Stripe for ember purchases inside the iOS or Android app. Both platforms take a commission (typically 30%, or 15% under small-business programmes).

Implement it this way:

1. Use `expo-in-app-purchases` to sell consumable ember packs on both stores.
2. Define matching product IDs in App Store Connect and Google Play Console for each pack (e.g. 100, 500, 1,200, 5,000, 12,000 embers).
3. On purchase completion, send the receipt to a Supabase Edge Function named `verify-purchase`.
4. That function validates the receipt against Apple's and Google's verification endpoints server-side, then credits `ember_balances`. Never credit from an unverified client claim.
5. Keep the existing Stripe flow on the **web** app only, where store rules do not apply. Balances are shared, so a user can top up cheaper on the web — that is permitted, but do not link to or mention the web purchase option from inside the iOS app, which Apple prohibits.
6. Creator payouts (converting received embers to real money) go out via Stripe Connect from the backend. Payouts are a backend/web concern and must not appear as an in-app purchase flow.

Model the unit economics before building. After a 30% store cut and payment processing on the payout side, the platform's take of a £1 gift is thin. Decide the ember-to-pound rate and the creator revenue share explicitly and record them in `src/lib/economics.ts` as named constants, not scattered magic numbers.

---

## 8. Unique engagement features

Standard leaderboards create a whale-versus-whale dynamic that alienates everyone outside the top 10. These features are designed to keep mid-tier and non-paying users competing.

### 8.1 Fuel the Fire (communal live goal)
Every live stream has a fire meter that fills with each ember gifted, regardless of who sent it. Crossing thresholds unlocks visible effects for everyone watching — the stream border ignites, the chat changes colour, confetti at the top threshold. Creators can attach their own promise to a threshold ("bonfire = I answer any question"). This makes a 5-ember gift feel like a contribution rather than a rounding error.

### 8.2 Crews
Users join or form a crew of up to 50. Crew leaderboards aggregate members' gifting and watching. This turns solo spending into team competition, and lets non-paying users contribute meaningfully via watch score. Crew chat, crew-only weekly board, crew badge beside username everywhere.

### 8.3 Duels
Two creators go live head-to-head for a fixed 5-minute round. A tug-of-war bar sits between their split-screen feeds, pushed by gifts from each side. Loser does a forfeit they set in advance. This is the single highest-converting format on competing platforms — build it properly, with proper matchmaking by average concurrent viewers so it is not a mismatch.

### 8.4 Ignition Windows
Two randomised 30-minute windows per day where all leaderboard scoring is doubled. Announce each one via push notification 10 minutes before it opens. Creates predictable-but-not-schedulable session spikes.

**Note:** keep these strictly as score multipliers, never as randomised prize draws or chance-based rewards. A random chance of winning something of value in exchange for money is where gambling regulation begins, and that is a door to leave firmly shut given the FCA work already in progress.

### 8.5 First Spark
The first gift sent in any live stream, at any value, pins that sender to the top of chat for the full stream with a distinct badge. One ember can buy real status. Powerful for converting first-time payers.

### 8.6 Patron crowns
The top gifter for a given creator over a rolling 7 days gets a crown beside their name in that creator's chat, their avatar in the corner of the stream, and the ability to set a custom entrance animation when they join. Status that persists and can be lost is far stickier than a one-off ranking.

### 8.7 Streak multipliers
Consecutive days with any meaningful session (≥10 minutes of attention score) build a streak. Streak multiplies watch score by up to 1.5x at 30 days. Missing a day drops to a 1-day grace, then resets. This is the main lever for non-paying user retention.

### 8.8 Creator Heat
A public score on each creator profile combining recent embers received, viewer growth, and average attention retention. Drives a "Rising" section in Discover. Gives small creators a visible ladder to climb, which is what keeps supply on the platform.

---

## 9. Build order

Work in this sequence. Do not start a phase before the previous one runs on a real device.

**Phase 1 — Foundations**
1. Scaffold the Expo project with TypeScript and Expo Router.
2. Wire Supabase client and port the existing auth flow (sign-up, sign-in, session persistence via `expo-secure-store`).
3. Build the tab navigator shell with placeholder screens.
4. Ship an EAS development build to a physical device.

**Phase 2 — Short-form feed**
1. Build the vertical paging feed with FlashList and `expo-video`.
2. Implement preloading of the next two videos and disposal of players more than two positions away.
3. Add reactions, comments, follow, and share.
4. Target 60fps scrolling on a mid-range Android device — profile before moving on.

**Phase 3 — Embers and gifting (video only)**
1. Run the migrations for `ember_balances`, `ember_transactions`, `gifts`, `gift_events`.
2. Build the `send-gift` Edge Function with row locking.
3. Build the wallet screen and the in-app purchase flow with server-side receipt verification.
4. Build the gift picker sheet and the four animation tiers on video posts.

**Phase 4 — Live**
1. Integrate Mux Live: creator-side RTMP key generation, viewer-side HLS playback.
2. Build live chat over Supabase Realtime.
3. Wire gifting into live, including the combo and queue logic.
4. Build Fuel the Fire.

**Phase 5 — Leaderboards**
1. Build `watch_sessions` tracking with the full anti-cheat rule set from §6.
2. Build the rebuild job and the `leaderboard_entries` table.
3. Build the leaderboards tab and the in-stream live gifter board.

**Phase 6 — Engagement layer**
1. Crews, then Patron crowns, then Streaks, then First Spark.
2. Duels last — it is the most complex and depends on a working live stack.

**Phase 7 — Compliance and launch**
1. Age verification gate.
2. Reporting and blocking flows on every surface: video, live, chat message, profile.
3. Content moderation queue.
4. Store listings, privacy nutrition labels, TestFlight and Play Internal Testing builds.

---

## 10. Things to flag rather than decide

Raise these with Ben before implementing; do not pick an answer unilaterally.

1. **Online Safety Act 2023.** A UK-based platform hosting user-generated video and live streaming carries duties around illegal content and children's access. Live streaming with a gifting economy attracts particular scrutiny. Highly likely to require age assurance stronger than a self-declared date of birth.
2. **Ember-to-pound rate and creator share.** Needs deciding before the store products are created, because product IDs and prices are painful to change later.
3. **Minimum payout threshold and creator KYC.** Stripe Connect requires identity verification; decide where in the creator journey that sits.
4. **Refund policy for embers.** Consumer rights law interacts awkwardly with non-refundable virtual currency; this needs the lawyer's eye, not the developer's.
5. **Whether under-18s can send gifts at all.** Most platforms bar it. Recommend barring it.

---

## 11. Non-negotiables

1. No balance mutation happens client-side, ever.
2. No purchase is credited without server-side receipt verification.
3. No randomised or chance-based reward is ever exchanged for money or embers.
4. The ledger is append-only.
5. Every leaderboard score must be reproducible from the underlying event tables — no score is stored as the only record of itself.
