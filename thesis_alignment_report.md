# PULSE: Thesis Alignment and Implementation Extraction Report

## 1. Requirement Traceability Matrix (RTM)
The following table maps the originally planned SRS modules to their finalized coded implementation within the PULSE repository.

| SRS Module | Implementation Node | Status | Evolution Note |
| :--- | :--- | :--- | :--- |
| **UniKL Registration** | `lib/firebase.ts` & Auth Flow | **Implemented** | Enforces `@s.unikl.edu.my` domain at the logic level. |
| **Marketplace** | `app/marketplace` (Next.js) / Flutter | **Implemented** | Optimized for high-fidelity "Voxel" aesthetic. |
| **Delivery Runner Hub** | `app/runner/active` (Next.js Web) | **Implemented** | Shifted to mobile-responsive web to lower entry barriers for runners. |
| **Vendor Dashboard** | `DesktopMerchant.tsx` / `MobileMerchant.tsx` | **Implemented** | Feature-complete with atomic inventory shielding. |
| **QR/FPX Payment** | `CartCheckoutPage.tsx` | **Simulated** | Integrated real FPX branding for institutional reliability. |
| **Analytics Engine** | `MerchantDashboard.revenue` | **Implemented** | Real-time Firestore aggregation of RM values. |

### Evolutionary Pivot: The Passive Verification Model
Originally, the project planned for active QR-code scanning for every delivery. This was evolved into the **Absolute Trust Proximity Audit**. Instead of forcing a physical scan (which can fail in low-light/crowded areas), the system now utilizes a **Double-Blind Handshake**:
1. Both parties click "Confirm Delivery" on their respective terminals.
2. The system fetches high-precision GPS coordinates.
3. A Proximity Audit (≤50m) is performed; if passed, the transaction is **auto-adjudicated as COMPLETED**.

## 2. Final System Architecture
The PULSE ecosystem utilizes a **Cross-Platform Polyglot Architecture** centered on a Serverless Firebase core.

*   **Student (Buyer) Interface**: A **Flutter 3.x** mobile application providing high-performance UI for item discovery and order tracking.
*   **Administrative & Vendor Command Center**: A **Next.js 14+ (App Router)** web application. It handles complex inventory management and institutional governance.
*   **Runner Terminal**: A specialized **Mobile-Responsive Web Interface** (`/runner`) allowing students to act as couriers without installing a separate app.
*   **Firebase Serverless Core**:
    *   **Firestore**: Acts as the real-time "Source of Truth" for all order states.
    *   **Cloud Functions (V2)**: Executes atomic logic like `placeOrder` (cart decomposition) and `priceSentinel` (automated governance).
    *   **Auth**: Manages role-based access control (RBAC).

## 3. Critical Logic & Workflows

### The "Runner-First" Logistics Handshake
The delivery lifecycle is governed by a strict state-machine implemented across Firestore and Cloud Functions:
1.  **Pending Vendor**: Order is accepted by the shop.
2.  **Preparing**: Merchant begins asset assembly.
3.  **Awaiting Runner**: The order enters the "Runner Radar" (Next.js).
4.  **In Transit**: Runner has picked up the item.
5.  **Delivered**: The "Passive Handshake" is initiated.
6.  **Completed**: Proximity Audit clears the RM disbursement to the vendor.

### Real-time Telemetry & State Sync
Synchronization is achieved via **Firestore `onSnapshot` listeners**. When a Runner clicks "Arrived at Building" in the `RunnerActivePage`, a Firestore write triggers an immediate UI update on the Buyer's `LiveOrderPage` without a page refresh, simulating a high-fidelity real-time experience.

## 4. Final Database Schema (Firestore)

### Collection: `users`
*   `role`: Enum (`STUDENT`, `MERCHANT`, `ADMIN`)
*   `fcmToken`: String (For push notifications)
*   `is_verified`: Boolean (Institutional badge)

### Collection: `items`
*   `price`: Number (RM)
*   `category`: String (Used for `priceSentinel` checks)
*   `status`: Enum (`ACTIVE`, `FLAGGED_FOR_REVIEW`)
*   `stock_count`: Integer (Atomic decrement handled by `placeOrder` function)

### Collection: `orders`
*   `handshake`: Map { `seller_confirmed`, `buyer_confirmed`, `coords`, `distance` }
*   `status`: String (Primary state machine variable)
*   `floorLevel`: String (Vertical Logistics metadata)
*   `roomNumber`: String (Indoor precise navigation)

### Security Rules (RBAC)
The security logic is enforced via `firestore.rules`. Access is granted based on the `isSignedIn()` helper and specific `resource.data` ownership checks.

## 5. Technical Constraints & Validation

### Institutional Domain Restriction
The platform enforces a strict identity gate. During registration and merchant onboarding, the logic checks for `@s.unikl.edu.my` or `@unikl.edu.my` suffixes.

### Price Ceiling Enforcement (`priceSentinel`)
To prevent marketplace inflation, a Cloud Function (`priceSentinel`) runs on every listing creation, comparing the price against institutional category ceilings.
