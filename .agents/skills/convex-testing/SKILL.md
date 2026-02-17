---
name: convex-testing
description: Writes and updates Convex tests for queries and mutations using this repo's conventions (convex-test, Vitest, test fixture, factories). Use when adding or changing Convex functions, when asked to test specific queries/mutations, or when verifying behavior of convex/ code.
---

# Convex Testing (VibeFlow Conventions)

## When to add tests

- **New or changed mutations/queries:** Add or update tests in the corresponding `*.test.ts` file. Cover success paths, validation, and auth when relevant.
- **Bug fixes in Convex code:** Add a regression test.
- **When the user specifies:** Write tests for the specified queries and/or mutations to verify behavior.

## Test file placement

- Create test files with the `.test.ts` suffix **next to** the code they test.
- Examples: `convex/events/mutations.test.ts`, `convex/eventTaskLinks/queries.test.ts`, `convex/eventTaskLinks/mutations.test.ts`.
- Do not use dashes in file or folder names under `convex/` (e.g. use `eventTaskLinks`, not `event-task-links`).

## Use the Vitest fixture

Use the fixture in `convex/testFixture.nobundle.ts` so each test gets a fresh convex-test instance and **data is cleared after each test**.

```ts
import { api } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";
import { describe, test } from "../testFixture.nobundle";
import { addUserToTest, factories } from "../test.setup";

describe("myMutation", () => {
  test("success case", async ({ t, auth, expect }) => {
    const { asUser, userId } = auth;
    const id = await asUser.mutation(api.events.mutations.createEvent, factories.event());
    const doc = await t.run(async (ctx: MutationCtx) => ctx.db.get(id));
    expect(doc?.userId).toEqual(userId);
  });

  test("requires auth", async ({ t, expect }) => {
    await expect(t.mutation(api.events.mutations.createEvent, factories.event()))
      .rejects.toThrowError("Not authenticated");
  });

  test("two users same DB", async ({ t, auth, expect }) => {
    const { asUser: asAlice } = auth;
    const { asUser: asBob } = await addUserToTest(t, { firstName: "Bob" });
    // use asAlice and asBob with same t
  });
});
```

- **`t`** – raw convex-test instance (use for unauthenticated calls or for DB access via `t.run`).
- **`auth`** – one user in the DB plus `asUser` (identity). Has `{ asUser, userId, authId }`. Use `t` from the fixture when you need both (e.g. `async ({ t, auth }) => { ... }`).
- After each test, `clearAllTables(t)` runs automatically; no data leaks between tests.

## API reference: dot notation only

Use **dot notation** for the generated API. Bracket notation does not index correctly and causes type errors.

- **Wrong:** `api["events/mutations"].createEvent`
- **Correct:** `api.events.mutations.createEvent`, `api.events.queries.getEventsByUser`

## Typing `ctx` in `t.run` callbacks

Type the run callback argument explicitly. Use `MutationCtx` from `_generated/server` (same as in mutations).

```ts
import type { MutationCtx } from "../_generated/server";

const result = await t.run(async (ctx: MutationCtx) => {
  return await ctx.db.query("events").collect();
});
```

## Multi-user tests: one backend, two users

Each `convexTest()` call creates a **separate** in-memory backend. For two users in the **same** test (e.g. Alice and Bob in one DB), use **one** `t` and add the second user with `addUserToTest(t, …)`.

- **Wrong:** Two `setupAuthenticatedTest()` calls, then use `asBob.mutation(..., eventId)` where `eventId` was created by Alice — fails because Bob’s identity is in a different DB.
- **Correct:** `const { asUser: asBob } = await addUserToTest(t, { firstName: "Bob" });` then create as Alice and assert as Bob on the same `t`.

## What to cover

For each mutation or query you test:

1. **Success path** – happy case with expected DB state or return value.
2. **Validation** – invalid args (e.g. end before start) with the exact error message thrown.
3. **Auth** – when the function uses `authMutation` / `authQuery`:
   - **Requires auth:** Unauthenticated call (`t.mutation` / `t.query`) rejects with "Not authenticated".
   - **Not authorized:** Second user cannot access first user’s resource; expect "Not authorized to …" (or "Not authorized to view/update/delete …" as in the implementation).
   - **Not found:** Missing document or event; expect "… not found" or return `null`/`[]` as the implementation does.

Use the **exact error strings** from the Convex code (e.g. `toThrowError("Not authorized to update this event")`).

## Factories and test data

- Use **factories** from `convex/test.setup.ts` (e.g. `factories.event()`, `factories.calendar()`). Override with partials: `factories.event({ title: "Other" })`.
- For tables that have no factory yet, add a factory in `test.setup.ts` following the existing pattern (e.g. `EventFields`, `satisfies`, `Doc<"tableName">`). Use it in tests instead of hand-building objects.
- For one-off DB setup inside a test (e.g. deleted doc, or non-editable Google event), use `t.run(async (ctx: MutationCtx) => { ... })` and `ctx.db.insert` / `ctx.db.delete` with `factories.event()` (plus `userId`, etc.) as needed.

## Cleanup and schema

- **Cleanup** is handled by the fixture via `clearAllTables(t)`. Table names are derived from the schema in `test.setup.ts` (`Object.keys(schema)`), not hardcoded. Do not add a hardcoded list of table names elsewhere.
- **Path names in convex/:** Only alphanumeric characters, underscores, and periods. No dashes (e.g. `testFixture.nobundle.ts` is fine; `test-fixture.ts` can break deploy).

## Manual setup (optional)

For one-off or non-fixture tests, use `setupAuthenticatedTest()` and `setupTest()` from `convex/test.setup.ts`. There is no automatic cleanup; each test that creates a new `t` gets a new in-memory backend, so isolation is per test.

## After writing or changing tests

- Run `pnpm test` (or `pnpm check`) and fix any failures.
- Ensure `pnpm check` passes before marking work complete.

## Reference

- Full project testing doc: [convex/docs/testing.md](../../convex/docs/testing.md) (fixture details, `import.meta.glob` fix, `.nobundle.ts` rationale).
- Setup and factories: [convex/test.setup.ts](../../convex/test.setup.ts).
- Example tests: [convex/events/mutations.test.ts](../../convex/events/mutations.test.ts), [convex/events/queries.test.ts](../../convex/events/queries.test.ts).
- For adding factories, cleanup/schema rules, and glob typing: [reference.md](reference.md).
