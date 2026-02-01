# Custom Function Builders (authQuery / authMutation)

We use `convex-helpers` to create custom query and mutation builders with built-in authentication.

**Implementation:** [convex/helpers.ts](../helpers.ts)  
**Reference:** [convex-helpers customFunctions](https://github.com/get-convex/convex-helpers/blob/main/packages/convex-helpers/server/customFunctions.ts)

## Usage

```typescript
import { authQuery, authMutation } from "../helpers";
import { v } from "convex/values";

export const getMyData = authQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .collect();
  },
});

export const createItem = authMutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("items", {
      ...args,
      userId: ctx.user._id,
    });
  },
});
```

## Context Extension

When using `authQuery` or `authMutation`, the context is extended with:

- **ctx.user** – The authenticated user document from the `users` table
- Type: `Doc<"users">` with fields: `_id`, `authId`, `email`, `firstName`, `lastName`, `fullName`, `profileImageUrl`, `updatedAt`

## Behavior

- Unauthenticated requests throw `"Not authenticated"`.
- User not found in database throws `"User not found in database"`.
- Use these builders for all authenticated queries and mutations instead of manually looking up the user in each handler.
