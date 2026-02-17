# Convex Testing – Reference

## Repo docs and code

- **Testing conventions:** `convex/docs/testing.md`
- **Test setup, cleanup, factories, auth helpers:** `convex/test.setup.ts`
- **Fixture (t, auth, cleanup):** `convex/testFixture.nobundle.ts`
- **Example tests:** `convex/events/mutations.test.ts`, `convex/events/queries.test.ts`, `convex/calendars/mutations.test.ts`, `convex/users/mutations.test.ts`

## Cleanup: derive table names from schema

`clearAllTables` in `test.setup.ts` uses `Object.keys(schema)` so new tables are included automatically. Do not maintain a hardcoded list of table names.

## Fixture must not be bundled

`testFixture.nobundle.ts` imports Vitest. Convex excludes files whose path has multiple dots (e.g. `.nobundle.ts`), so the fixture is not bundled on deploy. Paths in `convex/` must use only alphanumeric characters, underscores, and periods (no dashes).

## TypeScript: `import.meta.glob` in convex/

If a file in `convex/` uses `import.meta.glob` (e.g. `test.setup.ts`), add at the top:

```ts
/// <reference types="vite/client" />
```

## Adding a new factory

In `test.setup.ts`:

1. Define fields type: `Omit<Doc<"tableName">, "_id" | "_creationTime">`.
2. Add a factory that returns an object with required fields and optional overrides, using `satisfies` so the shape is checked without widening.
3. Use the factory in tests and in `t.run` when inserting (spread factory and add `userId` or other required fields as needed).
