# Security Notes

This document records the intended security baseline for CODEP-PULSE.

## Secrets

- Store local secrets in `.env.local`.
- Never commit service-account credentials or private API keys.
- Prefix only intentionally public browser variables with `NEXT_PUBLIC_`.
- Keep Firebase Admin and other privileged credentials server-only.
- Rotate any credential that has previously been committed.

## Authentication

- Use Firebase Authentication as the identity provider.
- Verify authentication tokens on protected server operations.
- Do not trust client-provided user IDs, roles, prices, or order ownership.

## Authorization

- Enforce permissions at the server and database boundary.
- Treat frontend route guards as a usability feature, not a security control.
- Validate that users may access or mutate each specific resource.
- Keep administrator operations isolated from normal user workflows.

## Input Validation

- Validate request payloads with explicit schemas.
- Reject unknown or malformed fields for sensitive operations.
- Normalize identifiers, email addresses, prices, and coordinates.
- Avoid rendering unsanitized user-generated HTML.

## Marketplace and Payments

- Calculate authoritative totals on the server.
- Do not trust prices submitted by the browser.
- Record significant order state transitions.
- Require explicit authorization for refunds, disputes, and administrative changes.

## Delivery and Location

- Request location only during an active delivery workflow.
- Avoid retaining precise coordinates longer than operationally necessary.
- Do not expose a runner's live location to unrelated users.
- Verify delivery completion using a short-lived or order-bound confirmation.

## Operational Checklist

Before deployment:

- Run lint and production build.
- Confirm secrets are excluded from Git.
- Review Firebase and Supabase access policies.
- Test all roles against protected operations.
- Verify error responses do not reveal credentials or internal details.
- Enable dependency and security alerts.
