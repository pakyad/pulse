# Contributing

This repository is primarily maintained as a student software engineering and portfolio project.

## Development Workflow

1. Create a focused branch.
2. Make one coherent change.
3. Run lint and the production build.
4. Use a descriptive commit message.
5. Open a pull request describing the problem, solution, and verification.

## Branch Names

```text
feature/runner-assignment
fix/order-total-validation
docs/security-model
refactor/admin-dashboard
```

## Commit Messages

Use clear, scoped messages:

```text
feat(auth): restrict registration to institutional email accounts
fix(delivery): prevent duplicate completion confirmation
docs: document authorization boundaries
refactor(admin): separate dispute queries from dashboard UI
```

## Before Opening a Pull Request

```bash
npm run lint
npm run build
```

Do not commit `.env.local`, service-account files, generated build output, or real user data.
