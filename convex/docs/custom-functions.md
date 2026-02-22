# Custom Function Builders (authQuery / authMutation / authAction)

We use `convex-helpers` **Zod** integration (`zCustomQuery`, `zCustomMutation`, `zCustomAction`) to create custom query, mutation, and action builders with built-in authentication. Function **args** are defined with **Zod** schemas (not Convex `v` validators).

**Implementation:** [convex/helpers.ts](../helpers.ts)  
**Reference:** [convex-helpers server/zod](https://github.com/get-convex/convex-helpers) (`zCustomQuery`, `zCustomMutation`, `zid`); [Stack: Zod with Convex](https://stack.convex.dev/typescript-zod-function-validation)

## Usage

```typescript
import { z } from "zod";
import { zid } from "convex-helpers/server/zod4";
import { authQuery, authMutation } from "../helpers";

export const getMyData = authQuery({
  args: z.object({}),
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .collect();
  },
});

export const createItem = authMutation({
  args: z.object({ title: z.string() }),
  handler: async (ctx, args) => {
    return await ctx.db.insert("items", {
      ...args,
      userId: ctx.user._id,
    });
  },
});

export const getItem = authQuery({
  args: z.object({ id: zid("items") }),
  handler: async (ctx, args) => {
    return await ctx.db.get("items", args.id);
  },
});
```

- Use **`z.object({ ... })`** for args. For Convex document IDs use **`zid("tableName")`** (from `convex-helpers/server/zod4`).
- Invalid args are rejected with a ConvexError containing the Zod validation error.

## Context Extension

When using `authQuery` or `authMutation`, the context is extended with:

- **ctx.user** – The authenticated user document from the `users` table
- Type: `Doc<"users">` with fields: `_id`, `authId`, `email`, `firstName`, `lastName`, `fullName`, `profileImageUrl`, `updatedAt`

## Behavior

- Unauthenticated requests throw `"Not authenticated"`.
- User not found in database throws `"User not found in database"`.
- Use these builders for all authenticated queries and mutations instead of manually looking up the user in each handler.
