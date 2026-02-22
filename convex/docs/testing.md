# Testing

## When to add tests

- **New or changed mutations/queries:** Add or update tests in the corresponding `*.test.ts` file (e.g. `convex/events/mutations.test.ts`). Cover success paths, validation, and auth when relevant.
- **Bug fixes in Convex code:** Add a regression test so the bug doesn’t return.
- **Critical paths:** New features that touch Convex should include tests for the Convex side (mutations, queries, auth).

## Run tests after changes

After changing Convex functions or test setup, run `pnpm test` (or `pnpm check`, which includes typecheck/lint). Before marking work complete or opening a PR, ensure `pnpm test` and `pnpm check` pass. See root [AGENTS.md](../../AGENTS.md) → "Testing and Verification Rules" for project-wide rules.

## Commands

```bash
pnpm test           # Run all tests
pnpm test --watch   # Watch mode
```

## Test File Placement

Create test files with the `.test.ts` suffix next to the code they test (e.g. `convex/events/mutations.test.ts`), or in `convex/` for root-level tests.

## Fixture and cleanup

Use the Vitest fixture in `convex/testFixture.nobundle.ts` so each test gets a fresh convex-test instance and **test data is cleared after each test**. The `.nobundle.ts` suffix uses Convex’s “multiple dots” heuristic so this file is not bundled on deploy (it imports Vitest, which would fail outside the test runner).

- **`t`** – raw convex-test instance (no user). Use for unauthenticated tests or for DB access (`t.run`) in any test.
- **`auth`** – same backend with one user in the DB and `asUser` (identity). Contains only `{ asUser, userId, authId }`; get `t` from the fixture when you need both (e.g. `async ({ t, auth }) => { const { asUser } = auth; ... }`).

After the test runs, `clearAllTables(t)` is called so no data leaks between tests.

```typescript
import { test, describe } from "../testFixture.nobundle";
import { api } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";
import { addUserToTest, factories } from "../test.setup";

describe("createEvent", () => {
  test("creates event when authenticated", async ({ t, auth, expect }) => {
    const { asUser, userId } = auth;
    const created = await asUser.mutation(api.events.mutations.createEvent, factories.event());
    const eventId = created._id;
    const event = await t.run((ctx: MutationCtx) => ctx.db.get("events", eventId));
    expect(event?.userId).toEqual(userId);
  });

  test("requires auth", async ({ t, expect }) => {
    await expect(t.mutation(api.events.mutations.createEvent, factories.event()))
      .rejects.toThrowError("Not authenticated");
  });

  test("two users same DB", async ({ t, auth, expect }) => {
    const { asUser: asAlice } = auth;
    const { asUser: asBob } = await addUserToTest(t, { firstName: "Bob" });
    // ... use asAlice and asBob on same t
  });
});
```

## Manual setup (no fixture)

For one-off or non-fixture tests, use `setupAuthenticatedTest()` and `setupTest()` from `convex/test.setup.ts`. There is no automatic cleanup when using manual setup; each `convexTest()` call gets a new in-memory backend, so isolation is per test when you create a new `t` per test.

## TypeScript and patterns

### API reference: use dot notation

The generated API uses dot notation for nested modules. Bracket notation does not index correctly and causes type errors.

**Wrong:** `api["events/mutations"].createEvent`  
**Correct:** `api.events.mutations.createEvent`

Same for queries: `api.events.queries.getEventsByUser`.

### Typing `ctx` in `t.run` callbacks

Type the run callback argument so it isn’t implicit `any`. Use `MutationCtx` from `_generated/server` (same as in mutations).

```typescript
import type { MutationCtx } from "../_generated/server";

const result = await t.run(async (ctx: MutationCtx) => {
  return await ctx.db.query("events").collect();
});
```

### DB operations in tests: table name required

Inside `t.run` (or any test code that uses `ctx.db`), use the same Convex DB API as in production: **`db.get`, `db.patch`, `db.replace`, and `db.delete` require the table name as the first argument.** See [patterns.md](patterns.md#database-get-patch-replace-delete-table-name-required).

### Multi-user tests: one backend, two users

Each `convexTest()` call creates a **separate** in-memory backend. If you call `setupAuthenticatedTest()` twice, you get two backends; the second user’s mutations run in a different DB than the first.

For two users in the same test (e.g. “Alice” and “Bob” in one DB), use one `t` and add the second user with `addUserToTest(t, …)` so both users exist in the same backend.

**Wrong:** Two `setupAuthenticatedTest()` calls, then `asBob.mutation(..., eventId)` where `eventId` was created by Alice — fails or “User not found” because Bob’s identity is in a different DB.  
**Correct:** `const { t, asUser: asAlice } = await setupAuthenticatedTest(); const { asUser: asBob } = await addUserToTest(t, { firstName: "Bob" });` then create event as Alice and assert as Bob on the same `t`.

### Factories and cleanup

- **Event factory:** Uses `Doc<"events">` via `EventFields = Omit<Doc<"events">, "_id" | "_creationTime">` in `test.setup.ts`. Overrides are `Partial<EventFields>`; return value uses `satisfies` so the shape is checked without widening.
- **Cleanup:** `clearAllTables(t)` deletes all documents from all schema tables. Type its `t.run` callback with `MutationCtx`.

### Derive table names from schema

`clearAllTables` needs the list of all table names. Derive them from the schema object instead of hardcoding a list, so new tables are included automatically.

#### ❌ Wrong

```ts
const CONVEX_TABLE_NAMES: TableNames[] = [
  "users",
  "events",
  "calendars",
  // easy to forget new tables
];
```

#### ✅ Correct

```ts
import schema from "./schema";

const CONVEX_TABLE_NAMES: TableNames[] = Object.keys(schema) as TableNames[];
```

**Why:** Hardcoded lists go stale when tables are added; deriving from the schema keeps cleanup in sync automatically.

### Fixture must not be bundled by Convex

`testFixture.nobundle.ts` imports `vitest`. Convex bundles `.ts` files in `convex/` on push; if it bundles a file that imports Vitest, Vitest runs outside the test runner and throws ("Vitest failed to access its internal state"). We use the **multiple-dots heuristic**: Convex excludes files whose path has multiple dots (e.g. `testFixture.nobundle.ts`), so the fixture lives in `convex/` but is not bundled. See [Discord: exclude files from bundle](https://discord-questions.convex.dev/m/1301980959318741052). No official `exclude` config in `convex.json` exists yet. Alternative: keep test utilities outside `convex/` (e.g. `convex-tests/`) so they are never part of the bundle.

**Path names in convex/:** Convex only allows alphanumeric characters, underscores, and periods in path components. No dashes — e.g. `test-fixture.ts` will break deploy; use `testFixture.ts` or `testFixture.nobundle.ts`.

### TypeScript: `import.meta.glob` in convex/

`convex/tsconfig.json` does not include Vite’s types, so any file in `convex/` that uses `import.meta.glob` (e.g. `test.setup.ts`) can report: `Property 'glob' does not exist on type 'ImportMeta'`.

**Fix:** Add at the top of that file:

```ts
/// <reference types="vite/client" />
```

Prefer this over `@ts-ignore` so `glob` stays correctly typed.
