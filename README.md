# CODEP-PULSE

A campus marketplace and on-demand delivery platform designed for university students, student sellers, clubs, campus runners, and administrators.

CODEP-PULSE centralizes buying, selling, delivery, dispute handling, and campus commerce workflows in one application. The project focuses on identity verification, fair marketplace operations, delivery confirmation, and practical administration tools.

## Core Features

- Institutional student registration and authentication
- Role-based workflows for buyers, sellers, runners, and administrators
- Product listings and marketplace discovery
- Campus delivery and runner assignment
- QR-based delivery confirmation
- Map and location-based features
- Notifications and transactional email
- Seller price monitoring and administrative review
- Dispute management and operational analytics

## Technology Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend and data:** Firebase, Firebase Admin, Supabase
- **Maps:** Google Maps, Leaflet, React Leaflet
- **Validation:** Zod
- **Email:** Resend
- **Analytics and UI:** Recharts, Framer Motion
- **Deployment:** Vercel

## Architecture

```text
Users
  |
  v
Next.js application
  |
  +-- Authentication and role checks
  +-- Marketplace and order workflows
  +-- Delivery and QR confirmation
  +-- Maps and location services
  +-- Administration and analytics
  |
  v
Firebase / Supabase / external services
```

See [`docs/architecture.md`](docs/architecture.md) for more detail.

## Local Development

### Requirements

- Node.js 20 or newer
- npm
- Firebase and Supabase project credentials

### Setup

```bash
git clone https://github.com/pakyad/pulse.git
cd pulse
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Copy `.env.example` to `.env.local` and provide the required credentials. Never commit real secrets.

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Engineering Principles

- Server credentials must never be exposed to browser bundles.
- Authorization must be enforced at the server or data boundary.
- Sensitive operations must validate input explicitly.
- Delivery completion should require verifiable confirmation.
- Price monitoring should support human review rather than automatically punish users.
- Location data should only be collected when required for an active workflow.

## Current Status

The project is under active development. Core workflows are being refined for deployment, reliability, security, and usability.

## Documentation

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/security.md`](docs/security.md)
- [`docs/decisions/`](docs/decisions/)
- [`CONTRIBUTING.md`](CONTRIBUTING.md)

## Author

**Muhammad Iyad Iman**  
Software Engineering student at Universiti Kuala Lumpur MIIT

## License

Provided for portfolio and educational review. See [`LICENSE`](LICENSE).
