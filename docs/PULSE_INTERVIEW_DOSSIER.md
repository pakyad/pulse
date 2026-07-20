# Pulse — Technical Interview Dossier

**Evidence basis.** This dossier is based on the tracked repository inspected on 20 July 2026: the Next.js app, Firebase configuration/rules, Cloud Functions source, shared libraries, routes, components, scripts, and the separate Flutter prototype. Environment secrets and personal data were deliberately not reproduced. A claim marked **not confirmed** is not evidenced by code or configuration.

## 1. What Pulse solves

Pulse is a campus marketplace and delivery PWA prototype. It lets students discover and buy listings, sellers/club merchants fulfil orders, runners accept delivery work, and administrators oversee users, pricing, disputes, escrow, announcements, and operational data. The distinctive product idea is **campus price intelligence**: it attempts to benchmark a listing and applies a campus price cap or review workflow.

**Target users:** student buyers and sellers, official club merchants, runners, and administrators. The role names and route structure support this. There is no code evidence of production users, adoption, revenue, or measured business results.

**Interview-safe one-liner:** “Pulse is a role-based campus marketplace prototype with multi-vendor ordering, real-time fulfilment, runner proof of delivery, and price-governance workflows.”

## 2. Inspection scope and systems examined

- **Next.js app:** 80 `app/**/page.tsx` routes, layouts, templates, error/loading screens, 3 API routes, and 5 server-action files.
- **UI:** 66 reusable components across shared, marketplace, merchant, runner, admin, and Pulse/hub features.
- **Backend:** Firebase Authentication, Firestore, Cloud Storage, Cloud Functions, Firebase Admin SDK, plus Next.js API routes/server actions.
- **Integrations:** Claude/Anthropic, SerpAPI Google Shopping, Resend, Google Maps, Leaflet, QR scanning, Firebase Cloud Messaging code paths.
- **Data/configuration:** `firestore.rules`, `storage.rules`, `firebase.json`, `next.config.ts`, TypeScript/ESLint config, PWA manifest, package manifests, and a legacy Supabase SQL schema.
- **Operations:** 85 seed/repair/cleanup scripts, one stock stress script, and a separate Flutter prototype at `codep-pulse/`.

Key files: `app/layout.tsx`, `components/NavigationGate.tsx`, `lib/firebase.ts`, `lib/firebase-admin.ts`, `firestore.rules`, `storage.rules`, `functions/src/index.ts`, `app/actions/*`, `app/cart/checkout/page.tsx`, `app/run/*`, `lib/marketplace/*`, `lib/core/locations.ts`.

## 3. Architecture and request/data flow

```text
Browser (Next.js client components)
  ├─ Firebase Auth: identity/session persisted in browser local storage
  ├─ Firestore SDK: reads, direct writes, onSnapshot real-time subscriptions
  ├─ Firebase Storage: listing images and pickup/delivery proof uploads
  ├─ Callable Functions: placeOrder, pcsValidate, priceSentinel, handshake
  └─ Next server actions/API routes: Admin SDK operations and price checks

Cloud Functions
  ├─ Firestore transactions and triggers
  ├─ SerpAPI / Anthropic price validation
  ├─ Resend welcome email
  └─ Firebase Cloud Messaging when an FCM token exists
```

**Rendering:** App Router routes are mainly client components (`"use client"`) that fetch/subcribe in effects. Server actions exist but do not provide an application-wide server-rendered data layer. The root wraps the app with `CartProvider`; cart state is persisted to `localStorage`.

**Trade-off:** rapid Firebase-driven realtime development versus a larger client bundle, more duplicated data-access logic, and less reliable server-side enforcement.

## 4. Frontend structure, routing, state and PWA

- Route groups are not used; paths reflect product areas directly: `/marketplace`, `/cart`, `/orders`, `/merchant`, `/run`, `/admin`, `/hub`, `/pulse`, `/messages`, `/me`.
- Global navigation/role redirects live in `components/NavigationGate.tsx`; admin has a separate client-side layout guard in `app/admin/layout.tsx`.
- React Context holds only the cart. Most other state is local `useState` plus Firestore `onSnapshot` subscriptions.
- UI uses Tailwind CSS, Framer Motion, Lucide icons, Recharts, Google Maps/Leaflet, and responsive desktop/mobile merchant components.
- `public/manifest.json` defines a standalone PWA manifest and one SVG icon. **Not confirmed:** no service-worker registration, Workbox configuration, cache strategy, install testing, or offline data handling was found. Therefore, say “PWA manifest support,” not “offline-first PWA.”

## 5. Backend services and APIs

### Next.js API routes

- `app/api/marketplace/price-check/route.ts`: validates basic title/category input and invokes the Next price engine.
- `app/api/price-intelligence/route.ts`: similar price-engine wrapper with a simplified response.
- `app/api/send-welcome/route.ts`: currently returns `{ success: true }`; it does not send mail.

### Server actions

- `orderActions.ts`: single-order creation, cancellation, escrow release.
- `deliveryActions.ts`: delivery completion, runner payout update, proof URL storage.
- `adminActions.ts`: approvals, warnings, suspension, disputes, escrow, runner status, governance records.
- `productActions.ts`: price-guideline listing creation.
- `reviewActions.ts`: review creation and seller replies.

### Cloud Functions (`functions/src/index.ts`)

- Callable: `placeOrder`, `priceSentinel`, `adjudicateAppeal`, `completeHandshake`, `pcsValidate`.
- Triggers: `onOrderStatusChanged`, `onOrderCreated`, `onReviewCreated`.
- Auth trigger: `sendWelcomeEmail`.

Functions are configured for Node 20. `placeOrder` and `pcsValidate` use `maxInstances: 10`; they target `us-central1`. No app-level rate limiting, queueing, or idempotency-key scheme is evidenced.

## 6. Firebase products and data model

### Products used

- **Auth:** email/password registration/login and browser-local persistence.
- **Firestore:** profiles, listings, orders, messages, workflows, dashboards, price cache, and governance data.
- **Storage:** listing images, avatars, receipts, delivery/pickup proof, parcels, errands, disputes.
- **Cloud Functions:** privileged-looking business operations, triggers, AI/service integrations.
- **Admin SDK:** server actions and cloud functions.
- **FCM:** notification sending is implemented when a user document has `fcmToken`; token registration/permission prompting was not confirmed.

### Observed Firestore collections

`users`, `items`, `orders`, `parent_orders`, `Reviews`, `conversations`, `chats` and chat `messages`, `notifications`, `disputes`, `appeals`, `PriceGuidelines`, `price_reports`, `price_cache`, `market_reference_prices`, `sellerTrustScores`, `governance_logs`, `governance_vault`, `ledger`, `payout_requests`, `activityLogs`, `banners`, `announcements`, `campaigns`, `facilities`, `events`, `vitals`, `pulse_posts`, `campus_radar`, `bookings`, `admin_evidence`, and `settings/pcs_config`.

### Core relationships

- `users/{uid}` is the profile document for a Firebase Auth user.
- `items.seller_id → users/{uid}`.
- `orders.buyer_id`, `orders.seller_id`, and sometimes `orders.runner_id → users/{uid}`.
- `parent_orders` groups sub-orders produced by multi-vendor checkout.
- Reviews identify the order, item, reviewer, and seller; Cloud Function aggregation updates a seller profile.
- A created order triggers a seller notification and creates a `chats/{post_seller_buyer_order}` thread.

**Indexes:** Firestore composite indexes are not defined in the repository. Several multi-filter queries exist; deployments may require console-created indexes. Do not claim indexes are managed as code.

**Legacy ambiguity:** `lib/db/schema.sql` is a Supabase/PostgreSQL schema, while live code uses Firebase. `@supabase/supabase-js` is listed, but an active Supabase client/data path was not found. Treat this as a legacy/prototype artifact.

## 7. Authentication, authorization and RBAC

### What is implemented

- `lib/auth-utils.ts` registers email/password users and locally validates the `@s.unikl.edu.my` domain.
- The user profile starts with `role: 'STUDENT'`.
- `NavigationGate` and admin layout redirect users according to profile role; merchant/runner/admin pages are hidden or redirected in the UI.
- A hard-coded vetted-account list is synchronized from the browser in `NavigationGate` and `usePulseRegistry`.

### Critical limitation — interview answer must be honest

The repository does **not** demonstrate secure RBAC. Firestore rules permit any signed-in user to write their own profile document, including role-bearing fields; broad collections such as items and orders allow any signed-in user to write. The client guard is not a server security boundary. Multiple privileged server actions accept a caller/admin/user ID parameter rather than verifying a token on the server.

**Correct answer:** “Role-specific navigation is implemented, but true production RBAC is incomplete. Before deployment I would use Firebase custom claims or server-verified ID tokens, field-level Firestore rules, and privileged Cloud Functions for financial/governance writes.”

Never say: “Users cannot assign themselves admin.” The current code does not prove that.

## 8. Role workflows

### Student

Register/login, browse marketplace, add cart items, select self-collection or runner delivery, execute the simulated checkout flow, follow an order, message counterparties, report prices/issues, and review delivered orders.

### Seller / club merchant

Create/list/edit items, receive orders and notifications, transition orders through acceptance/preparation/ready states, interact with price reviews/appeals, monitor analytics, inspect evidence, and reply to reviews.

### Runner

Apply/register, toggle availability, browse missions, take a mission through a transaction in `app/run/missions/page.tsx`, upload pickup/delivery images, use a map, and confirm completion subject to a client-provided location check plus a server-action distance check.

### Administrator

View realtime dashboards; manage price reviews, appeals, disputes, escrow, users, merchants, runners, settings, announcements, logs, and governance vault data. The available functionality is rich; its authorization must be hardened before it is trusted.

## 9. Listing, ordering, payment, and transaction lifecycle

### Listing

The listing UI calls `pcsValidate` in several paths and/or direct Firestore writes. The price engines can store pricing status/baseline/cap fields on the item. The `submitProductListing` server action separately uses `PriceGuidelines`. This is duplicated logic and not one canonical listing pipeline.

### Multi-vendor checkout

`app/cart/checkout/page.tsx` stores cart selections client-side, presents an FPX-branded payment experience, then calls Cloud Function `placeOrder`. `placeOrder` reads item stock and prices inside a Firestore transaction, groups cart lines by client-provided `vendorId`, creates one sub-order per group and one `parent_orders` record.

### Payment status

The repository contains no payment-gateway SDK, redirect, signed webhook, bank confirmation, or reconciliation. It passes a demo receipt URL and writes parent orders as `PAID`. Therefore: **FPX payment is a simulated UI flow, not an integrated payment system.**

### Concurrency

Cloud Function `placeOrder` reads stock in a Firestore transaction, but its source explicitly says stock decrement was moved to merchant preparation and does not decrement stock in that transaction. The separate single-order server action does decrement stock transactionally. These competing paths create inconsistent inventory semantics. Transaction retries are provided by Firestore; duplicate checkout requests are not explicitly prevented by an idempotency key.

## 10. Price intelligence: SerpAPI and Claude

### Next price engine

`lib/marketplace/price-engine.ts` implements this ordered strategy:

1. Inspect category/subcategory configuration; non-comparable categories use a fixed ceiling.
2. Normalize title and build a condition-aware cache key.
3. Use a fresh Firestore price cache (24 hours).
4. Fuzzy-match recent cached title tokens using Jaccard similarity.
5. Query SerpAPI Google Shopping for Malaysia; use the median of the five lowest parsed results.
6. Use older cached data if SerpAPI is unavailable.
7. Ask Claude for a price estimate with a 5-second timeout.
8. Use seeded Firestore reference data or a static category ceiling.

It applies a 0.90 multiplier to derive a suggested campus maximum. `validatePriceZone` allows green/yellow listings and blocks red listings in that route.

### Cloud Function PCS validator

`pcsValidate` is separate. It uses secrets for Anthropic/Resend, optionally calls SerpAPI, filters certain title keywords, caches a floor/ceiling/source record for 24 hours, prompts Claude to return JSON, retries after invalid JSON once, then marks the item approved/flagged/free-market/blocked.

### Honest limitations

- No confirmed cost telemetry, spend cap, quota monitor, per-user quota, or rate limiter.
- SerpAPI uses a 6-second abort; Claude uses a 5-second abort in the Next engine. Failures fall back, but no circuit breaker/observability is shown.
- Prompt output is parsed with a regex and `JSON.parse`; it is not schema-validated with Zod.
- The title and category influence the price; AI output is an estimate, not proof of fair value.
- Next and Function implementations differ in model usage, cache fields, policy, and enforcement. Consolidate them before production.

**Interview-safe explanation:** “I use external market data and AI as advisory inputs with layered fallbacks, not as an autonomous source of truth. The production improvement is one validated service, cost/rate controls, provenance records, and human review for exceptions.”

## 11. GPS, privacy, and proof

`lib/core/locations.ts` contains campus node tokens and fixed coordinates. It calculates Haversine distance. Runner pages use browser geolocation (`getCurrentPosition` or `watchPosition`), maps, and camera-file inputs. `deliveryActions.completeDelivery` compares runner coordinates to client-provided buyer coordinates and rejects a distance over 50 metres. The active runner page supplies buyer coordinates from a known drop-off node.

**Implemented:** a 50m proximity calculation and photo proof upload.

**Not implemented/unsafe:** location accuracy is not checked; there is no device attestation, anti-mock-location signal, signed location, server-controlled destination lookup in the completion action, retention policy, consent screen, geofence history, or spoof-detection method. Coordinates are provided by the client and may be manipulated.

**Professional answer:** “It is a lightweight proximity gate for a prototype, not an anti-spoofing control. In a real delivery product I would validate against a server-held destination, require acceptable GPS accuracy, record consent/minimal data, use short retention, and combine location with time/proof/fraud signals.”

## 12. Real-time, resilience, and error handling

Firestore `onSnapshot` is used widely for orders, user profile, notifications, marketplace data, dashboards, messages, runner missions, facilities, and Pulse content. This gives rapid UI updates and automatically resubscribes at the SDK layer.

Failure handling exists mainly as UI alerts, console errors, generic catch blocks, and fallback price sources. It is not centralized. No global error-reporting/monitoring provider, dead-letter queue, retry policy, or incident runbook is found. The root has `app/error.tsx` and `app/loading.tsx`; visual component error boundaries exist for maps.

## 13. Security assessment

### Existing controls

- Firebase Auth identity, password handling delegated to Firebase, local email-domain regex check.
- Some Firestore transactions and batches.
- Storage receipt size/content-type restriction.
- Cloud Function secrets are declared through `defineSecret` for Anthropic/Resend.
- Basic input checks in some routes/actions and image proof collection.

### Major vulnerabilities/risks

1. `firestore.rules` broadly allows signed-in writes to high-value collections; item/order/admin evidence/chat operations are not ownership/state scoped.
2. Users can write their own profile wholesale; role and balance integrity are not protected.
3. Storage proof/receipt paths are broadly readable/writable to signed-in users, not tied to an order/participant.
4. Server actions and callable functions frequently trust caller-supplied identities or admin IDs. `placeOrder` can use `request.data.userId` when present instead of only `request.auth.uid`.
5. The admin UI has a development override. Do not expose the dev server on an untrusted network.
6. Direct Firestore client writes compete with Admin SDK/Cloud Function operations.
7. `allowedDevOrigins` is a manually fixed LAN IP; development-specific only.

### First hardening steps

1. Use custom claims/server-token verification; do not trust identity/role from request body.
2. Split safe profile fields from privileged profile fields and write strict field-level rules.
3. Permit items/orders only to owners/participants and enforce state transitions in callable functions.
4. Restrict Storage paths by order participants and validate MIME, size, and upload path.
5. Remove dev-admin bypass in shared environments; add audit logs with actor identity derived server-side.
6. Consolidate checkout, price, and delivery writes behind tested backend commands.

## 14. Performance, scale, deployment, testing, and observability

### Performance/scaling

The application uses many realtime listeners, including broad collection subscriptions in admin/dashboard screens. This is suitable for a small prototype but could increase read volume and client processing at scale. Many lists are not obviously paginated. The price cache reduces repeated external requests. There is no measured latency, load test result, Firestore cost estimate, SLO, CDN/cache plan, or 10,000-user benchmark in the repository.

**Likely first bottlenecks (reasoned, not load-tested):** broad `onSnapshot` listeners; price API calls without rate limiting; external AI/search calls; and mixed client/server writes. State this as an architectural assessment, not a measured fact.

### Deployment/configuration

The repository has Firebase deployment config for Functions/Firestore/Storage and a `.vercelignore`, but no Vercel project configuration, GitHub Actions workflow, CI pipeline, Infrastructure-as-Code, or environment template was found. Firebase client config and server credentials are loaded from environment variables. `next.config.ts` sets `typescript.ignoreBuildErrors: true`; this allows build success despite type errors.

### Testing/quality evidence

- One test-like file exists: `tests/stress_test_stock.js`.
- No `test` npm script, unit-test runner configuration, E2E suite, emulator test suite, CI workflow, coverage threshold, or automated accessibility test was found.
- Repository checks run during inspection: `npm run lint` reports 1,363 problems (748 errors, 615 warnings); `npx tsc --noEmit` fails; a top-level dependency audit reported 19 vulnerabilities (1 critical, 5 high, 13 moderate) at that time.
- **Do not claim test coverage, production readiness, CI/CD, or full TypeScript correctness.**

### Accessibility/browser compatibility

Responsive Tailwind layouts and mobile-specific components are present. Some lint findings flag raw `<img>` use and missing alt text. No browser-support matrix, manual accessibility audit, keyboard test, screen-reader test, or cross-browser test report was found.

## 15. Design patterns and trade-offs

- Firebase singleton initialization prevents hot-reload duplication.
- Cart Context is a simple client state container with local persistence.
- Firestore transactions/batches are used for selected stock, order, review, wallet, and mission writes.
- Event-driven Functions handle order/review side effects.
- Price engine uses a fallback chain to preserve user feedback when external services fail.

Trade-offs: Firebase accelerated the prototype and realtime UX, but permissive rules and distributed direct writes weaken domain consistency. Feature breadth produces an impressive demo but increases duplicate models/status values and maintenance surface.

## 16. Resume-claim audit

| Claim | Defensible? | Safe wording |
|---|---|---|
| Built a Next.js/Firebase campus marketplace | Yes | “Built a prototype with Next.js, Firebase Auth, Firestore, Storage, and Functions.” |
| Implemented four roles | Partially | “Implemented role-specific flows and client-side route gating; backend RBAC hardening remains.” |
| Real-time workflows | Yes | “Used Firestore `onSnapshot` for realtime marketplace, order, mission, dashboard, and message updates.” |
| Atomic inventory/order handling | Partially | “Used Firestore transactions in key paths; inventory semantics need consolidation across checkout flows.” |
| Integrated FPX payments | No | “Built an FPX-style simulated checkout UI; no real gateway/webhook integration.” |
| AI price tracking | Yes, qualified | “Built advisory price intelligence using SerpAPI, Claude, Firestore cache, and static fallbacks.” |
| Secure RBAC | No | “Identified RBAC hardening as the next production step.” |
| GPS verification | Yes, qualified | “Implemented a 50m browser-GPS proximity check and photo proof; it is not spoof-resistant.” |
| Full PWA/offline support | No | “Added a web manifest; offline caching was not implemented.” |
| CI/CD, high scale, measurable performance | Not confirmed | Do not claim without new evidence. |

## 17. Interview question bank

Use the following answers as a truthful base. For each answer, lead with what is implemented, then state the limitation and next improvement.

### Project overview

**Q: What problem does Pulse solve?**  
Testing: product clarity.  
30 seconds: “Pulse centralizes campus buying, selling, delivery, and price-governance workflows. Students can transact, runners can fulfil deliveries, and administrators can handle exceptions. My differentiator is the price-intelligence flow.”  
Deepen: explain role flow and explicit prototype scope.  
Follow-up: “Why not use Shopee?” Answer: campus-specific pickup, student roles, and governance.  
Avoid: claiming adoption metrics. Ref: `app/marketplace`, `app/run`, `app/admin`.

**Q: What did you personally build?**  
Testing: ownership.  
Answer only with code you can navigate and explain. A safe starting point: checkout/runner/price-engine work if you understand those files.  
Avoid: claiming every feature in a large shared repository. Ref: use `git log`, your commits, and files you can demo.

### Architecture / Next.js

**Q: Why Next.js?**  
Testing: framework choice.  
30 seconds: “I used Next.js App Router for file-based routing and a single React codebase. Pulse mainly uses client components because Firebase realtime listeners run in the browser, while server actions/API routes handle some server-side operations.”  
Trade-off: client-heavy rendering and duplicated backend paths. Ref: `app/**`, `components/**`, `app/actions/**`.

**Q: How is state managed?**  
Testing: React understanding.  
Answer: local state for screen interaction, Cart Context/localStorage for cart, and Firestore snapshots for shared live data. No Redux/Zustand is evidenced. Ref: `lib/context/CartContext.tsx`.

**Q: How would you reduce frontend complexity?**  
Answer: organize by domain, centralize Firestore repositories/hooks, define shared types/schemas, limit client components, standardize statuses/field names.

### Firebase / database

**Q: Why Firestore?**  
Answer: document model mapped naturally to user/item/order data and `onSnapshot` gave realtime state changes quickly. Trade-off: denormalization, indexing/cost planning, and rules must be designed carefully. Ref: `lib/firebase.ts`.

**Q: What happens when two users update the same record?**  
Answer: Firestore transactions retry when read documents change. Pulse uses transactions for several flows. But not every direct update is transactional, so the design needs a single backend path for critical state transitions. Ref: `functions/src/index.ts`, `app/actions/orderActions.ts`, `app/run/missions/page.tsx`.

**Q: How do you model multi-vendor checkout?**  
Answer: Cloud Function groups cart lines by vendor, creates a sub-order per vendor, and a parent order summarizing the checkout. Prices are read from item documents. Limitation: client vendor IDs/fee and stock semantics need stricter validation. Ref: `functions/src/index.ts` `placeOrder`.

### Auth and security

**Q: How do you prevent a user assigning themselves admin?**  
Correct answer: “In the current prototype I do not fully prevent it. UI gates exist, but Firestore rules and server actions need hardening. I would move roles to custom claims and enforce verified identity and field-level rules.”  
Avoid: “The admin page is hidden.” Ref: `firestore.rules`, `components/NavigationGate.tsx`.

**Q: What would you change before a regulated company used this?**  
Answer: verified RBAC, immutable audit trail, validated backend commands, test/CI evidence, data retention/consent, observability, deployment controls, threat modeling, and documented requirements/traceability.

### AI and SerpAPI

**Q: Describe your AI price pipeline.**  
Answer: cache first; SerpAPI; stale cache; Claude estimate; seeded reference/static ceiling. Claude receives a constrained output request and the app parses price output; a separate Function uses a JSON prompt/retry. It is advisory, not authoritative. Ref: `lib/marketplace/price-engine.ts`, `price-engine-ai.ts`, `functions/src/index.ts`.

**Q: What if SerpAPI or Claude is unavailable?**  
Answer: timeout/catch returns null and the engine falls back to cache/reference/static ceiling. Limitation: no measured reliability, cost monitor, or per-user throttling. 

**Q: How do you prevent hallucination?**  
Answer: I do not guarantee it. I constrain output, parse it, bound numeric values, cache outputs, and retain a static fallback. Production would use structured schema validation, source provenance, confidence thresholds, and human review.

### GPS and privacy

**Q: How does GPS verification work?**  
Answer: browser geolocation supplies runner coordinates; code uses Haversine distance to a known drop-off node and blocks delivery completion beyond 50m. Photo proof is uploaded to Storage. Ref: `lib/core/locations.ts`, `app/run/active/page.tsx`, `app/actions/deliveryActions.ts`.

**Q: Can it detect GPS spoofing?**  
Answer: no. It is a prototype proximity check. I would use server-held locations, accuracy thresholds, anti-mock signals where possible, proof/time correlation, and risk review.

### Testing / operations

**Q: What is your test strategy?**  
Answer: “The repository has a stock stress script but lacks a mature automated test suite. I would add emulator integration tests for rules, checkout/stock races, roles, and delivery state transitions, then E2E tests for major user journeys.” Avoid claiming coverage. Ref: `tests/stress_test_stock.js`, `package.json`.

**Q: Which part fails first at 10,000 users?**  
Answer: “I have not load-tested it. Architecturally I would investigate broad realtime subscriptions and unthrottled external pricing requests first.” Explain pagination, aggregate counters, listeners scoped by user/role, queues, rate limiting, and monitoring.

### Debugging and behavioural

**Q: Tell me about a hard bug.**  
Answer only from personal evidence. If the LAN reload issue is yours: “Next development HMR required adding the current LAN origin to `allowedDevOrigins`; I verified the machine’s active IP, updated config, restarted the dev server, and confirmed it was reachable.” Do not present it as a production incident.

**Q: What would you improve first?**  
Answer: “Authorization and backend trust boundaries. The feature set is broad, but secure field-level access and one canonical order state machine provide more value than another screen.”

### Company-oriented questions

**Q: Why is Pulse relevant to a manufacturing/medtech internship?**  
Answer: “Pulse is not medical-device software. Its relevant lessons are workflow state control, inventory/order traceability, exception handling, role separation, and the need for stronger verification and auditability before a regulated environment.”

**Q: How would you adapt it for Lam Research/Boston Scientific/Smith+Nephew?**  
Answer: “I would not reuse it as a production system. I would apply the architecture lessons to a controlled operations tool: server-verified roles, immutable event history, acceptance criteria, audit reports, tests, and privacy controls.”

## 18. Mock-interview weak-topic tracker

Track your answers under: architecture; Firestore transactions/data model; secure RBAC; AI limitations; GPS/privacy; PWA limitations; testing/quality; deployment; own contribution. Revisit any answer below 7/10.

## 19. Recommended next technical sprint

1. Write strict Firestore/Storage rules and tests using Firebase Emulator.
2. Verify Firebase tokens in callable functions/server actions; remove caller-supplied identity/role authority.
3. Consolidate all order creation into one idempotent backend command with one inventory policy.
4. Consolidate the two price engines and validate AI output using Zod.
5. Remove TypeScript build-error bypass; fix core compile/lint errors.
6. Add E2E/integration tests and a CI workflow.
7. Archive/reorganize one-off scripts and legacy Supabase/Flutter artifacts.
