# Pulse Technical Summary

## 1. Project Overview

### App name

Pulse.

### Purpose

Pulse is a campus commerce and service platform for UniKL MIIT students, campus clubs, runners, and administrators. The app combines a student marketplace, club/merchant ordering, campus delivery, governance workflows, price certification, announcements, and student activity modules into one Firebase-backed web application.

### Target users

- Students who buy, sell, review, chat, place orders, request services, and view campus updates.
- Campus clubs or merchants that list products, manage stock, accept orders, and fulfill pickups.
- Campus runners that accept delivery missions, upload proof, and manage earnings.
- Platform administrators that review listings, resolve disputes, manage announcements, inspect governance logs, approve runners, and oversee marketplace health.

### Tech stack

- Next.js App Router with React and TypeScript.
- Tailwind CSS for styling.
- Firebase Authentication for sign-in and sign-up.
- Cloud Firestore for application data.
- Firebase Storage for listing images, banners, dispute evidence, and delivery proofs.
- Firebase Cloud Functions for privileged backend workflows.
- Firebase Admin SDK for server actions and scripts.
- Firebase Functions callable APIs from the client.
- Firebase Emulator support behind `NEXT_PUBLIC_USE_EMULATORS`.
- Anthropic Claude from Cloud Functions for PCS price validation.
- Resend from Cloud Functions for welcome email.
- SerpAPI for marketplace price intelligence.
- OpenAI Chat Completions in the AI price engine helper.
- Google Maps Static API and `@react-google-maps/api` for location/delivery screens.
- Leaflet and React Leaflet for map-style UI components.
- QR code and QR scanner libraries for identity/order scanning flows.
- Recharts for admin dashboards.
- Framer Motion for interactive UI animation.
- Lucide React and React Icons for iconography.
- Scripts in `scripts/` for Firestore audit, cleanup, listing organization, and role normalization.

### Deployment platform

The frontend is a Next.js application intended for web deployment. Backend logic is deployed through Firebase Cloud Functions. Data and files live in Firebase Firestore and Firebase Storage. The repository also includes Firebase configuration, Firestore rules, Storage rules, indexes, and local scripts that use the Firebase Admin SDK.

### Repository structure

- `app/`: Next.js App Router pages, route handlers, layouts, and server actions.
- `components/`: Reusable UI components grouped by domain such as admin, merchant, runner, marketplace, layout, shared UI, and home features.
- `lib/`: Firebase setup, Admin SDK helpers, app constants, context providers, marketplace price engines, and utility logic.
- `functions/`: Firebase Cloud Functions source and build configuration.
- `scripts/`: Admin SDK operational scripts for auditing and cleaning Firestore data.
- `public/`: Static assets used by the web app.
- `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`: Firebase project configuration.
- `package.json`: Frontend scripts and dependencies.
- `functions/package.json`: Cloud Functions scripts and dependencies.

## 2. User Roles

### Role values

The current normalized role model uses these Firestore values in `users/{uid}.role`:

- `STUDENT`: regular campus user.
- `CLUB`: campus club, seller, or merchant account.
- `RUNNER`: approved campus delivery runner.
- `ADMIN`: platform administrator.

The cleanup scripts also add `users/{uid}.display_role`:

- `Platform Admin` for `ADMIN`.
- `Campus Runner` for `RUNNER`.
- `Campus Club` for `CLUB`.
- `Student` for `STUDENT`.

### Student capabilities

Students can sign up, sign in, browse the home page, view Pulse updates, create student marketplace listings, buy items, use cart and checkout flows, chat with sellers, review sellers, report prices, raise disputes, view order history, view profile/activity pages, and request campus runner services.

### Club or merchant capabilities

Club accounts can access the merchant dashboard, create merchant listings, upload product images, manage product status and stock, view incoming orders, progress order statuses, open chats with buyers, inspect proofs, export order data, and access shared profile/order pages.

### Runner capabilities

Runners can apply or be verified, toggle online availability, view assigned missions, accept and progress delivery tasks, upload pickup and delivery proof, see mission history, view earnings, and manage runner profile information.

### Admin capabilities

Admins can access the admin dashboard and governance tools, review price flags, manage appeals and disputes, approve or reject runner applications, inspect users and sellers, manage announcements and banners, hold or release escrow, write governance logs, inspect evidence, manage vault records, and monitor platform health.

### How roles are stored

Roles are stored on Firestore user documents in the `users` collection. The main fields are:

- `role`: canonical role value.
- `display_role`: friendly label.
- `is_verified_runner`, `runner_status`: legacy or supporting runner verification fields.
- `is_verified_merchant`, `merchant_status`, `is_seller`: legacy or supporting merchant fields.
- `fullName` and `full_name`: display name variants used by different parts of the app.
- `email`, `matricNumber`, `programme`, `yearOfStudy`, `campus`: student profile data.
- `trustRating`, `totalReviews`, `balance`, `is_online`: marketplace, review, wallet, and runner fields.

### Role-based access enforcement

Access is primarily enforced in `components/NavigationGate.tsx`. That component reads Firebase Auth state, loads `users/{uid}`, resolves the role, and redirects users based on path:

- Unauthenticated users are sent to `/auth`.
- Admin users are routed to `/admin/overview`.
- Club users are routed to `/merchant` except for shared pages such as `/me`, `/activity`, `/me/insights`, `/me/orders`, and `/orders/*`.
- Students are blocked from `/admin` and `/merchant`.
- Development has a local admin override for admin routes.

Additional checks exist inside individual pages and actions:

- `app/admin/layout.tsx` and admin pages expect admin access.
- `app/merchant/page.tsx` checks for `CLUB` or verified merchant status.
- `app/actions/adminActions.ts` uses `requireAdmin()` for privileged server actions.
- `app/actions/orderActions.ts` checks buyer, merchant, seller, and admin permissions for order mutations.
- Runner pages check runner verification or runner-specific fields before showing active runner tools.

## 3. Features List

### Authentication and onboarding

- Implemented by `app/auth/page.tsx`, `app/auth/signup/page.tsx`, `components/Providers.tsx`, `components/NavigationGate.tsx`, and `lib/firebase.ts`.
- Uses Firebase Authentication and the `users` collection.
- Supports email/password login, UniKL student sign-up validation, profile creation, password strength UI, and role-aware redirects.
- Microsoft SSO appears as a disabled or coming-soon UI path.

### Global app shell and navigation

- Implemented by `app/layout.tsx`, `components/Header.tsx`, `components/BottomNav.tsx`, `components/NavigationGate.tsx`, and `components/ClientOnly.tsx`.
- Uses Firebase Auth and `users`.
- Provides role-aware header and bottom navigation.

### Home dashboard

- Implemented by `app/home/page.tsx`, `components/home/FeaturedBanner.tsx`, `components/home/ServiceGrid.tsx`, `components/ActiveOrderBanner.tsx`, and `components/runner/FloatingActiveTask.tsx`.
- Uses `users`, `items`, `banners`, and active order data.
- Shows banner carousel, service shortcuts, featured marketplace items, and active order/task indicators.

### Pulse tab

- Implemented by `app/pulse/page.tsx`.
- Uses `users`, `announcements`, `campus_radar`, and `events`.
- Shows campus announcements, radar cards, and a "Happening This Week" event section. The page has fallback demo data when live collections are empty.

### Marketplace browsing

- Implemented by `app/marketplace/page.tsx`, `components/shared/ProductCard.tsx`, `components/MarketplaceFilterOverlay.tsx`, and marketplace helpers.
- Uses `items`, `campaigns`, `users`, and cart context.
- Supports search, category filtering, official/student filters, product cards, PCS badges, active order banner, and marketplace navigation.

### Student listing creation

- Implemented by `app/marketplace/create/page.tsx` and `components/CreateListing.tsx`.
- Uses `items`, `users`, Firebase Storage, and the callable Cloud Function `pcsValidate`.
- Supports standard versus handmade/custom listing type selection, image upload, category selection, PCS validation, custom item RM500 handling, and Firestore item creation.

### Item detail and seller contact

- Implemented by `app/marketplace/[id]/page.tsx`.
- Uses `items`, `users`, `Reviews`, `chats`, and `chats/{chatId}/messages`.
- Supports item viewing, seller profile summary, PCS display, reviews, add to cart, buy now, seller chat creation, price reports, and seller edit/delete controls.

### Cart and checkout

- Implemented by `app/cart/page.tsx`, `app/cart/checkout/page.tsx`, `lib/context/CartContext.tsx`, `components/CartIcon.tsx`, and `app/actions/orderActions.ts`.
- Uses `items`, `orders`, `parent_orders`, and `notifications`.
- Supports client cart state, checkout, stock validation, parent order creation, sub-order creation, and low-stock seller notification.

### Orders and order history

- Implemented by `app/orders/[id]/page.tsx`, `app/orders/history/page.tsx`, `app/me/orders/page.tsx`, `app/actions/orderActions.ts`, and Cloud Function order triggers.
- Uses `orders`, `parent_orders`, `items`, `users`, `Reviews`, `disputes`, `notifications`, `chats`, and `ledger`.
- Supports order detail, status tracking, cancellation, escrow release, delivery maps, disputes, reviews, and buyer/seller history.

### Merchant dashboard

- Implemented by `app/merchant/page.tsx`, `components/merchant/DesktopMerchant.tsx`, and `components/merchant/ProofInspector.tsx`.
- Uses `users`, `items`, `orders`, `chats`, `messages`, Firebase Storage, and `pcsValidate`.
- Supports merchant inventory, product upload, PCS checks, order queues, ready/preparing state changes, buyer chat, proof inspection, CSV export, shop settings, and sign-out.

### Runner flows

- Implemented by `app/run/page.tsx`, `app/run/active/page.tsx`, `app/run/history/page.tsx`, `app/run/missions/page.tsx`, `app/runner/page.tsx`, `app/runner/onboarding/page.tsx`, `app/runner/pending/page.tsx`, `components/runner/*`, and `components/map/LeafletDeliveryMap.tsx`.
- Uses `users`, `orders`, Firebase Storage, Google Maps, and runner-related order fields.
- Supports runner verification states, online toggle, mission discovery, active mission tracking, proof uploads, delivery progression, wallet/earnings views, and live map UI.

### Admin overview and governance

- Implemented by `app/admin/overview/page.tsx`, `app/admin/appeals/page.tsx`, `app/admin/disputes/page.tsx`, `app/admin/evidence/page.tsx`, `app/admin/escrow/page.tsx`, `app/admin/logs/page.tsx`, `app/admin/price-review/page.tsx`, `app/admin/runner/page.tsx`, `app/admin/sellers/page.tsx`, `app/admin/users/page.tsx`, `app/admin/vault/page.tsx`, and `app/actions/adminActions.ts`.
- Uses `users`, `items`, `orders`, `disputes`, `appeals`, `PriceGuidelines`, `governance_logs`, `governance_vault`, `admin_evidence`, `ledger`, `payout_requests`, `notifications`, and `Reviews`.
- Supports analytics, PCS review, seller warnings, item approval/rejection, disputes, appeals, escrow actions, runner approval, evidence management, governance vault, logs, user review, and seller management.

### Announcements and banners

- Implemented by `app/admin/announcements/page.tsx`, `app/home/page.tsx`, and `app/pulse/page.tsx`.
- Uses `announcements`, `banners`, and Firebase Storage path `banners/...`.
- Supports admin-created banners and announcements, home banner display, and Pulse announcement display.

### Price Certification System

- Implemented by `functions/src/index.ts`, `app/marketplace/create/page.tsx`, `components/CreateListing.tsx`, `components/shared/ProductCard.tsx`, `app/admin/price-review/page.tsx`, `app/api/price-intelligence/route.ts`, `lib/marketplace/price-engine.ts`, and `lib/marketplace/price-engine-ai.ts`.
- Uses `items`, `PriceGuidelines`, legacy `price_cache`, `price_reviews`, `market_reference_prices`, `sellerTrustScores`, and `price_reports`.
- Supports PCS approval, flagged pricing, RM500 no-reference blocking, free-market classification, student price badges, admin review, and external price intelligence helpers.

### Messaging

- Implemented by item detail, merchant dashboard, order triggers, and chat-related UI pages such as `app/messages/page.tsx`.
- Uses `chats` and `chats/{chatId}/messages`.
- Supports buyer/seller conversations, post-purchase chat creation, and merchant chat actions.

### Reviews and trust

- Implemented by `app/review/[orderId]/page.tsx`, `app/actions/reviewActions.ts`, item detail pages, Cloud Function `onReviewCreated`, and profile-related pages.
- Uses `Reviews`, `orders`, `users`, and `items`.
- Supports order reviews and seller trust rating recalculation.

### Disputes, appeals, and evidence

- Implemented by `app/orders/[id]/page.tsx`, admin dispute/appeal/evidence pages, and `app/actions/adminActions.ts`.
- Uses `disputes`, `appeals`, `admin_evidence`, `governance_logs`, `governance_vault`, and Firebase Storage path `disputes/...`.
- Supports buyer disputes, merchant evidence upload, admin evidence inspection, dispute resolution, appeal adjudication, and vault logging.

### Wallet, payouts, ledger, and transactions

- Implemented by admin escrow/ledger pages, runner wallet components, `app/me/wallet/page.tsx`, `app/me/transactions/page.tsx`, and order actions.
- Uses `users.balance`, `ledger`, `transactions`, `users/{uid}/transactions`, and `payout_requests`.
- Supports escrow release, balance updates, runner earnings, transaction history, and payout review.

### Campus services and hub pages

- Implemented by `app/hub/page.tsx`, `app/facilities/page.tsx`, `app/services/page.tsx`, `app/post/page.tsx`, `app/community/page.tsx`, and related components.
- Uses `bookings`, `facilities`, `items`, `orders`, `users`, and Storage uploads depending on page.
- Provides additional campus utilities, facility/service browsing, and older or alternate posting flows.

### QR and scanner flows

- Implemented by `app/scanner/page.tsx` and QR identity/order components.
- Uses QR scanning libraries and order/user identifiers.
- Supports scanning-style flows for campus identity or order workflows.

### Developer, demo, and simulation pages

- Implemented by `app/dev/page.tsx`, `app/sim/inventory/page.tsx`, `app/missions/page.tsx`, and several older runner routes.
- Uses demo data and selected Firestore collections.
- These appear to be support or legacy pages rather than the main production path.

## 4. Firestore Collections

### `users`

Stores account profile, role, trust, runner, merchant, wallet, and verification data.

Key fields include `uid`, `email`, `fullName`, `full_name`, `role`, `display_role`, `campus`, `programme`, `yearOfStudy`, `matricNumber`, `trustRating`, `totalReviews`, `balance`, `is_online`, `is_verified_runner`, `runner_status`, `is_verified_merchant`, `merchant_status`, and `fcmToken`.

Read by authentication, navigation, home, marketplace, item detail, merchant, runner, admin, order, review, and script files.

Written by sign-up, role cleanup scripts, admin actions, merchant/runner flows, review recalculation, escrow release, runner online toggle, and account setup code.

### `users/{uid}/transactions`

Stores per-user wallet or financial transaction entries.

Used by wallet and transaction pages.

### `users/{uid}/notifications`

Stores user-scoped notifications in addition to the global `notifications` collection.

Used by notification-related profile flows.

### `users/{uid}/warnings`

Stores seller warning records issued by administrators.

Written by `issueWarning` in `app/actions/adminActions.ts`.

### `items`

Stores marketplace, club, and UniStore listings.

Key fields include `title`, `description`, `category`, `subcategory`, `price`, `stock_count`, `images`, `image_url`, `seller_id`, `seller_name`, `status`, `merchant`, `is_official`, `listing_type`, `listing_group`, `handover_method`, `pickup_location`, `metadata`, `pcs_status`, `pcs_certified`, `pcs_market_price`, `pcs_max_allowed`, `pcs_reason`, `pcs_is_custom`, and `pcs_checked_at`.

Read by home, marketplace, item detail, cart, checkout, merchant dashboard, admin dashboards, price review, scripts, and order actions.

Written by student create listing, merchant create listing, older post/create listing components, PCS validation, admin approval/rejection, stock-changing order actions, cleanup scripts, and organization scripts.

Listing types are distinguished by `listing_type`, `listing_group`, `merchant`, `is_official`, `seller_name`, and PCS fields:

- Student listings: `listing_type` is `STUDENT`, `merchant` is not true, and `is_official` is not true.
- Club or merchant listings: `listing_type` is `CLUB` or `merchant` is true.
- UniStore official listings: `listing_type` is `UNISTORE`, `is_official` is true, or seller name contains official UniStore wording.
- PCS approved items: `pcs_status` is `APPROVED` and `pcs_certified` is true.
- Free market items: `pcs_status` is `FREE_MARKET`.

### `orders`

Stores marketplace orders, merchant orders, runner tasks, and service requests.

Key fields include `buyer_id`, `seller_id`, `runner_id`, `item_id`, `item_title`, `items`, `title`, `status`, `payment_status`, `escrow_status`, `total`, `price`, `quantity`, `pickup_location`, `delivery_location`, `pickup_coords`, `delivery_coords`, `delivery_fee`, `parent_order_id`, `conversationId`, `created_at`, `updated_at`, proof fields, and handshake fields.

Read by buyer order pages, merchant dashboard, runner dashboards, admin dashboards, Cloud Functions, and scripts.

Written by checkout actions, callable `placeOrder`, service request creation, merchant status updates, runner mission updates, dispute/review flows, admin escrow actions, and cleanup scripts.

Known normalized statuses are `PENDING`, `PREPARING`, `READY`, `PICKED_UP`, `DELIVERED`, and `CANCELLED`. Legacy statuses still appear in code and scripts, including `PENDING_VENDOR`, `PENDING_RUNNER`, `READY_FOR_PICKUP`, `AWAITING_RUNNER`, `RUNNER_ASSIGNED`, `ACCEPTED_BY_RUNNER`, `ON_THE_WAY`, `IN_TRANSIT`, `ARRIVED_AT_BUYER`, `COMPLETED`, `ISSUE_REPORTED`, `REFUNDED`, and payout-related resolved statuses.

### `parent_orders`

Stores grouped checkout records that connect one buyer checkout to multiple vendor sub-orders.

Written by `placeSingleOrder` and callable `placeOrder`.

Read by order history and checkout-related views.

### `notifications`

Stores global notification records for buyers, sellers, runners, and admins.

Key fields include `userId`, `recipient_id`, `title`, `message`, `type`, `read`, `created_at`, and related order/item identifiers.

Written by order actions, Cloud Function order triggers, admin actions, and cleanup scripts.

### `chats`

Stores conversation metadata.

Key fields include `participants`, `participantIds`, `buyer_id`, `seller_id`, `item_id`, `orderId`, `lastMessage`, `lastMessageAt`, and timestamps.

Written by item detail messaging, merchant chat flow, and `onOrderCreated`.

Read by messages pages and order/item communication flows.

### `chats/{chatId}/messages`

Stores individual chat messages.

Key fields include `sender_id`, `text`, `message`, `created_at`, `timestamp`, `system`, and read fields.

Written by item detail, merchant dashboard, and Cloud Function order creation.

### `Reviews`

Stores item, seller, or order reviews.

Key fields include `order_id`, `item_id`, `itemId`, `seller_id`, `sellerId`, `buyer_id`, `rating`, `comment`, and `created_at`.

Written by review pages and review actions.

Read by item detail, profile/reputation pages, admin analytics, and Cloud Function `onReviewCreated`.

### `PriceGuidelines`

Stores PCS review records for flagged or blocked items.

Key fields include `title`, `listed_price`, `market_price`, `max_allowed`, `seller_id`, `status`, `flagged_at`, and `reason`.

Written by `pcsValidate`.

Read and updated by admin price review actions.

### `price_reports`

Stores user-submitted price reports.

Used by price reporting and admin review features.

### `price_cache`

Legacy or helper collection for cached market price intelligence.

Used by price intelligence helpers and cleanup scripts.

### `price_reviews`

Legacy or helper collection for price review state.

Used by price review tooling and cleanup scripts.

### `market_reference_prices`

Legacy or helper collection for reference price records.

Used by price validation tooling and cleanup scripts.

### `sellerTrustScores`

Legacy seller trust collection.

Referenced by cleanup scripts.

### `appeals`

Stores seller or item appeals.

Key fields include item details, seller details, status, decision, notes, and timestamps.

Read by admin appeals page and Cloud Function `adjudicateAppeal`.

Written by appeal flows, admin actions, and Cloud Function appeal adjudication.

### `disputes`

Stores order disputes and evidence metadata.

Key fields include `order_id`, `buyer_id`, `seller_id`, `reason`, `status`, evidence URLs, resolution fields, and timestamps.

Written by order pages and admin actions.

Read by admin disputes/evidence pages.

### `admin_evidence`

Stores administrator-facing evidence records for disputes, orders, or governance cases.

Read by admin evidence tooling.

### `governance_logs`

Stores audit log records for privileged admin and function actions.

Written by admin actions and selected Cloud Functions.

Read by admin logs and overview pages.

### `governance_vault`

Stores archived governance records and snapshots.

Written by admin vault actions.

Read by admin vault pages.

### `ledger`

Stores financial ledger entries.

Written by escrow release and admin payment actions.

Read by admin escrow/ledger and wallet-related pages.

### `payout_requests`

Stores runner or seller payout requests.

Read by admin payout/escrow interfaces.

### `transactions`

Stores platform-level transaction records.

Read by admin and wallet/transaction views.

### `banners`

Stores home banner carousel records.

Key fields include title/copy, image URL, status/active fields, and timestamps.

Written by admin announcements page.

Read by home page.

### `announcements`

Stores campus notices and published announcements.

Key fields include title, message/body, status, published flag, audience, and timestamps.

Written by admin announcements page.

Read by Pulse and home notice-board features.

### `campus_radar`

Stores campus radar cards or short campus feed items.

Read by Pulse page.

### `events`

Stores event or weekly happening records.

Read by Pulse page.

### `campaigns`

Stores marketplace promotional campaigns.

Read by marketplace page.

### `delivery_jobs`

Stores delivery job records or legacy runner jobs.

Present in Firestore and cleanup allowlists, but less central than `orders` in the current runner implementation.

### `activityLogs`

Stores user activity records.

Used by activity/profile pages.

### `reports`

Stores user-generated reports or moderation reports.

Used by report/moderation flows.

### `bookings`

Stores facility or service bookings.

Used by hub/facility/service pages.

### `facilities`

Stores campus facility records.

Used by facilities pages.

### `merchants`

Stores merchant profile data in legacy or alternate merchant flows.

Used by profile pages as a fallback or secondary merchant source.

## 5. Cloud Functions

All exported functions are in `functions/src/index.ts`.

### `placeOrder`

Type: HTTPS callable function.

Purpose: Creates one parent order and one sub-order per vendor from cart checkout data. It validates item existence, validates stock, uses Firestore item prices instead of trusting client prices, decrements stock, and writes order documents.

Reads: `items`.

Writes: `orders`, `parent_orders`, and item stock/status fields.

### `priceSentinel`

Type: HTTPS callable function.

Purpose: Legacy price ceiling validator. It compares listed prices to category caps and flags suspicious listings.

Reads: request data and possibly `items`.

Writes: item price flag fields and `governance_logs`.

### `adjudicateAppeal`

Type: HTTPS callable function.

Purpose: Handles appeal decisions by updating appeal and item state and recording governance history.

Reads: `appeals`, `items`.

Writes: `appeals`, `items`, and `governance_logs`.

### `completeHandshake`

Type: HTTPS callable function.

Purpose: Completes a buyer/seller handoff or delivery handshake by comparing coordinates and updating order completion state.

Reads: `orders`.

Writes: `orders` and `governance_logs`.

### `onOrderStatusChanged`

Type: Firestore trigger on `orders/{orderId}` update.

Purpose: Sends push-style notifications when delivery order status changes to runner movement states.

Reads: changed `orders/{orderId}` and buyer `users/{uid}` for `fcmToken`.

Writes: Firebase Cloud Messaging notification, not a Firestore document by default.

### `onOrderCreated`

Type: Firestore trigger on `orders/{orderId}` create.

Purpose: Notifies sellers of new orders and creates a buyer/seller post-purchase conversation.

Reads: new order document.

Writes: `notifications`, `chats`, `chats/{chatId}/messages`, and `orders/{orderId}.conversationId`.

### `onReviewCreated`

Type: Firestore trigger on `Reviews/{reviewId}` create.

Purpose: Recalculates seller trust rating and total reviews after a review is created.

Reads: `Reviews` for the seller.

Writes: `users/{sellerId}` trust fields.

### `pcsValidate`

Type: HTTPS callable function.

Purpose: Price Certification System validation. It classifies custom versus standard items using keywords, optionally considers custom claims, asks Claude for a Shopee/Lazada Malaysia market baseline, applies the 90 percent campus cap or RM500 no-reference rules, updates the item PCS fields, and creates admin review records for flagged or blocked items.

Reads: request data and item context.

Writes: `items/{itemId}` and `PriceGuidelines/{itemId}` when the item is flagged or blocked.

Uses external API: Anthropic Claude through Firebase secret `ANTHROPIC_API_KEY`.

### `sendWelcomeEmail`

Type: Firebase Auth `onCreate` trigger.

Purpose: Sends a welcome email after a new user account is created.

Reads: `users/{uid}` when available.

Writes: email through Resend, not Firestore by default.

Uses external API: Resend through Firebase secret `RESEND_API_KEY`.

## 6. External APIs

### Firebase client SDK

Used by `lib/firebase.ts` and most client pages/components.

Purpose: Authentication, Firestore, Storage, and callable Functions.

Environment variables:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Firebase Admin SDK

Used by `lib/firebase-admin.ts`, `app/actions/*`, `functions/src/index.ts`, and `scripts/*`.

Purpose: Privileged Firestore/Auth operations from server actions, scripts, and Cloud Functions.

Environment variables:

- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### Firebase Cloud Functions

Used by client listing, merchant, order, and PCS flows.

Purpose: Callable backend actions and Firestore/Auth triggers.

Environment variables:

- Client uses Firebase public app variables.
- Cloud Functions use Firebase secrets for private API keys.

### Anthropic Claude

Used by `functions/src/index.ts` in `pcsValidate`.

Purpose: Market baseline estimation for PCS validation.

Secret:

- `ANTHROPIC_API_KEY`

### Resend

Used by `functions/src/index.ts` in `sendWelcomeEmail`.

Purpose: Welcome email delivery.

Secret:

- `RESEND_API_KEY`

### SerpAPI

Used by `lib/marketplace/price-engine.ts`.

Purpose: Product price search and market reference lookup.

Environment variable:

- `SERP_API_KEY`

### OpenAI Chat Completions

Used by `lib/marketplace/price-engine-ai.ts`.

Purpose: AI-assisted price intelligence helper.

Environment variable:

- `OPENAI_API_KEY`

### Google Maps

Used by `app/run/active/page.tsx`, `app/orders/[id]/page.tsx`, and runner mission map links.

Purpose: Active delivery maps, static route images, and external map navigation.

Environment variable:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### Leaflet and OpenStreetMap-style maps

Used by map components under `components/map` and runner UI.

Purpose: Delivery map rendering in app components.

Environment variable:

- No API key is visible for Leaflet itself.

### QR and scanning libraries

Used by `app/scanner/page.tsx` and QR-related components.

Purpose: QR scanning, QR display, and campus/order identity flows.

Environment variable:

- None visible.

## 7. Firebase Storage

### `items/{userId}/{fileName}`

Stores marketplace item images.

Uploaded by `lib/marketplace-utils.ts`, `components/CreateListing.tsx`, `components/merchant/DesktopMerchant.tsx`, and `app/post/page.tsx`.

### `items/{merchant.uid}/{timestamp}_{file.name}`

Stores merchant product images.

Uploaded by `components/merchant/DesktopMerchant.tsx`.

### `items/{sellerId}/{timestamp}_{file.name}`

Stores listing images from the shared create listing component.

Uploaded by `components/CreateListing.tsx`.

### `listings/{uid}_{timestamp}_{index}.jpg`

Stores base64-converted listing images from the current marketplace create page.

Uploaded by `app/marketplace/create/page.tsx`.

### `banners/{timestamp}_{imageFile.name}`

Stores announcement or home banner images.

Uploaded by `app/admin/announcements/page.tsx`.

### `disputes/{orderId}/{fileName}`

Stores buyer dispute evidence.

Uploaded by `app/orders/[id]/page.tsx` and `lib/marketplace-utils.ts`.

### `disputes/{disputeId}/merchant_{fileName}`

Stores merchant dispute evidence.

Uploaded by `lib/marketplace-utils.ts`.

### `{activeService.id}/{timestamp}_{imgName}`

Stores service request attachment files.

Uploaded by `app/run/page.tsx`.

### `orders/{orderId}/pickup_{timestamp}.jpg`

Stores pickup proof images.

Uploaded by `app/run/missions/page.tsx`.

### `delivery_proofs/{timestamp}_{orderId}.jpg`

Stores delivery proof images.

Uploaded by `app/run/missions/page.tsx`.

### `delivery_proofs/{fileName}`

Stores active delivery proof images.

Uploaded by `app/run/active/page.tsx`.

## 8. Page Routes

### Public and authentication routes

- `/`: Landing or root route.
- `/auth`: Email/password login with role-aware redirect. Public.
- `/auth/signup`: Student sign-up and onboarding. Public.

### Main student routes

- `/home`: Student home dashboard. Authenticated.
- `/pulse`: Campus announcements, radar, and weekly events. Authenticated.
- `/marketplace`: Marketplace browse page. Authenticated.
- `/marketplace/create`: Create student marketplace listing. Authenticated student.
- `/marketplace/[id]`: Product detail page. Authenticated.
- `/cart`: Cart page. Authenticated.
- `/cart/checkout`: Checkout flow. Authenticated buyer.
- `/orders/[id]`: Order detail and dispute/review actions. Authenticated order participant or admin.
- `/orders/history`: Order history. Authenticated.
- `/messages`: Message inbox. Authenticated.
- `/review/[orderId]`: Submit review for an order. Authenticated buyer.
- `/scanner`: QR scanner. Authenticated.
- `/activity`: Activity feed or account activity. Authenticated.
- `/community`: Community page. Authenticated.
- `/hub`: Campus hub page. Authenticated.
- `/services`: Services page. Authenticated.
- `/facilities`: Facilities page. Authenticated.
- `/post`: Older or alternate listing/post creation page. Authenticated.

### Profile and account routes

- `/profile`: User profile. Authenticated.
- `/profile/edit`: Edit profile. Authenticated.
- `/profile/[id]`: Public or authenticated profile detail.
- `/profile/[id]/report`: Report a user profile. Authenticated.
- `/me`: Own profile area. Authenticated.
- `/me/edit`: Edit own profile. Authenticated.
- `/me/insights`: Personal insights. Authenticated.
- `/me/orders`: Personal order list. Authenticated.
- `/me/reputation`: Reputation view. Authenticated.
- `/me/settings`: Account settings. Authenticated.
- `/me/transactions`: Transaction history. Authenticated.
- `/me/wallet`: Wallet. Authenticated.
- `/leaderboard`: Leaderboard. Authenticated.

### Merchant and club routes

- `/merchant`: Main merchant dashboard. Club or verified merchant.
- `/merchant/orders`: Merchant order list. Club or verified merchant.
- `/merchant/promote`: Merchant promotion page. Club or verified merchant.
- `/merchant/settings`: Merchant settings. Club or verified merchant.
- `/merchant/store`: Merchant storefront management. Club or verified merchant.
- `/merchant/wallet`: Merchant wallet. Club or verified merchant.

### Runner routes

- `/run`: Runner dashboard and service request entry. Authenticated, with runner tools for verified runners.
- `/run/active`: Active runner mission. Runner.
- `/run/history`: Runner history. Runner.
- `/run/missions`: Runner mission board. Runner.
- `/runner`: Older runner page or runner entry. Authenticated runner.
- `/runner/onboarding`: Runner application/onboarding. Authenticated.
- `/runner/pending`: Pending runner approval page. Authenticated applicant.
- `/missions`: Legacy mission page. Authenticated or runner-focused.

### Admin routes

- `/admin/overview`: Admin analytics dashboard. Admin.
- `/admin/announcements`: Manage banners and announcements. Admin.
- `/admin/appeals`: Review listing/user appeals. Admin.
- `/admin/disputes`: Resolve disputes. Admin.
- `/admin/evidence`: Inspect evidence. Admin.
- `/admin/escrow`: Escrow and release controls. Admin.
- `/admin/logs`: Governance log viewer. Admin.
- `/admin/prestige`: Prestige or gamified admin module. Admin.
- `/admin/price-review`: PCS and price review dashboard. Admin.
- `/admin/runner`: Runner approval and management. Admin.
- `/admin/sellers`: Seller management. Admin.
- `/admin/users`: User management. Admin.
- `/admin/vault`: Governance vault. Admin.

### Developer and simulation routes

- `/dev`: Developer support page.
- `/sim/inventory`: Inventory simulation page.

## 9. Key Components

### Layout and navigation

- `components/NavigationGate.tsx`: Auth and role gate, path redirects, vetted account seeding, navigation visibility.
- `components/Header.tsx`: Top app navigation/header.
- `components/BottomNav.tsx`: Mobile bottom navigation.
- `components/Providers.tsx`: Client-side provider wrapper.
- `components/ClientOnly.tsx`: Prevents client-only UI from rendering during server render.
- `components/CartIcon.tsx`: Cart entry point and item count UI.

### Home

- `components/home/FeaturedBanner.tsx`: Banner carousel or featured hero content.
- `components/home/ServiceGrid.tsx`: Home service shortcut grid.
- `components/ActiveOrderBanner.tsx`: Active order summary banner.

### Marketplace

- `components/shared/ProductCard.tsx`: Product card used in marketplace grids, including PCS badge display.
- `components/MarketplaceFilterOverlay.tsx`: Marketplace filter controls.
- `components/CreateListing.tsx`: Reusable listing creation UI and PCS error handling.
- `components/RatingDisplay.tsx`: Rating summary display.

### Merchant

- `components/merchant/DesktopMerchant.tsx`: Main merchant dashboard for products, orders, settings, and logs.
- `components/merchant/ProofInspector.tsx`: Proof/evidence display for merchant orders.

### Runner and maps

- `components/runner/FloatingActiveTask.tsx`: Floating active runner/order task indicator.
- `components/runner/LiveMap.tsx`: Runner map UI.
- `components/runner/RunnerApplicationCard.tsx`: Runner application UI.
- `components/runner/RunnerBottomNav.tsx`: Runner-focused bottom navigation.
- `components/runner/RunnerLeaderboard.tsx`: Runner leaderboard.
- `components/runner/RunnerProfileCard.tsx`: Runner profile summary.
- `components/runner/RunnerStatusCard.tsx`: Runner status display.
- `components/runner/RunnerWalletCard.tsx`: Runner wallet/earnings display.
- `components/map/LeafletDeliveryMap.tsx`: Leaflet-based delivery map.

### Admin

- `components/admin/AdminBottomNav.tsx`: Admin navigation.
- `components/admin/AdminStatCard.tsx`: Admin metric card.
- `components/admin/AppealDrawer.tsx`: Appeal detail drawer.
- `components/admin/DisputeModal.tsx`: Dispute resolution modal.
- `components/admin/EvidenceCard.tsx`: Evidence display card.
- `components/admin/EvidenceModal.tsx`: Evidence detail modal.
- `components/admin/EvidenceTimeline.tsx`: Evidence timeline view.
- `components/admin/HealthBadge.tsx`: System health indicator.
- `components/admin/HeroLeaderboard.tsx`: Prestige leaderboard display.
- `components/admin/HoldFundModal.tsx`: Escrow hold modal.
- `components/admin/LogDetailDrawer.tsx`: Governance log detail drawer.
- `components/admin/OrderTimeline.tsx`: Order status timeline.
- `components/admin/PrestigeCard.tsx`: Prestige module card.
- `components/admin/ResolveModal.tsx`: Generic resolution modal.
- `components/admin/SellerCard.tsx`: Seller profile/status card.
- `components/admin/SellerDrawer.tsx`: Seller detail drawer.
- `components/admin/UserDrawer.tsx`: User detail drawer.
- `components/admin/VaultDetailDrawer.tsx`: Vault record drawer.

### UI primitives

- `components/ui/BottomSheet.tsx`: Bottom sheet primitive.
- `components/ui/RoleBadge.tsx`: Role label/badge.
- `components/ui/Skeleton.tsx`: Loading skeleton.
- `components/ui/Toast.tsx`: Toast notification UI.
- `components/ui/alert-dialog.tsx`: Alert dialog primitive.
- `components/ui/button.tsx`: Button primitive.
- `components/ui/card.tsx`: Card primitive.
- `components/ui/dialog.tsx`: Dialog primitive.
- `components/ui/input.tsx`: Input primitive.
- `components/ui/select.tsx`: Select primitive.
- `components/ui/sheet.tsx`: Sheet primitive.
- `components/ui/textarea.tsx`: Textarea primitive.

### Other domain components

- `components/HologramID.tsx`: Identity-style QR or hologram component.
- `components/EventTicket.tsx`: Event ticket display.
- `components/ProofCard.tsx`: Proof image or evidence card.
- `components/Timeline.tsx`: Generic timeline UI.
- `components/VaultCard.tsx`: Governance vault card.

## 10. Environment Variables

The local `.env.local` defines these variables. Secret values are intentionally not included here.

- `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase web app API key used by the client SDK.
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase Auth domain.
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase project ID, also reused by Admin SDK setup.
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase Storage bucket name.
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID.
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase web app ID.
- `FIREBASE_CLIENT_EMAIL`: Service account client email for Firebase Admin SDK.
- `FIREBASE_PRIVATE_KEY`: Service account private key for Firebase Admin SDK.
- `SERP_API_KEY`: SerpAPI key for price search.

Other variables referenced by the codebase but not necessarily present in `.env.local` are:

- `NEXT_PUBLIC_USE_EMULATORS`: Enables local Firebase emulator connections when set to `true`.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps key for map and static map features.
- `OPENAI_API_KEY`: OpenAI key for AI price intelligence helper.
- `ANTHROPIC_API_KEY`: Firebase Functions secret for PCS Claude validation.
- `RESEND_API_KEY`: Firebase Functions secret for welcome email delivery.

## 11. Known Limitations and Gaps

### Item status casing mismatch

Several marketplace and home queries still filter `items` by lowercase `status == "active"`, while cleanup scripts normalized many documents to uppercase `ACTIVE`. This can cause valid active listings to disappear from the marketplace or home page unless queries support both values or the app standardizes on one casing everywhere.

### PCS schema migration is incomplete

The newer PCS fields are `pcs_status`, `pcs_certified`, `pcs_market_price`, `pcs_max_allowed`, and related fields. Some admin dashboard and price review code still references older fields such as `pcs_result`, `is_price_flagged`, or old review structures. This can make analytics or admin review screens incomplete or inconsistent.

### Review field naming is inconsistent

Some review code writes fields like `seller_id` and `item_id`, while other readers and the `onReviewCreated` function expect `sellerId` and `itemId`. This can break seller trust recalculation or cause reviews not to appear in some views.

### Merchant item ownership fields are inconsistent

Some merchant flows query or expect `merchant_id`, while current item creation commonly writes `seller_id`. Merchant promotion or management pages may not find all merchant listings unless both fields are handled.

### Admin analytics still uses legacy role and seller fields

Some admin metrics refer to fields such as `is_seller`, while the normalized role model uses `role: "CLUB"`. This can make seller or merchant counts inaccurate after role cleanup.

### Microsoft SSO is not complete

The login page shows a Microsoft SSO path, but it appears to be a placeholder or coming-soon interaction rather than a working provider flow.

### PCS Claude prompt expects market search behavior

The `pcsValidate` function asks Claude to search Shopee and Lazada, but the function does not visibly attach a dedicated web search tool in the code. Depending on the configured Anthropic capability, this may behave as model reasoning rather than verified live search.

### Some live collections were cleaned while UI still expects them

Cleanup scripts removed seed or legacy collections such as `campaigns` and `campus_radar`. Pulse has fallback demo data for some empty states, but marketplace campaign UI may be empty until real data is recreated.

### Legacy and duplicate flows remain

There are newer routes under `/run` and older routes under `/runner` and `/missions`. There are also multiple listing creation paths, including `/marketplace/create`, `components/CreateListing.tsx`, and `/post`. These may represent transitional code and should be consolidated before production.

### API route mismatch for PCS validation

At least one admin flow references an `/api/pcs-validate` style endpoint, while the main PCS implementation is the callable Cloud Function `pcsValidate`. If the API route is absent, that admin path will fail.

### Environment variable coverage is uneven

`.env.local` includes Firebase Admin and SerpAPI variables, but map and OpenAI helper variables are referenced separately. Cloud Function secrets must be configured in Firebase rather than `.env.local`.

### No clear automated test suite was found

The app has build and development scripts, but no comprehensive test workflow was evident from the main project scripts. Critical flows such as checkout, PCS validation, role redirects, and order status transitions would benefit from automated coverage.

### File-level documentation comments may need cleanup

Some source files contain file documentation comments placed after implementation code. They are harmless for runtime but should be moved to the top of files or into external docs for readability.
