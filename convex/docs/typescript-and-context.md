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
