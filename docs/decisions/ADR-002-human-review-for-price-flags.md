# ADR-002: Human Review for Price Flags

## Status

Accepted

## Context

The marketplace needs to identify potentially unreasonable prices without making automatic decisions that could unfairly block student sellers.

## Decision

Automated price analysis produces a flag or recommendation. Administrators retain final review authority for enforcement actions.

## Consequences

- False positives are less likely to directly harm users.
- Administrative review workload remains.
- The system must retain enough context to explain why an item was flagged.
