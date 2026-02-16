# TypeScript and Context Typing

## Never Use `any`

**NEVER use `any` types in Convex functions.** Always use proper types from `./_generated/server`.

## Context Types

Convex provides three context types:

- **QueryCtx** – read-only database access
- **MutationCtx** – read-write database access
- **ActionCtx** – can call external APIs, queries, and mutations

```typescript
import type { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";

async function helperQuery(ctx: QueryCtx) {
  const data = await ctx.db.query("table").collect();
  return data;
}

async function helperMutation(ctx: MutationCtx) {
  await ctx.db.insert("table", { field: "value" });
}

async function helperAction(ctx: ActionCtx) {
  await ctx.runMutation(api.mutations.doSomething);
}
```

When a **helper is called from an action** and needs to run queries or mutations, type its first parameter as `ActionCtx` (from `./_generated/server`). Do not use inline object types like `{ runQuery: ..., runMutation: ... }`—they conflict with Convex’s generic signatures and cause type errors.

**Wrong:** Inline type for action helper parameter  
**Correct:** `ctx: ActionCtx` (or `QueryCtx` / `MutationCtx` for query/mutation helpers)

## Helper Function Patterns

**BAD – using `any`:**

```typescript
// Do not do this
async function getUserIdFromAuth(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  // ...
}
```

**GOOD – properly typed:**

```typescript
import type { MutationCtx } from "./_generated/server";

async function getUserIdFromAuth(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("authId", (q) => q.eq("authId", identity.subject))
    .unique();
  if (!user) {
    throw new Error("User not found in database");
  }
  return user._id;
}
```

## Auth in Plain Queries/Mutations

For one-off auth without custom builders:

```typescript
export const getMyData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("authId", (q) => q.eq("authId", identity.subject))
      .unique();
    if (!user) return null;
    return await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});
```

Prefer [authQuery / authMutation](custom-functions.md) for authenticated functions.

## Circular types when helpers use `api`

**When this applies:** A module that is part of the generated API (e.g. `helpers.ts`) needs to call another Convex function via `ctx.runQuery(api.someModule.someQuery, args)` or similar. A normal `import { api } from "./_generated/api"` can cause a circular type reference (e.g. `api` includes `helpers`, and `helpers` imports `api`).

**Wrong:** Dynamic import to avoid the cycle. It doesn’t reliably fix inference and adds runtime indirection.

```typescript
const { api } = await import("./_generated/api");
const user = (await ctx.runQuery(api.users.queries.getUserByAuthId, { authId })) as Doc<"users"> | null;
```

**Correct:** Static import `api` and assert the function reference type so the compiler doesn’t follow the cycle. Also assert the return value if needed.

```typescript
import { api } from "./_generated/api";

const user = (await ctx.runQuery(
  api.users.queries.getUserByAuthId as import("convex/server").FunctionReference<
    "query",
    "public",
    { authId: string },
    Doc<"users"> | null
  >,
  { authId: identity.subject },
)) as Doc<"users"> | null;
```

**Why:** The assertion on the reference breaks circular type inference; the return assertion keeps the rest of the code typed. Static import keeps the call simple and avoids dynamic import.

**Don’t:** Add an explicit return type on the `input` function (e.g. `Promise<{ ctx: { user: Doc<"users"> }; args: Record<string, never> }>`). Let TypeScript infer it from the return statement.
