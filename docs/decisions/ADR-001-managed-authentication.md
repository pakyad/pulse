# ADR-001: Managed Authentication

## Status

Accepted

## Context

The platform needs student identity, session management, and role-aware access without maintaining a custom password system.

## Decision

Use Firebase Authentication for identity. Protected server operations must verify identity tokens and resolve application roles independently of client input.

## Consequences

- Authentication infrastructure is managed externally.
- Authorization remains an application responsibility.
- The project depends on Firebase availability and configuration.
