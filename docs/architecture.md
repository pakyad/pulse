# System Architecture

## Overview

CODEP-PULSE is a role-based campus marketplace delivered as a Next.js web application. Managed cloud services provide authentication, persistence, notifications, email, and operational integrations.

## User Roles

- **Buyer:** discovers listings, places orders, selects fulfilment, and confirms delivery.
- **Seller or club:** creates listings, manages availability, and fulfils orders.
- **Campus runner:** accepts eligible delivery tasks and completes verified hand-offs.
- **Administrator:** reviews users, disputes, pricing flags, and operational activity.

## Main Components

### Web Application

The Next.js application provides the user interface, route handling, server-side operations, and integration boundaries.

### Authentication and Authorization

Firebase Authentication manages identity. Application roles determine permitted workflows. Interface-level checks are for usability only; protected operations must also verify identity and role at the server or database boundary.

### Marketplace

The marketplace component handles listings, search, pricing information, carts, orders, and seller workflows.

### Delivery

The delivery component coordinates runner availability, task assignment, location data, order state transitions, and QR-based completion confirmation.

### Administration

The administration area supports operational oversight, dispute handling, user review, pricing flags, and analytics.

### External Services

- Firebase and Firebase Admin
- Supabase
- Google Maps and Leaflet
- Resend
- Notification services

## Data Flow

1. A user authenticates.
2. The application resolves the user's role.
3. The user performs an allowed marketplace or delivery action.
4. Input is validated before persistence.
5. The backend enforces authorization and updates the relevant state.
6. Notifications or email are triggered when required.
7. Administrative events remain reviewable through the admin workflow.

## Design Priorities

- Clear role boundaries
- Verifiable order state changes
- Minimal collection of location data
- Human review for disputed or flagged activity
- Reproducible builds and automated checks
