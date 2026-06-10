# Pulse — Complete Project Summary

## Vision
A campus marketplace for UniKL MIIT students with AI-powered price controls, escrow-based transactions, runner delivery, admin governance, and a progressive-disclosure listing flow.

---

## Architecture Overview

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Auth | Firebase Authentication (email/password + Google OAuth from Firebase console) |
| Database | Firestore (Native mode, emulated for dev) |
| Storage | Firebase Storage (listing images) |
| AI Pricing | Anthropic Claude 3.5 Haiku + SerpAPI (real market prices) |
| Email | Resend (welcome emails) |
| UI | Tailwind CSS + shadcn/ui components |
| Maps | Leaflet (react-leaflet) + OpenStreetMap (free, no API key) |
| State | React hooks + Firestore `onSnapshot` real-time listeners |
| Hosting | Vercel (production), localhost (dev) |

---

## Roles & Access Control

| Role | Access |
|------|--------|
| **STUDENT** | Marketplace (create listings, browse, contact seller) |
| **RUNNER** | All STUDENT access + runner missions, active runs, delivery history |
| **MERCHANT** | All STUDENT + merchant dashboard, bulk listing management |
| **CLUB** | Same as MERCHANT (can create listings, manage products) |
| **ADMIN** | Admin panel only — governance, price review, announcements, user management |

Enforced by **NavigationGate** (`components/NavigationGate.tsx`):
- `STUDENT` blocked from `/admin/*`, `/merchant/*`, `/run/*`
- `RUNNER` inherits all `STUDENT` paths + runner paths (never blocked from student pages)
- `CLUB` accesses merchant + student pages
- `ADMIN` restricted to `/admin/*` only

---

## Auth System

- Sign-up: **@s.unikl.edu.my only** — regex in `lib/auth-utils.ts` rejects all other domains
- Login: email/password or Google OAuth
- Role stored in Firestore `users/{uid}` document under `role` field
- Welcome email sent via **Resend** (`POST /api/send-welcome`) with creative HTML template (3 stat cards + CTA)
- CLI admin: `firebase-admin` script at `scripts/manage-users-cli.cjs` — assign/edit roles, list users

---

## Price Control System — 6-Layer Engine

All price logic lives in `lib/marketplace/price-engine.ts` (orchestrator) and `price-engine-ai.ts` (AI estimator).

### Layers (priority order)

1. **Exact cache match** — normalized title + condition tier hits cache
2. **Fuzzy cache match** — Jaccard similarity ≥ 0.35 on word tokens
3. **SerpAPI** — live search for real market prices (cached for 24h)
4. **Historical cache** — previous SerpAPI results with tokens matching
5. **AI estimation** — Anthropic Claude 3.5 Haiku (requires `ANTHROPIC_API_KEY`) or rule-based fallback
   - Rule-based: subcategory cache median OR ceiling × condition multiplier (1.0 BNIB, 0.85 Like New, 0.7 Used/Lightly, 0.5 Heavy)
6. **Reference prices / Static ceiling** — all layers return `is_enforced: true`

### Enforcement

- **Tier A (REGULATED): ACADEMIC** — cannot publish above ceiling; red panel; publish button disabled
- **Tier B (OPEN): HOSTEL + TECH** — justification textarea shown when price > ceiling → flagged as `SELLER_APPEAL` → admin queue
- **APPAREL** — no price controls at all (zero ceilings, subjective pricing)
- **Typo loophole closed**: STATIC_CEILING now returns `is_enforced: true`; vague titles try AI first, then ceiling

### Price Governance (`lib/marketplace/price-governance.ts`)

- `analysePrice()` — accepts `overrideCeiling` + `marketBaseline` params
- Displays "Market avg" instead of old "Shopee avg"
- Used in CreateListing, merchant dashboard, admin price review

---

## Categories & Subcategories

Defined in `lib/marketplace/categories.ts`:

| Category | Subcategories | Controls |
|----------|--------------|----------|
| **ACADEMIC (formerly Books)** | Textbooks, Notes & Guides, Reference, Stationery | Tier A regulated, `subject_code` field |
| **TECH** | Laptops, Smartphones, Software Licences | Tier B, brand/specs/warranty (excl. Software Licences) |
| **HOSTEL** | Furniture, Appliances, Decor & Organising, Storage & Shelving | Tier B, `pickup_difficulty` only on bulky |
| **APPAREL** | Men's Casual, Men's Formal, Women's Casual, Women's Formal, Shoes & Sneakers, Sports & Activewear | No price controls |
| ~~**HUNGER (Food)**~~ | REMOVED entirely | N/A |

---

## Smart Listing Form (`SmartFormFields.tsx`)

- Progressive disclosure — sequential reveal of fields
- "Other" brand → text input appears
- Dynamic spec placeholders per subcategory
- Warranty field only for BNIB / Like New conditions
- "Use RM X" button (muted gray) for one-tap market benchmark insertion
- Same form for all roles (student listing page + merchant CreateListing component)

---

## Admin Panel

| Route | Feature |
|-------|---------|
| `/admin/overview` | Dashboard overview (replaces old `/admin/dashboard` which is now a redirect) |
| `/admin/governance` | Price guidelines management |
| `/admin/price-review` | Queue of SELLER_APPEAL flags with justification + badge |
| `/admin/announcements` | CRUD announcements (Megaphone icon in SYSTEM sidebar) |
| `/admin/users` | User management |
| `/admin/listings` | Listing moderation |
| `/admin/reports` | Reports |

---

## Announcement System

- **Admin CRUD**: `app/admin/announcements/page.tsx` — create/edit/delete/list announcements in Firestore
- **User-facing banner**: `components/AnnouncementBanner.tsx` — dismissible per session, shown across platform
- **Marketplace integration**: "Happening This Week" section above Discover Items on marketplace page

---

## Seed Data

- `scripts/seed-listings.cjs` — seeds 20 listings across categories
- All seed listings with `seller_id === 'SEED_ADMIN'` have been deleted from Firestore

---

## Key Decisions Made

1. **Same listing form for all roles** — no separate UI for students vs merchants
2. **Same price rules for all roles** — no relaxed controls for clubs (prevents friend-listing abuse)
3. **Apparel removed from price control** — clothing pricing is subjective, zero ceilings
4. **HUNGER/Food removed** — no food on the platform
5. **Cache normalization** uses condition-tier suffix so different conditions get different SerpAPI lookups
6. **Sequential field reveal** in SmartFormFields instead of all-at-once overload
7. **Fuzzy cache threshold = 0.35 Jaccard** — catches typos without false matches across subcategories
8. **AI is fallback only** — SerpAPI runs first (real prices = authoritative); AI only when SerpAPI + cache fail
9. **Rule-based AI fallback** uses subcategory cache median or ceiling × condition multiplier (works without Anthropic key)
10. **Announcement banner dismissible per session** (not permanent dismiss)
11. **All "Shopee" → "Market" / "Online"** — avoids trademark/defamation risk
12. **RUNNER inherits STUDENT access** — never blocked from student pages
13. **Welcome email via Resend** — free tier, creative HTML, server-side to avoid CORS/auth issues
14. **Verified shield badge** on ProductCard replaces generic green circle for clearer visual distinction
15. **ACADEMIC department → program** with actual MIIT course names
16. **ACADEMIC subject_code** — restricted to books/notes only

---

## Environment Variables Required

| Variable | Purpose |
|----------|---------|
| `FIREBASE_PROJECT_ID` | Firebase project |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account |
| `FIREBASE_PRIVATE_KEY` | Firebase service account key |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase client SDK config (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) |
| `SERPAPI_API_KEY` | Real market price data via Google Shopping |
| `ANTHROPIC_API_KEY` | AI price estimation (optional but recommended; rule-based fallback works without it) |
| `RESEND_API_KEY` | Welcome email delivery |
| `NEXT_PUBLIC_APP_URL` | Base URL for email links (e.g. `http://localhost:3000`) |

---

## Demo Accounts

Created via `scripts/manage-users-cli.cjs`:

| Email | Role | Password |
|-------|------|----------|
| `demo.admin@s.unikl.edu.my` | ADMIN | Not visible (set via Firebase console) |
| `demo.merchant@s.unikl.edu.my` | MERCHANT | Not visible |
| `demo.student@s.unikl.edu.my` | STUDENT | Not visible |
| `demo.runner@s.unikl.edu.my` | RUNNER | Not visible |
| `demo.club@s.unikl.edu.my` | CLUB | Not visible |

---

## Known Issues / Caveats

- Turbopack cache may corrupt — delete `.next` directory if you get Internal Server Error on page navigation
- `onSnapshot` listeners in admin pages need try-catch wrapping (Firestore permissions can cause unhandled rejections)
- Seed data used `seller_id === 'SEED_ADMIN'` convention — all such listings have been cleaned

---

## File Map (key files)

```
app/
├── admin/
│   ├── overview/page.tsx          # Dashboard overview (replaces old dashboard redirect)
│   ├── dashboard/page.tsx         # Now just redirects to /admin/overview
│   ├── price-review/page.tsx      # SELLER_APPEAL queue with justification + badge
│   ├── governance/page.tsx        # Price guidelines management
│   └── announcements/page.tsx     # CRUD announcement system
├── marketplace/
│   ├── create/page.tsx            # Student listing creation
│   └── [id]/page.tsx              # Listing detail with metadata fields
├── api/
│   ├── price-intelligence/route.ts # Price intelligence API (returns is_enforced + comparable)
│   ├── send-welcome/route.ts       # Resend welcome email
│   └── contact-seller/route.ts     # Contact seller via email
├── (auth)/login/page.tsx           # Login page
├── (auth)/sign-up/page.tsx         # Sign-up page (validates @s.unikl.edu.my)
components/
├── NavigationGate.tsx              # Role-based route enforcement
├── CreateListing.tsx               # Merchant listing creation (shares SmartFormFields)
├── SmartFormFields.tsx             # Progressive-disclosure listing form
├── ProductCard.tsx                 # Card with verified shield SVG badge
├── PriceHealthIndicator.tsx        # Green/amber/red dot on merchant dashboard
└── AnnouncementBanner.tsx          # User-facing dismissible announcement banner
lib/
├── marketplace/
│   ├── price-engine.ts             # 6-layer price orchestrator (exact → fuzzy → SerpAPI → hist → AI → ceiling)
│   ├── price-engine-ai.ts          # OpenAI + rule-based price estimator
│   ├── price-governance.ts         # analysePrice() with overrideCeiling + marketBaseline
│   └── categories.ts              # Category/subcategory config, brands, ceilings
├── auth-utils.ts                   # Email validation regex (@s.unikl.edu.my only)
└── firebase.ts                     # Firebase client init (v9+ modular)
scripts/
├── seed-listings.cjs               # Seed 20 listings into Firestore
└── manage-users-cli.cjs            # CLI admin tool for role management
```

---

## Commands

```bash
npm run dev          # Start dev server (with Turbopack)
npm run build        # Production build
node scripts/manage-users-cli.cjs --help  # CLI user management
node scripts/seed-listings.cjs            # Seed listings
```
