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
├── _generated/   # DO NOT EDIT
├── schema.ts
├── helpers.ts    # authQuery, authMutation
├── auth.ts
├── auth.config.ts
├── convex.config.ts
├── users.ts
├── events.ts
├── calendars.ts
├── http.ts
├── crons.ts
├── todos.ts
├── docs/         # Best-practice documentation
├── *.test.ts
└── <feature>/    # Feature folders (e.g. googleCalendar/)
    ├── actionsNode.ts   # Actions (use "use node" if needed)
    ├── http.ts          # HTTP handlers
    ├── queries.ts       # Queries (auth + internal)
    └── mutations.ts    # Internal mutations
```

**Folder structure:** Root holds shared/core modules. Feature-specific logic lives in feature folders (e.g. `googleCalendar/`) with procedures grouped by type: `actionsNode.ts`, `http.ts`, `queries.ts`, `mutations.ts`. Add new procedures for a feature in the appropriate file under that feature's folder.

## Documentation

Convex best practices (detailed):

- [docs/typescript-and-context.md](docs/typescript-and-context.md)
- [docs/custom-functions.md](docs/custom-functions.md)
- [docs/schema.md](docs/schema.md)
- [docs/patterns.md](docs/patterns.md)
- [docs/testing.md](docs/testing.md)
- [docs/debugging.md](docs/debugging.md)
