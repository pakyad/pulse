# Pulse Application Technical Summary

## 1. Project Overview

### App Name and Purpose

Pulse is a UniKL MIIT campus marketplace, delivery, and governance platform. It is designed to let students buy and sell campus items, let clubs and campus merchants operate storefronts, let runners handle campus deliveries, and let administrators govern pricing, disputes, escrow, evidence, announcements, and platform health.

The product is not only a marketplace. It combines student listings, UniStore-style official listings, club storefronts, runner logistics, in-app messaging, reviews, price governance, admin moderation, wallet-style balances, announcements, and campus utility modules.

### Target Users and Roles

- STUDENT: regular campus user who browses, buys, sells, chats, reviews, reports, and manages personal orders.
- RUNNER: a student with additional access to runner pages and delivery missions.
- CLUB: a student-style account with additional merchant/storefront access.
- ADMIN: platform operator restricted to admin pages and governance workflows.

### Complete Tech Stack

- Next.js App Router.
- React client components.
- TypeScript.
- Tailwind CSS.
- Firebase Authentication.
- Cloud Firestore.
- Firebase Storage.
- Firebase Cloud Functions.
- Firebase Admin SDK.
- Firebase callable functions.
- Firebase Cloud Messaging usage in Cloud Functions.
- Firebase local emulator support behind an environment flag.
- Anthropic Claude through the Anthropic SDK.
- Resend email API.
- SerpAPI Google Shopping price lookup helpers.
- OpenAI Chat Completions helper in the legacy price engine.
- Google Maps API and Google Maps URLs.
- React Google Maps.
- Leaflet and React Leaflet.
- Recharts for dashboards.
- Framer Motion for animations.
- Lucide React and React Icons for icons.
- HTML5 QR code scanner.
- QR code React rendering.
- Zod, clsx, tailwind-merge, uuid, dotenv, and supporting libraries.

### Deployment Platform and URLs

- GitHub repository: https://github.com/pakyad/pulse.git
- Firebase project: codep-pulse.
- Firebase project console: https://console.firebase.google.com/project/codep-pulse/overview
- Cloud Functions region used by PCS and most functions: us-central1.
- Local development URL from the repository script: http://localhost:3000
- Firebase Hosting is not configured in firebase.json, so the repository does not define a production frontend hosting URL.
- Cloud Functions deploy is configured through firebase.json with the source directory functions and a predeploy TypeScript build.

### Repository Structure

- app: Next.js routes, route handlers, layouts, and server actions.
- app/actions: server actions for admin, orders, delivery, products, and reviews.
- app/api: API routes for price checking, price intelligence, and a placeholder welcome endpoint.
- components: shared UI and domain components for marketplace, merchant, runner, admin, pulse, and hub modules.
- lib: Firebase client setup, Firebase Admin setup, marketplace price engines, categories, governance utilities, auth helpers, locations, cart context, and seed helpers.
- functions: Firebase Cloud Functions source and compiled output.
- scripts: operational Firestore scripts for audit, cleanup, seeding, image fixes, user/listing organization, and maintenance.
- public: static web assets.
- firestore.rules and storage.rules: Firebase security rules.
- firebase.json: Firebase functions, Firestore rules, and Storage rules configuration.
- package.json: Next app scripts and dependencies.
- functions/package.json: Cloud Functions scripts and dependencies.

## 2. User Roles and Access

### STUDENT

Students can access normal student pages, the home dashboard, Pulse tab, marketplace, listing creation, cart, checkout, orders, profile, messages, reviews, hub pages, scanner, activity, and community-style pages. Students cannot access admin pages, merchant pages, or runner-specific pages.

### RUNNER

Runners inherit student access. The current NavigationGate treats a runner as a student with extra permission for /run and /runner pages. RUNNER is not blocked from normal student pages. Runner-only access includes delivery mission boards, active delivery pages, runner wallet pages, runner history, onboarding/register pages, and runner task controls.

### CLUB

Clubs inherit student access and add merchant access. CLUB users can use normal student pages and can also access /merchant pages for storefront, orders, merchant logs, merchant notifications, promotion, analytics, and disputes. CLUB users are blocked from /admin and /run pages unless their role is also changed to RUNNER.

### ADMIN

Admins are restricted to admin pages. The NavigationGate redirects ADMIN away from non-admin pages to /admin/overview. This means ADMIN is blocked from marketplace create listing and normal student pages by routing, even if the UI route technically exists.

### Role Storage

Roles are stored in Firestore user documents under users/{uid}.role. The normalized role values are STUDENT, RUNNER, CLUB, and ADMIN. Some supporting and legacy fields still exist:

- display_role: friendly label such as Student, Campus Runner, Campus Club, or Platform Admin.
- is_verified_runner and runner_status: runner verification fields.
- is_verified_merchant and merchant_status: merchant verification fields.
- is_seller: legacy seller/admin metrics field.
- is_official: official account/store flag.

### Role Enforcement

Role enforcement is mainly implemented in components/NavigationGate.tsx. It listens to Firebase Auth state, loads users/{uid}, normalizes the role, and applies route redirects.

The current routing model is:

- Unauthenticated users are sent to /auth when accessing protected pages.
- ADMIN can access /admin and /auth only; other pages redirect to /admin/overview.
- Non-admin users trying /admin redirect to /home.
- Non-CLUB users trying /merchant redirect to /home.
- Non-RUNNER users trying /run or /runner redirect to /home.
- RUNNER users keep all student page access.
- CLUB users keep all student page access.
- /dev redirects admins to /admin/overview and everyone else to /home.

There are additional checks in server actions and pages. Admin actions verify admin role for escrow release and privileged moderation. Merchant pages check merchant/club identity. Runner pages check runner profile state and online status.

## 3. Complete Features List

### Authentication and Sign-Up

Files: app/auth/page.tsx, app/auth/signup/page.tsx, lib/firebase.ts, lib/auth-utils.ts, components/NavigationGate.tsx.

Collections: users.

Status: mostly working. Email/password login and UniKL-style sign-up exist. Microsoft SSO is shown as a placeholder or coming-soon flow rather than a complete provider flow.

### Role-Based Navigation

Files: components/NavigationGate.tsx, components/Header.tsx, components/BottomNav.tsx.

Collections: users.

Status: working after the latest runner access fix. ADMIN is restricted to admin pages; RUNNER inherits student access plus runner pages; CLUB inherits student access plus merchant pages.

### Home Dashboard

Files: app/home/page.tsx, components/shared/FeaturedBanner.tsx, components/shared/ServiceGrid.tsx, components/shared/ActiveOrderBanner.tsx, components/runner/FloatingActiveTask.tsx.

Collections: users, items, banners, orders.

Status: working, but it depends on active items having either ACTIVE or active status. It now queries both status values.

### Pulse Tab

Files: app/pulse/page.tsx, components/pulse/CreatePulsePost.tsx, components/pulse/EKGModule.tsx, components/pulse/FacilityModule.tsx, components/pulse/RadarModule.tsx.

Collections: users, campus_radar, events, announcements, chats.

Status: partially working. Pulse can display announcements, radar, and events, but some data relies on demo/fallback content or collections that may be sparse.

### Marketplace Browse

Files: app/marketplace/page.tsx, components/shared/ProductCard.tsx, components/shared/MarketplaceFilterOverlay.tsx, components/marketplace/CategorySelector.tsx, components/marketplace/GovernanceBanner.tsx, components/marketplace/HypeGrid.tsx, lib/marketplace/categories.ts.

Collections: items, users, campaigns.

Status: working. Item status queries handle ACTIVE and active. Student Market now filters only items where pcs_status is APPROVED and pcs_certified is true. Campaigns are still queried with lowercase active.

### Product Card and Badge Display

Files: components/shared/ProductCard.tsx.

Collections: items.

Status: working. Product cards show image, title, category tag, seller, price, and sold state. The only PCS badge is a small green check icon when pcs_status is APPROVED and pcs_certified is true. FREE_MARKET, CLUB, UNISTORE, and missing PCS status show no PCS badge.

### Student Listing Creation

Files: app/marketplace/create/page.tsx, components/CreateListing.tsx, components/marketplace/SmartFormFields.tsx, lib/marketplace/categories.ts.

Collections: items, users, PriceGuidelines.

Storage: listings/{uid}_{timestamp}_{index}.jpg and items/{sellerId}/{timestamp}_{fileName}.

Status: partially working. The form supports standard versus handmade/custom listing type, categories, subcategories, images, PCS validation, and custom item RM500 UI. All standard subcategory option sets now include Other. A major limitation is that PCS free-market and copyright-blocked early writes use update against items/{itemId}; in the current create flow the item document may not exist yet, so those early returns can fail unless the item is precreated or the function uses merge writes.

### Product Detail

Files: app/marketplace/[id]/page.tsx, components/shared/ReportPriceButton.tsx.

Collections: items, users, Reviews, chats, chats/{chatId}/messages.

Status: working but mixed review field names still affect display. The page queries sellerId and itemId style review fields, while some review writers use seller_id and item_id.

### Product Editing

Files: app/marketplace/[id]/edit/page.tsx, app/marketplace/edit/[id]/page.tsx, components/CreateListing.tsx.

Collections: items.

Status: partially working. There are duplicate edit route patterns, which suggests legacy and newer edit flows coexist.

### Cart and Checkout

Files: app/cart/page.tsx, app/cart/checkout/page.tsx, app/marketplace/[id]/checkout/page.tsx, lib/context/CartContext.tsx, app/actions/orderActions.ts.

Collections: items, orders, parent_orders, notifications.

Status: working but schema status names are mixed. Some checkout flows create PENDING_VENDOR and PENDING_RUNNER statuses while cleanup scripts normalized other flows to PENDING, PREPARING, READY, PICKED_UP, DELIVERED, and CANCELLED.

### Orders and Order Tracking

Files: app/orders/[id]/page.tsx, app/orders/success/page.tsx, app/me/orders/page.tsx, app/me/orders/history/page.tsx, app/orders/history/page.tsx if present historically, components/shared/OrderTracker.tsx, components/shared/ActiveOrderBanner.tsx.

Collections: orders, parent_orders, items, users, Reviews, disputes, chats, notifications.

Storage: disputes/{orderId}/{fileName}.

Status: partially working. Order display, tracking, cancellation, dispute, and review flows exist, but order statuses are inconsistent across modules.

### Merchant Dashboard

Files: app/merchant/page.tsx, app/merchant/analytics/page.tsx, app/merchant/disputes/page.tsx, app/merchant/logs/page.tsx, app/merchant/notifications/page.tsx, app/merchant/promote/page.tsx, components/merchant/DesktopMerchant.tsx, components/merchant/MobileMerchant.tsx, components/merchant/ProofInspector.tsx, components/merchant/ReceiptViewer.tsx, components/merchant/SwipeToReady.tsx.

Collections: users, items, orders, notifications, disputes, admin_evidence, appeals, chats.

Storage: items/{merchantUid}/{timestamp}_{fileName}.

Status: partially working. Merchant product creation and order management exist. Some merchant flows still reference older statuses and fields such as merchant_id or PAID/PENDING_VENDOR.

### Runner Delivery System

Files: app/run/page.tsx, app/run/active/page.tsx, app/run/missions/page.tsx, app/run/history/page.tsx, app/run/onboarding/page.tsx, app/run/register/page.tsx, app/run/success/page.tsx, app/run/wallet/page.tsx, app/run/wallet/history/page.tsx, app/run/wallet/transactions/page.tsx, app/runner/page.tsx, app/runner/active/page.tsx, components/runner/FloatingActiveTask.tsx, components/runner/LiveMap.tsx, components/runner/SwipeToAccept.tsx.

Collections: users, orders, admin_evidence, chats, users/{uid}/transactions, payout_requests.

Storage: delivery_proofs/{fileName}, orders/{orderId}/pickup_{timestamp}.jpg, delivery_proofs/{timestamp}_{orderId}.jpg, and service-specific attachment paths.

Status: partially working. Runner access is fixed at routing level. Mission, proof, wallet, and online state flows exist, but there are duplicate /run and /runner route families and mixed status names.

### Messaging

Files: app/messages/page.tsx, app/messages/[id]/page.tsx, app/marketplace/[id]/page.tsx, app/me/orders/page.tsx, components/ChatOverlay.tsx, components/pulse/RadarModule.tsx.

Collections: chats, chats/{chatId}/messages, users, orders.

Status: partially working. Chat creation exists for product and post-purchase contexts. Field names vary between members, participants, participantIds, createdAt, created_at, timestamp, and updatedAt.

### Reviews and Trust

Files: app/actions/reviewActions.ts, components/marketplace/PostDeliveryReview.tsx, app/user/[id]/reviews/page.tsx, app/marketplace/[id]/page.tsx, functions/src/index.ts.

Collections: Reviews, orders, users.

Status: partially working. The onReviewCreated trigger now accepts sellerId/seller_id and itemId/item_id and aggregates both seller field formats. Some UI still queries only one naming style.

### Admin Overview and Governance

Files: app/admin/overview/page.tsx, app/admin/dashboard/page.tsx, app/admin/page.tsx, app/admin/layout.tsx, components/admin/AdminSidebar.tsx, components/admin/AdminProductApprovals.tsx, components/admin/RegistryList.tsx, components/admin/PriceAudit.tsx.

Collections: users, items, orders, disputes, Reviews, PriceGuidelines, governance_logs.

Status: partially working. Dashboards exist with live Firestore reads, but some metrics still use legacy fields such as pcs_result, is_seller, and is_price_flagged.

### Admin Price Review and PCS Governance

Files: app/admin/price-review/page.tsx, app/admin/price-terminal/page.tsx, components/admin/PriceControlModal.tsx, app/actions/adminActions.ts.

Collections: items, PriceGuidelines, appeals, notifications, governance_logs, governance_vault, users.

Status: partially working. PCS v3 writes PriceGuidelines for flagged and blocked items. However, adminActions.updatePriceGuideline writes lowercase document IDs with category and max_price fields, which conflicts with the cleaned PriceGuidelines category schema that expects uppercase id and ceiling_rm.

### Admin Disputes, Evidence, Escrow, Vault, and Logs

Files: app/admin/disputes/page.tsx, app/admin/escrow/page.tsx, app/admin/evidence or evidence-related components, app/admin/vault/page.tsx, app/admin/logs/page.tsx, app/admin/ledger/page.tsx, app/actions/adminActions.ts, app/actions/orderActions.ts.

Collections: disputes, admin_evidence, orders, ledger, governance_vault, governance_logs, users, payout_requests.

Status: partially working. Core moderation actions exist, but status and balance handling is not fully unified across all order flows.

### Admin Users, Merchants, Runners, Announcements, and Settings

Files: app/admin/users/page.tsx, app/admin/merchants/page.tsx, app/admin/runners/page.tsx, app/admin/announcements/page.tsx, app/admin/settings/page.tsx, components/admin/AddMerchantModal.tsx, components/admin/ApprovalList.tsx.

Collections: users, announcements, banners, notifications.

Storage: banners/{timestamp}_{imageFileName}.

Status: partially working. Admin pages exist. Some role/verification fields are normalized, but older fields remain in use.

### Announcements and Banners

Files: app/admin/announcements/page.tsx, app/home/page.tsx, app/pulse/page.tsx, components/AnnouncementBanner.tsx, components/shared/AnnouncementCarousel.tsx, components/pulse/CreatePulsePost.tsx.

Collections: announcements, banners.

Storage: banners/{timestamp}_{imageFileName}.

Status: working with caveats. Home reads banners. Pulse reads published announcements. Some announcement creation is available from Pulse components and admin.

### Campus Hub Modules

Files: app/hub/admin/page.tsx, app/hub/books/page.tsx, app/hub/facility/[id]/page.tsx, app/hub/facility/pass/[id]/page.tsx, app/hub/found/page.tsx, app/hub/med/page.tsx, app/hub/parcel/page.tsx, app/hub/services/page.tsx, app/hub/unistore/page.tsx, components/hub/FacilityCanvas.tsx.

Collections: facilities, bookings, campus_radar, items.

Status: mixed. UniStore and facility/pass flows exist. Some hub modules are more demo-like or partially populated.

### QR and Scanner

Files: app/scanner/page.tsx, components/shared/HologramID.tsx.

Collections: users, bookings, orders depending on scanned context.

Status: partially working. QR display and scanner UI exist, but integration depth varies by route.

### Developer and Simulation Tools

Files: app/dev/page.tsx, app/sim/inventory/page.tsx, scripts.

Collections: many, including users, items, campaigns, orders.

Status: development-only or legacy. /dev is now routed away from normal users and admins are redirected to /admin/overview by NavigationGate.

## 4. Price Control System Detailed

### Full Mechanism

PCS is centered on the callable Cloud Function pcsValidate in functions/src/index.ts. Listing creation pages call pcsValidate before writing the final item document. The function receives itemTitle, itemPrice, category, sellerId, and itemId. It decides whether the item is approved, free-market, blocked for copyright risk, blocked for no market reference, or flagged for admin review.

The current PCS writes decision fields to items/{itemId}:

- pcs_status.
- pcs_certified.
- pcs_market_price.
- pcs_floor_price.
- pcs_max_allowed.
- pcs_reason.
- pcs_checked_at.

When the result is FLAGGED or BLOCKED_NO_REFERENCE, it also writes PriceGuidelines/{itemId} as an admin review record.

### Validation Layers

PCS v3 validates in this order:

1. Required itemId check.
2. Copyright signal filter.
3. Free Market category bypass.
4. Category-aware Claude prompt.
5. Claude JSON extraction.
6. Floor and ceiling price parsing.
7. RM500 no-reference rule.
8. 90 percent campus cap rule.
9. Firestore item update.
10. PriceGuidelines review write for flagged or blocked cases.
11. Structured return to the client.

### Copyright Filter Logic

The function looks for title signals such as pdf, softcopy, ebook, e-book, digital copy, scanned, send via whatsapp, send via telegram, send via email, and digital file.

It also checks for original-content signals such as my notes, my summary, my handwritten, my typed, original notes, and my study notes.

If the title has a copyright signal and no original-content signal, the listing is blocked with pcs_status COPYRIGHT_BLOCKED. The reason tells the seller that selling digital copies of published content may violate copyright law and suggests selling a physical copy instead.

Known issue: this early branch currently uses Firestore update on items/{itemId}. In the create listing flow the item document may not exist yet, so this can fail at runtime unless the item exists before validation.

### Price Band System

PCS v3 asks Claude to find two prices:

- floorPrice: cheapest legitimate physical copy from a real authorized seller in Malaysia.
- ceilingPrice: official new retail price from an authorized Malaysian retailer or brand store.

The system ignores pirated copies, PDFs, damaged goods, suspiciously cheap outliers below RM5, international prices unless unavoidable, bundles, and individual reseller ceiling prices.

The campus cap is calculated as 90 percent of ceilingPrice. If the listed price is less than or equal to the campus cap, the item is APPROVED. If it exceeds the cap, it is FLAGGED.

### Category-Aware Pricing Strategy

For ACADEMIC or BOOK categories, the prompt asks Claude to search Malaysian bookstores such as MPH, Popular, Kinokuniya, or publisher official websites.

For other validated categories, the prompt asks for official brand stores on Shopee Mall, Lazada Mall, or official Malaysian brand websites.

Free Market categories bypass Claude entirely.

### Free Market Rules and RM500 Threshold

The current free-market categories are SERVICES, FOOD, HANDMADE, CUSTOM, and APPAREL. If the category includes one of those strings, the item becomes FREE_MARKET with pcs_certified true and no price validation required.

If Claude cannot find a ceiling price:

- If listedPrice is greater than RM500, PCS returns BLOCKED_NO_REFERENCE.
- If listedPrice is RM500 or below, PCS returns FREE_MARKET.

Known issue: the free-market category bypass also uses update on items/{itemId}, which can fail before item creation in the current listing flow.

### Justification and Appeal Flow

PCS returns a justification string to the listing form. For approved items, the justification explains the campus cap and official retail price. For flagged items, it explains the cap, official price, and source. For no-reference blocking, it tells the seller to use a specific brand and model. For copyright blocking, it explains why digital copies are disallowed.

The appeal system is implemented through appeals and admin review pages. Merchant PriceAppealModal writes appeals. Admin appeal actions can approve or reject appeals and update item status. The appeal system exists, but the PCS v3 frontend does not fully surface a rich justification upload flow at listing time.

### Badge System

ProductCard now shows only one PCS badge state:

- Green verified check icon when pcs_status is APPROVED and pcs_certified is true.
- No badge for FREE_MARKET, UNISTORE, CLUB, missing PCS status, or any other state.

Student Market filtering now only includes items with pcs_status APPROVED and pcs_certified true.

### Known PCS Limitations

- Early copyright and free-market writes can fail if the item document has not been created yet.
- Admin PCS dashboards still contain references to older pcs_result and is_price_flagged fields.
- PriceGuidelines is used both for category policy records and item review records, which mixes schemas.
- adminActions.updatePriceGuideline writes lowercase docs and max_price, conflicting with cleaned uppercase category docs using id and ceiling_rm.
- The legacy API price engines still exist alongside PCS v3 and may not match the new Claude price band system.
- Claude web search runtime depends on Anthropic API support and secret configuration.
- The system trusts the parsed Claude JSON after a loose regex extraction.
- There is no robust seller appeal evidence workflow tied directly to PCS v3 output yet.

## 5. Firestore Collections

The current live Firestore counts were collected from scripts/listAllFirestore.ts.

### Live Top-Level Collections

- admin_evidence: 30 documents. Stores delivery proof, pickup proof, dispute proof, and admin-facing evidence records. Read by merchant proof and admin evidence flows. Written by runner mission proof uploads.
- announcements: 10 documents. Stores campus notices and published announcement content. Read by Pulse and announcement components. Written by admin announcements and pulse post components.
- appeals: 8 documents. Stores seller or listing appeals. Read by admin appeal pages and Cloud Functions. Written by merchant appeal modal and admin adjudication.
- banners: 6 documents. Stores home banner carousel records and image URLs. Read by home page. Written by admin announcements page.
- chats: 74 documents. Stores conversation metadata. Read by messages, item detail, order, and radar flows. Written by item contact, order creation, and radar chat flows.
- delivery_jobs: 27 documents. Stores legacy or auxiliary delivery job records. It is present in Firestore but current runner flows primarily use orders.
- disputes: 7 documents. Stores order disputes and evidence metadata. Read by admin and merchant dispute pages. Written by order dispute flows and marketplace utilities.
- governance_logs: 10 documents. Stores admin and system audit logs. Read by admin logs and overview pages. Written by admin actions and Cloud Functions.
- governance_vault: 2 documents. Stores vaulted listing or governance snapshots. Read by admin vault. Written by admin reject/suspend/restore flows.
- items: 63 documents. Stores marketplace, club, UniStore, student, PCS, and Free Market listings. Read and written across home, marketplace, merchant, admin, order, and script files.
- ledger: 1 document. Stores financial ledger entries. Written by escrow release. Read by admin ledger/escrow views.
- notifications: 65 documents. Stores global user notifications. Read by header, merchant, and notification pages. Written by order actions, Cloud Functions, and admin actions.
- orders: 69 documents. Stores orders, service requests, runner missions, and marketplace checkout records. Read and written by checkout, order, runner, merchant, admin, and Cloud Function flows.
- parent_orders: 7 documents. Stores grouped checkout parent orders. Written by checkout actions and placeOrder. Read by order history.
- payout_requests: 7 documents. Stores payout requests for wallet/runner payment flows. Read by admin and runner wallet pages. Written by runner wallet pages.
- price_reports: 4 documents. Stores user price reports. Read by price governance/admin features. Written by report price flows.
- PriceGuidelines: 7 documents. Stores category price policy records and also flagged PCS item review records. Read by admin price review and product actions. Written by pcsValidate and adminActions.updatePriceGuideline.
- Reviews: 16 documents. Stores seller, item, order, and runner reviews. Read by product, user, and review pages. Written by review components and review actions. Processed by onReviewCreated.
- transactions: 32 documents. Stores platform transaction records. Read by navigation and wallet/account pages.
- users: 56 documents. Stores account, role, trust, runner, merchant, wallet, and profile data. Read and written throughout the app.

### User Subcollections

- users/3dmml8IdCzS3dd2iLctw16o4zk23/transactions: 9 documents.
- users/RSqQBzJi1TNNogZ4YHqhxUrDpOF3/transactions: 10 documents.
- users/UMgBPjJQNaTLGZC6oDtLTz5gbkG3/notifications: 1 document.
- users/UMgBPjJQNaTLGZC6oDtLTz5gbkG3/warnings: 2 documents.

### Collections Referenced in Code But Not Present in Current Live Top-Level Inventory

- activityLogs: user activity or profile activity records.
- bookings: facility booking records.
- campaigns: marketplace campaign records. Code reads campaigns, but the live inventory did not show a top-level campaigns collection after cleanup.
- campus_radar: Pulse radar/found module records. Code reads and writes it, but the live inventory did not show it as a current top-level collection.
- events: weekly happening records for Pulse. Code reads it, but it was not returned in the current inventory.
- facilities: campus facility records.
- market_reference_prices: legacy price reference records.
- merchants: legacy merchant profile records.
- price_cache: legacy cached price lookup records.
- price_reviews: legacy price review records.
- reports: profile/report moderation records.
- sellerTrustScores: legacy seller trust score records.
- vitals: campus vitals records.

## 6. Cloud Functions

All exported functions are in functions/src/index.ts.

### placeOrder

Trigger: HTTPS callable.

Purpose: Creates parent and sub-orders for checkout, validates stock, uses item prices from Firestore, groups by vendor, decrements stock, and writes orders.

Reads: items.

Writes: orders, parent_orders, items.

External APIs: Firebase Admin SDK only.

### priceSentinel

Trigger: HTTPS callable.

Purpose: Legacy price ceiling validator. Flags items whose price exceeds fixed category ceilings.

Reads: request data.

Writes: items and governance_logs.

External APIs: Firebase Admin SDK only.

### adjudicateAppeal

Trigger: HTTPS callable.

Purpose: Resolves an appeal by approving or rejecting an item and writing governance history.

Reads: appeals and items.

Writes: appeals, items, governance_logs.

External APIs: Firebase Admin SDK only.

### completeHandshake

Trigger: HTTPS callable.

Purpose: Completes delivery or handoff verification using coordinate proximity and updates order completion.

Reads: orders.

Writes: orders and governance_logs.

External APIs: Firebase Admin SDK only.

### onOrderStatusChanged

Trigger: Firestore update on orders/{orderId}.

Purpose: Sends FCM notifications when order status changes to movement/delivery states.

Reads: orders and users/{buyerId}.fcmToken.

Writes: Firebase Cloud Messaging notification.

External APIs: Firebase Cloud Messaging.

### onOrderCreated

Trigger: Firestore create on orders/{orderId}.

Purpose: Notifies the seller when an order is created and creates a post-purchase chat thread.

Reads: orders and users.

Writes: notifications, chats, chats/{chatId}/messages, and order conversationId.

External APIs: Firebase Admin SDK only.

### onReviewCreated

Trigger: Firestore create on Reviews/{reviewId}.

Purpose: Recalculates seller trustRating and totalReviews when a review is created.

Reads: Reviews.

Writes: users/{sellerId}.

External APIs: Firebase Admin SDK only.

Current improvement: handles both sellerId/seller_id and itemId/item_id field naming styles.

### pcsValidate

Trigger: HTTPS callable.

Purpose: PCS v3 price validation with copyright blocking, free-market category bypass, Claude price-band lookup, RM500 no-reference handling, item PCS writes, and admin review records.

Reads: request data and external Claude response.

Writes: items and PriceGuidelines.

External APIs: Anthropic Claude model claude-haiku-4-5-20251001 with web_search_20250305 tool.

### sendWelcomeEmail

Trigger: Firebase Auth user create.

Purpose: Sends welcome email when a new user signs up.

Reads: users/{uid}.

Writes: external email through Resend.

External APIs: Resend email API.

## 7. External APIs

### Claude AI

Used in functions/src/index.ts by pcsValidate.

Purpose: price-band validation for Malaysian marketplace listings.

Model: claude-haiku-4-5-20251001.

Tool: web_search_20250305.

Secret: ANTHROPIC_API_KEY through Firebase Functions defineSecret.

Status: deployed successfully for pcsValidate. Runtime quality depends on Anthropic tool access, search result quality, and JSON extraction reliability.

### Firebase Authentication

Used in lib/firebase.ts, auth pages, NavigationGate, and many route components.

Purpose: user login, sign-up, session persistence, route gating, and auth-triggered welcome emails.

Environment variables: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_APP_ID, and related Firebase web config values.

### Cloud Firestore

Used throughout app, components, functions, scripts, and server actions.

Purpose: primary database for users, items, orders, chats, reviews, governance, notifications, wallet data, announcements, and admin records.

### Firebase Storage

Used by listing, banner, dispute, and delivery proof flows.

Purpose: image and evidence uploads.

Environment variable: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.

### Firebase Cloud Functions

Used by create listing and merchant listing flows through httpsCallable.

Purpose: PCS validation and other callable backend operations.

### Firebase Admin SDK

Used in functions, server actions, and scripts.

Purpose: privileged Firestore/Auth operations.

Environment variables: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.

### Resend

Used in functions/src/index.ts by sendWelcomeEmail.

Purpose: onboarding email delivery.

Secret: RESEND_API_KEY through Firebase Functions defineSecret.

### Google Maps

Used in app/run/active/page.tsx, app/run/missions/page.tsx, app/orders/[id]/page.tsx, and map-related components.

Purpose: active delivery maps, map links, static map images, and navigation directions.

Environment variable: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.

### SerpAPI

Used in lib/marketplace/price-engine.ts.

Purpose: legacy Google Shopping price lookup and market price references.

Environment variable: SERP_API_KEY.

Status: legacy helper still present; PCS v3 currently uses Claude instead.

### OpenAI

Used in lib/marketplace/price-engine-ai.ts.

Purpose: legacy AI-assisted price estimation.

Environment variable: OPENAI_API_KEY.

Status: helper exists but is not the current PCS v3 path.

### Leaflet and React Google Maps

Used in map UI components and runner pages.

Purpose: visual delivery and location maps.

### QR Libraries

Used in app/scanner/page.tsx and HologramID.

Purpose: QR scanning and QR identity display.

## 8. Firebase Storage Paths

- items/{userId}/{fileName}: marketplace listing images from lib/marketplace-utils.ts.
- items/{sellerId}/{timestamp}_{fileName}: listing images from components/CreateListing.tsx.
- items/{merchantUid}/{timestamp}_{fileName}: merchant listing images from components/merchant/DesktopMerchant.tsx.
- items/{authUserUid}/{timestamp}_{imageName}: older post flow uploads from app/post/page.tsx.
- listings/{uid}_{timestamp}_{index}.jpg: current marketplace create page base64 image uploads from app/marketplace/create/page.tsx.
- banners/{timestamp}_{imageFileName}: banner images from app/admin/announcements/page.tsx.
- disputes/{orderId}/{fileName}: buyer dispute evidence from app/orders/[id]/page.tsx and lib/marketplace-utils.ts.
- disputes/{disputeId}/merchant_{fileName}: merchant dispute evidence from lib/marketplace-utils.ts.
- {activeServiceId}/{timestamp}_{imageName}: service request attachments from app/run/page.tsx.
- delivery_proofs/{fileName}: delivery proof images from app/run/active/page.tsx.
- orders/{orderId}/pickup_{timestamp}.jpg: pickup proof images from app/run/missions/page.tsx.
- delivery_proofs/{timestamp}_{orderId}.jpg: mission delivery proof images from app/run/missions/page.tsx.

## 9. Page Routes

### Public and Auth Routes

- /: root route or landing page. Public.
- /auth: login page. Public.
- /auth/signup: sign-up page. Public.

### Student Routes

- /home: student home dashboard. STUDENT, RUNNER, CLUB.
- /pulse: campus Pulse feed, announcements, radar, and weekly happenings. STUDENT, RUNNER, CLUB.
- /marketplace: marketplace browse page. STUDENT, RUNNER, CLUB.
- /marketplace/create: student listing creation. STUDENT, RUNNER, CLUB.
- /marketplace/[id]: product detail page. STUDENT, RUNNER, CLUB.
- /marketplace/[id]/checkout: direct item checkout. STUDENT, RUNNER, CLUB.
- /marketplace/[id]/edit: item edit route. Seller-oriented.
- /marketplace/edit/[id]: alternate item edit route. Seller-oriented.
- /cart: cart page. STUDENT, RUNNER, CLUB.
- /cart/checkout: cart checkout page. STUDENT, RUNNER, CLUB.
- /orders/[id]: order detail page. Order participant or admin context.
- /orders/success: order success page. STUDENT, RUNNER, CLUB.
- /messages: message inbox. STUDENT, RUNNER, CLUB.
- /messages/[id]: chat room. STUDENT, RUNNER, CLUB.
- /activity: activity page. STUDENT, RUNNER, CLUB.
- /campaigns: campaigns page. STUDENT, RUNNER, CLUB.
- /leaderboard: leaderboard page. STUDENT, RUNNER, CLUB.
- /post: older listing/post creation route. STUDENT, RUNNER, CLUB.
- /scanner: QR scanner. STUDENT, RUNNER, CLUB.
- /profile/[id]: profile detail page. STUDENT, RUNNER, CLUB.
- /user/[id]: user detail page. STUDENT, RUNNER, CLUB.
- /user/[id]/reviews: user reviews page. STUDENT, RUNNER, CLUB.

### Account Routes

- /me: own profile. STUDENT, RUNNER, CLUB.
- /me/edit: edit own profile. STUDENT, RUNNER, CLUB.
- /me/insights: personal or merchant insights. STUDENT, RUNNER, CLUB.
- /me/orders: own orders. STUDENT, RUNNER, CLUB.
- /me/orders/history: order history. STUDENT, RUNNER, CLUB.
- /me/settings: settings. STUDENT, RUNNER, CLUB.
- /campus/earnings: earnings page. Authenticated non-admin users.

### Hub Routes

- /hub/admin: hub admin-style page. Authenticated users unless further page logic restricts.
- /hub/books: book hub page. STUDENT, RUNNER, CLUB.
- /hub/facility/[id]: facility detail page. STUDENT, RUNNER, CLUB.
- /hub/facility/pass/[id]: facility pass page. STUDENT, RUNNER, CLUB.
- /hub/found: found/lost radar page. STUDENT, RUNNER, CLUB.
- /hub/med: medicine or medical hub page. STUDENT, RUNNER, CLUB.
- /hub/parcel: parcel hub page. STUDENT, RUNNER, CLUB.
- /hub/services: services hub page. STUDENT, RUNNER, CLUB.
- /hub/unistore: UniStore page. STUDENT, RUNNER, CLUB.

### Runner Routes

- /run: runner dashboard and service request entry. RUNNER only by NavigationGate.
- /run/active: active delivery mission. RUNNER only.
- /run/history: runner history. RUNNER only.
- /run/missions: mission board. RUNNER only.
- /run/onboarding: runner onboarding. RUNNER only by current gate, which may be too restrictive for applicants.
- /run/register: runner registration. RUNNER only by current gate, which may be too restrictive for applicants.
- /run/success: runner success page. RUNNER only.
- /run/wallet: runner wallet. RUNNER only.
- /run/wallet/history: runner wallet history. RUNNER only.
- /run/wallet/transactions: runner transactions. RUNNER only.
- /runner: legacy runner route. RUNNER only.
- /runner/active: legacy active runner route. RUNNER only.
- /missions: legacy mission route. Not treated as /run by NavigationGate, so it is accessible as a student route unless page logic restricts it.

### Club and Merchant Routes

- /merchant: merchant dashboard. CLUB only.
- /merchant/analytics: merchant analytics. CLUB only.
- /merchant/disputes: merchant disputes. CLUB only.
- /merchant/logs: merchant logs. CLUB only.
- /merchant/notifications: merchant notifications. CLUB only.
- /merchant/promote: promotion page. CLUB only.

### Admin Routes

- /admin: admin landing. ADMIN only.
- /admin/overview: admin analytics overview. ADMIN only.
- /admin/dashboard: admin dashboard. ADMIN only.
- /admin/announcements: announcement and banner management. ADMIN only.
- /admin/appeals: appeal review. ADMIN only.
- /admin/disputes: dispute management. ADMIN only.
- /admin/escrow: escrow controls. ADMIN only.
- /admin/genesis: genesis/admin seed-style page. ADMIN only.
- /admin/ledger: ledger page. ADMIN only.
- /admin/logs: governance logs. ADMIN only.
- /admin/merchants: merchant management. ADMIN only.
- /admin/prestige: prestige dashboard. ADMIN only.
- /admin/price-review: PCS price review. ADMIN only.
- /admin/price-terminal: price guideline terminal. ADMIN only.
- /admin/runners: runner approval/management. ADMIN only.
- /admin/settings: admin settings. ADMIN only.
- /admin/users: user management. ADMIN only.
- /admin/vault: governance vault. ADMIN only.

### Developer and Simulation Routes

- /dev: development utility route. Redirected away by NavigationGate.
- /sim/inventory: inventory simulation page. Authenticated user unless page logic restricts.

### API Routes

- /api/marketplace/price-check: server API for legacy price check and zone validation.
- /api/price-intelligence: server API for legacy market price intelligence.
- /api/send-welcome: placeholder route that returns success.

## 10. Key Components

### Navigation and Shell

- components/NavigationGate.tsx: auth listener, user role loader, route enforcement, header and bottom nav visibility.
- components/Header.tsx: top header and notification/profile access.
- components/BottomNav.tsx: mobile bottom navigation with user-role context.
- components/Navbar.tsx: alternate navigation component.
- components/Providers.tsx: app provider wrapper.

### Marketplace

- components/shared/ProductCard.tsx: product grid card with image, title, category tag, seller, price, sold state, and green PCS check icon.
- components/shared/MarketplaceFilterOverlay.tsx: marketplace filters.
- components/CreateListing.tsx: reusable listing creation/editing form.
- components/marketplace/CategorySelector.tsx: category UI.
- components/marketplace/GovernanceBanner.tsx: price/governance messaging.
- components/marketplace/HypeGrid.tsx: marketplace promotional grid.
- components/marketplace/PostDeliveryReview.tsx: review UI after delivery.
- components/marketplace/PriceHealthIndicator.tsx: price health display.
- components/marketplace/SmartFormFields.tsx: category-specific dynamic fields.
- components/MarketplaceCard.tsx: alternate marketplace card.

### Home and Shared UI

- components/shared/FeaturedBanner.tsx: home banner carousel/display.
- components/shared/ServiceGrid.tsx: home service shortcuts.
- components/shared/ActiveOrderBanner.tsx: active order summary.
- components/shared/AvatarDropdown.tsx: profile/avatar dropdown.
- components/shared/BackButton.tsx: reusable back button.
- components/shared/AnnouncementCarousel.tsx: announcement carousel.
- components/shared/SearchOverlay.tsx: search overlay.
- components/shared/ReportIssueModal.tsx: issue reporting modal.
- components/shared/ReportPriceButton.tsx: price report button.
- components/shared/HologramID.tsx: QR/identity-style visual.
- components/shared/OrderTracker.tsx: order tracking timeline.
- components/shared/BuyerLiveMap.tsx: buyer map display.
- components/shared/CampusVitals.tsx: campus vitals widget.
- components/shared/HeartbeatLine.tsx and PulseLine.tsx: visual pulse/heartbeat components.
- components/shared/MapErrorBoundary.tsx: map error wrapper.
- components/shared/RunnerEnrollmentSheet.tsx: runner enrollment UI.
- components/shared/VoxelStatus.tsx: status visual component.

### Admin

- components/admin/AdminSidebar.tsx: admin navigation.
- components/admin/AddMerchantModal.tsx: admin merchant creation.
- components/admin/AdminProductApprovals.tsx: product approval management.
- components/admin/ApprovalList.tsx: user approval list.
- components/admin/AuditReviewModal.tsx: audit review modal.
- components/admin/DisputeGuidance.tsx: dispute guidance UI.
- components/admin/DisputeResolutionDrawer.tsx: dispute resolution drawer.
- components/admin/PriceAudit.tsx: price audit UI.
- components/admin/PriceControlModal.tsx: price control settings modal.
- components/admin/RegistryList.tsx: admin registry list.
- components/admin/SimplePolicyModal.tsx: policy modal.
- components/admin/TreasuryView.tsx: treasury/finance view.

### Merchant

- components/merchant/DesktopMerchant.tsx: main merchant dashboard.
- components/merchant/MobileMerchant.tsx: mobile merchant dashboard.
- components/merchant/MerchantSidebar.tsx: merchant navigation.
- components/merchant/IncomingOrderAlert.tsx: incoming order alert.
- components/merchant/ProofInspector.tsx: proof and evidence viewer.
- components/merchant/ReceiptViewer.tsx: receipt display.
- components/merchant/SwipeToReady.tsx: order-ready interaction.
- components/merchant/DisputeThread.tsx: merchant dispute thread.
- components/merchant/PriceAppealModal.tsx: price appeal submission.

### Runner

- components/runner/FloatingActiveTask.tsx: floating active task indicator.
- components/runner/LiveMap.tsx: live map display.
- components/runner/SwipeToAccept.tsx: mission acceptance interaction.

### Pulse and Hub

- components/pulse/CreatePulsePost.tsx: announcement or Pulse post creation.
- components/pulse/EKGModule.tsx: Pulse visual module.
- components/pulse/FacilityModule.tsx: facility module.
- components/pulse/RadarModule.tsx: campus radar module.
- components/hub/FacilityCanvas.tsx: facility visual component.

### Other Components

- components/ActivityCard.tsx: activity card.
- components/AnnouncementBanner.tsx: announcement banner.
- components/ChatOverlay.tsx: chat overlay.

## 11. Environment Variables

Variables currently present in .env.local:

- NEXT_PUBLIC_FIREBASE_API_KEY: Firebase web API key. Used by lib/firebase.ts.
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: Firebase Auth domain. Used by lib/firebase.ts.
- NEXT_PUBLIC_FIREBASE_PROJECT_ID: Firebase project ID. Used by lib/firebase.ts, lib/firebase-admin.ts, and scripts.
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: Firebase Storage bucket. Used by lib/firebase.ts and storage scripts.
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: Firebase messaging sender ID. Used by lib/firebase.ts.
- NEXT_PUBLIC_FIREBASE_APP_ID: Firebase app ID. Used by lib/firebase.ts.
- FIREBASE_CLIENT_EMAIL: Firebase service account client email. Used by lib/firebase-admin.ts and Admin SDK scripts.
- FIREBASE_PRIVATE_KEY: Firebase service account private key. Used by lib/firebase-admin.ts and Admin SDK scripts.
- SERP_API_KEY: SerpAPI key. Used by lib/marketplace/price-engine.ts.

Variables referenced by the codebase but not necessarily present in .env.local:

- NEXT_PUBLIC_USE_EMULATORS: enables local Auth, Firestore, Storage, and Functions emulators.
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: used by Google Maps pages and components.
- OPENAI_API_KEY: used by lib/marketplace/price-engine-ai.ts.
- ANTHROPIC_API_KEY: Firebase Functions secret for pcsValidate.
- RESEND_API_KEY: Firebase Functions secret for sendWelcomeEmail.
- NODE_ENV: used by NavigationGate for development admin override.

## 12. Known Limitations and Gaps

### PCS Early Update Bug

PCS v3 uses update for COPYRIGHT_BLOCKED and free-market category bypass before the item document is created in the current create listing flow. This can fail for new listings because update requires the document to exist.

### Mixed PriceGuidelines Schema

PriceGuidelines is used for both category policy documents and flagged item review documents. Clean category documents use uppercase IDs and ceiling_rm. Some admin code still writes lowercase IDs with category and max_price.

### Legacy PCS and New PCS Coexist

PCS v3 is deployed in pcsValidate, but legacy price engines, price cache collections, admin pcs_result references, and old is_price_flagged logic remain.

### Status Casing and Status Vocabulary Are Still Mixed

Some listing code writes active lowercase, some admin stats expect ACTIVE uppercase, and some order flows use PENDING_VENDOR or PENDING_RUNNER while cleanup scripts prefer normalized statuses. Marketplace item reads have been fixed for ACTIVE/active, but other modules are not fully normalized.

### Review Field Names Are Still Mixed

onReviewCreated now handles both sellerId and seller_id, but some UI queries still use only one naming style. Reviews also mix itemId and item_id.

### Messaging Schema Is Mixed

Chat documents use different participant fields across flows, such as members, participants, participantIds, participant_names, createdAt, updatedAt, timestamp, and lastMessageAt.

### Duplicate Routes and Legacy Modules

There are duplicate or overlapping route families such as /run and /runner, /marketplace/[id]/edit and /marketplace/edit/[id], plus /post alongside /marketplace/create.

### Runner Onboarding Access May Be Too Strict

NavigationGate blocks /run and /runner pages for non-RUNNER users. That protects runner pages, but it may also block students from accessing /run/register or /run/onboarding if those are intended for applicants.

### Admin Cannot Use Marketplace Tools

The current access rules intentionally restrict ADMIN to admin pages only. This matches the latest requirement, but it means admins cannot browse marketplace or create listings from the same account.

### Firestore Security Requires Careful Review

The app uses many client-side Firestore writes across pages and components. A full security review of firestore.rules and storage.rules is needed before production, especially for role enforcement, item ownership, order mutation, evidence uploads, and admin-only writes.

### API Route send-welcome Is Placeholder

/api/send-welcome returns success without sending email. The real welcome email flow is in Cloud Functions sendWelcomeEmail.

### Firebase Runtime Warning

Deploy output warns that Node.js 20 runtime is deprecated as of 2026-04-30 and will be decommissioned on 2026-10-30. Functions should be upgraded before that date.

### Outdated firebase-functions Warning

Firebase deploy warns that firebase-functions is outdated and should be upgraded, with breaking changes expected.

### No Formal Test Suite

The repository has build and lint scripts but no comprehensive automated test suite for PCS, checkout, admin governance, runner delivery, role routing, or Firestore rules.

## 13. Future Improvements Roadmap

### PCS Improvements

- Change early PCS writes from update to merge set so copyright and free-market branches work before item creation.
- Split PriceGuidelines into separate collections for category policy and item review records.
- Add structured PCS appeal submission with seller evidence, receipts, and admin notes.
- Store Claude source URLs and confidence scores rather than a single source string.
- Validate Claude JSON with a schema and fallback retry.
- Add deterministic reference price sources for books and official brand stores.
- Add explicit copyright education in listing UI before PCS blocks.
- Expand copyright filter with ISBN, publisher, and digital-file attachment checks.
- Add PCS audit logs for every validation decision.
- Add batch revalidation for old items after policy changes.

### Planned or Partially Built Features

- Microsoft SSO sign-in.
- Complete runner applicant onboarding accessible to students.
- Fully unified order status timeline.
- Full admin evidence center route if not already wired into current pages.
- Complete UniStore official storefront workflow.
- Campaign management after campaigns cleanup.
- More robust campus radar and event publishing.
- Merchant promotion workflow connected to real campaign billing or approval.
- QR scanner integration with real order/facility validation.
- Complete payout processing and ledger reconciliation.

### Scalability Considerations

- Add compound indexes for frequent query combinations.
- Replace broad client-side collection reads with paginated queries.
- Move high-risk writes behind server actions or callable functions.
- Add Cloud Function retries and idempotency keys for checkout and PCS.
- Add typed Firestore models and converters.
- Add observability for Cloud Functions, price validation latency, and deploy errors.
- Add storage lifecycle policies for old evidence and temporary images.

### Multi-Campus Expansion

- Add campus_id to users, items, orders, facilities, events, announcements, and runner zones.
- Make CAMPUS_NODES campus-specific.
- Add campus-level admin roles.
- Support campus-specific PCS policy ceilings and free-market categories.
- Add inter-campus delivery restrictions.
- Add campus-specific announcements, banners, and campaigns.

### Technical Debt to Address

- Standardize all timestamp fields.
- Standardize role fields and remove legacy is_seller/is_verified_merchant ambiguity.
- Standardize item ownership fields: seller_id, merchant_id, is_official, listing_type.
- Standardize review fields: seller_id and item_id or sellerId and itemId, not both.
- Standardize chat participant fields.
- Standardize order statuses and remove legacy duplicates.
- Consolidate duplicate route families.
- Remove unused scripts or move operational scripts into a documented maintenance folder.
- Add tests for NavigationGate role redirects.
- Add tests for PCS decision matrix.
- Add tests for order stock decrement and cancellation stock restore.
- Add Firestore rules tests for admin, runner, club, and student access.
