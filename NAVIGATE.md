# PULSE - Quick Navigation Guide

## "Where is Claude AI?"
-> functions/src/index.ts -> search for "pcsValidate"
-> Look for: anthropic.messages.create

## "Where is the price validation logic?"
-> functions/src/index.ts -> pcsValidate function
-> Frontend trigger: app/marketplace/create/page.tsx -> search "pcsValidate"
-> Frontend trigger: components/CreateListing.tsx -> search "pcsValidate"

## "Where are item listings created?"
-> app/marketplace/create/page.tsx (student listings)
-> components/merchant/DesktopMerchant.tsx (merchant/club listings)
-> app/admin/unistore/page.tsx (UniStore official listings)

## "Where are orders processed?"
-> functions/src/index.ts -> placeOrder (Cloud Function)
-> app/actions/orderActions.ts (server actions)

## "Where is Firebase initialized?"
-> lib/firebase.ts (ONE place only)

## "Where are the Firestore collections used?"
-> items: marketplace listings
-> orders: all orders and deliveries
-> users: all user profiles
-> PriceGuidelines: PCS flagged items for admin
-> appeals: seller price appeals
-> disputes: buyer/seller conflicts
-> Reviews: seller ratings
-> notifications: in-app alerts
-> banners: home page carousel
-> announcements: campus notice board
-> governance_logs: admin audit trail

## "Where is the admin dashboard?"
-> app/admin/overview/page.tsx (main admin page)
-> app/admin/price-review/page.tsx (PCS flagged items)
-> app/admin/appeals/page.tsx (seller appeals)
-> app/admin/disputes/page.tsx (conflict resolution)

## "Where is the merchant dashboard?"
-> app/merchant/page.tsx (entry point)
-> components/merchant/DesktopMerchant.tsx (main component)
-> app/merchant/analytics/page.tsx (charts and revenue)

## "Where is the runner flow?"
-> app/run/page.tsx (runner home)
-> app/run/active/page.tsx (active delivery)
-> app/run/missions/page.tsx (mission management)

## "Where are images stored?"
-> Firebase Storage (not in code)
-> UniStore images: update image_url field directly in Firestore Console
-> Listing images: uploaded via create listing form -> stored at listings/{uid}/
-> Delivery proof photos: stored at delivery_proofs/

## "Where is the Student Market filter?"
-> app/marketplace/page.tsx -> search "Student Market"
-> Shows items where pcs_certified=true AND pcs_status=APPROVED

## "How to change a text label in the app?"
-> Search the text string in VS Code (Ctrl+Shift+F)
-> Find the file and line
-> Change the string
-> Save and refresh
