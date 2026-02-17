# Convex Backend - AI Agent Instructions

## Overview

Convex backend for VibeFlow. TypeScript, WorkOS AuthKit.

## Commands

```bash
pnpm convex:dev    # Dev server (separate terminal)
pnpm typecheck     # Type check
pnpm check         # Typecheck + lint + format
pnpm test          # Tests
pnpm dlx convex deploy   # Deploy
```

## Required Before Completion

- Run `pnpm typecheck`; fix all errors.
- Run `pnpm check`; must pass.

## Critical Rule

Never use `any`. Use `QueryCtx` / `MutationCtx` / `ActionCtx` from `./_generated/server`.

## Directory

```
convex/
├── _generated/      # DO NOT EDIT
├── schema.ts
├── helpers.ts       # authQuery, authMutation
├── errors.ts        # ErrorCode, throwConvexError
├── auth.ts
├── auth.config.ts
├── convex.config.ts
├── http.ts
├── crons.ts
├── test.setup.ts    # Test fixtures, clearAllTables, addUserToTest
├── testFixture.nobundle.ts
├── docs/            # Best-practice documentation
├── *.test.ts        # Co-located with code or in feature folders
├── events/          # queries.ts, mutations.ts, *.test.ts
├── calendars/       # queries.ts, mutations.ts, *.test.ts
├── users/           # queries.ts, mutations.ts, *.test.ts
├── googleCalendar/  # queries.ts, mutations.ts, actionsNode.ts, http.ts
├── eventTaskLinks/  # queries.ts, mutations.ts, *.test.ts
└── taskProviders/
    └── linear/     # queries.ts, mutations.ts, actionsNode.ts
```

**Folder structure:** Root holds shared/core modules. Feature-specific logic lives in feature folders (e.g. `googleCalendar/`) with procedures grouped by type: `actionsNode.ts`, `http.ts`, `queries.ts`, `mutations.ts`. Add new procedures for a feature in the appropriate file under that feature's folder.

## Documentation

Convex best practices (detailed):

- [docs/typescript-and-context.md](docs/typescript-and-context.md) (context types, auth patterns, circular types when helpers use api)
- [docs/custom-functions.md](docs/custom-functions.md)
- [docs/error-handling.md](docs/error-handling.md) (ConvexError, shared errors.ts, one helper)
- [docs/schema.md](docs/schema.md)
- [docs/patterns.md](docs/patterns.md)
- [docs/testing.md](docs/testing.md)
- [docs/debugging.md](docs/debugging.md)
- [docs/google-calendar-setup.md](docs/google-calendar-setup.md)
