# Ember — Technical Build Plan

**Purpose of this document:** a concrete brief for building the real Ember platform — accounts, video, feed, comments, and the (currently non-monetary) tipping mechanic — as a proper multi-week engineering project. This is written to be handed to Claude Code as a build spec, and to give you a clear map of decisions and sequencing.

Everything here assumes **embers stay non-monetary** until the FCA question resolves. Nothing in this plan requires real payments to ship.

---

## 1. Stack recommendation

| Layer | Recommendation | Why |
|---|---|---|
| Frontend framework | **Next.js** (React) | Matches the demo's component structure closely; huge ecosystem; deploys natively to Vercel |
| Hosting | **Vercel** | Zero-config Next.js deploys, preview URLs per branch, generous free tier |
| Database | **Postgres** via **Supabase** or **Neon** | Supabase bundles auth + storage + Postgres in one place, which reduces the number of services you're stitching together early on |
| Auth | **Supabase Auth** (or Clerk if you want a more polished pre-built UI) | Handles email/password, magic links, and session management out of the box |
| Video hosting/transcoding | **Mux** (or Cloudflare Stream as a cheaper alternative) | Do not build your own transcoding pipeline — this is a solved problem and a bad place to spend engineering time pre-launch |
| Object storage (thumbnails, avatars) | **Cloudflare R2** or **Supabase Storage** | R2 has no egress fees, which matters once traffic grows |
| Email (transactional) | **Resend** or **Postmark** | Waitlist confirmations, notifications |

This is a recommendation, not a requirement — if you or whoever builds this has a strong existing preference (e.g. Firebase, PlanetScale, Django), the phased plan below still applies; only the specific service names change.

---

## 2. Data model (first pass)

```
users
  id, email, display_name, handle, role (viewer | creator | both),
  avatar_url, bio, created_at

videos
  id, creator_id (fk users), title, description, video_asset_id (Mux/Cloudflare ref),
  thumbnail_url, duration_seconds, status (processing | live | removed),
  tags (array), view_count, ember_count, created_at

follows
  follower_id (fk users), creator_id (fk users), created_at

comments
  id, video_id (fk), user_id (fk), body, parent_comment_id (nullable, for replies),
  created_at

tips  -- kept as a ledger even while non-monetary, so the mechanic is real
  id, sender_id (fk), recipient_id (fk), video_id (nullable fk),
  comment_id (nullable fk), amount, is_demo_currency (bool, always true for now),
  created_at

likes
  user_id (fk), video_id (fk), created_at

reports
  id, reporter_id (fk), target_type (video | comment | user), target_id,
  reason, status (open | actioned | dismissed), created_at
```

Keeping `tips` as a real ledger table from day one — even while `is_demo_currency` is always `true` — means the eventual flip to real payments is a data-migration exercise, not a rebuild.

---

## 3. Phased build plan

### Phase A — Foundation (week 1)
- Project scaffolding (Next.js + chosen backend)
- Auth: sign up, log in, log out, session persistence
- Basic profile page (viewer or creator role selection)
- Deploy pipeline working end-to-end (push to main → live on Vercel)

**Definition of done:** a stranger can create an account and see an empty dashboard.

### Phase B — Upload and playback (weeks 2–3)
- Creator upload flow → Mux/Cloudflare Stream integration
- Video processing status handling (uploading → processing → live)
- Playback page with the Tiles grid view
- Basic video metadata (title, description, tags)

**Definition of done:** a creator can upload a video and a viewer can watch it.

### Phase C — Social layer (week 4)
- Comments (flat, then threaded if time allows)
- Likes
- Follows
- Flow mode (vertical full-screen feed, reusing the demo's UI patterns)

**Definition of done:** the demo's two-mode browsing experience works against real data.

### Phase D — Tipping (non-monetary) and leaderboards (week 5)
- Hold-to-tip mechanic wired to the `tips` ledger table (embers still non-monetary)
- Per-video leaderboard, computed from the ledger
- Viewer-to-viewer comment tipping
- Wallet balance (demo balance, resets or is admin-adjustable — no real currency)

**Definition of done:** functionally identical to the current HTML demo, but backed by a real database and real accounts instead of a hardcoded array.

### Phase E — Feed intelligence (week 6)
- Basic affinity scoring (tag-weighted, as in the demo) using real like/tip data
- "For you" ranking query
- Search and tag-based filtering

### Phase F — Moderation tooling (week 6–7, can run parallel to E)
- Report submission (already in data model)
- Admin queue for reviewing reports
- Content removal / account suspension actions
- This phase should ship **before any public launch**, not after — see Community Guidelines document

### Phase G — Polish and launch readiness
- Rate limiting / abuse prevention on tipping and comments
- Mobile responsiveness pass
- Analytics (basic: signups, uploads, watch time, tips sent)
- Closed beta with your waitlist before public launch

---

## 4. What stays out of scope until FCA guidance lands

Do **not** build any of the following until the regulatory position is clear:
- Purchasing embers with real money
- Wallet connection (Phantom/Solana or any other)
- Redeeming embers for cash, goods, or crypto
- Any transfer of embers to an external address

The `is_demo_currency` flag in the data model above is the seam where this gets switched on later — the intent is that switching it off requires adding new functionality, not un-doing anything already built.

---

## 5. Suggested next step

Hand Phase A of this document to Claude Code as the first build task. A good opening prompt: *"Set up a Next.js + Supabase project implementing Phase A of this build plan: auth, basic profile, and a working deploy pipeline to Vercel."* Attach this document for full context.
