# Common Patterns

## Query Pattern

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getItems = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("items").take(args.limit ?? 10);
  },
});
```

## Mutation Pattern

For authenticated mutations, use [authMutation](custom-functions.md) so `ctx.user` is available. For unauthenticated or one-off logic:

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createItem = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.db.insert("items", {
      ...args,
      userId: identity.subject,
      createdAt: Date.now(),
    });
  },
});
```

## Action Pattern

```typescript
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const processData = action({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    const response = await fetch("https://api.example.com/data");
    const data = await response.json();
    await ctx.runMutation(api.items.updateItem, {
      id: args.itemId,
      data,
    });
  },
});
```

## Index Usage

Define indexes in the schema:

```typescript
events: defineTable({
  userId: v.id("users"),
  startTimestamp: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_and_date", ["userId", "startTimestamp"]);
```

Use indexes in queries:

```typescript
const userEvents = await ctx.db
  .query("events")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .collect();

const upcomingEvents = await ctx.db
  .query("events")
  .withIndex("by_user_and_date", (q) =>
    q.eq("userId", userId).gte("startTimestamp", Date.now())
  )
  .collect();
```

## Building object literals and typing

**When this applies:** Building payloads, config objects, or API params in one place.

- Prefer **one object literal with conditional spreads** instead of declaring a variable and assigning properties in multiple blocks.
- Type the object with **`satisfies SomeType`** instead of an explicit type annotation (`: SomeType`) or a cast (`as SomeType`). That keeps inference while still checking shape.

### Wrong

```typescript
const payload: Record<string, unknown> = { summary, description };
if (allDay) {
  payload.start = { date: startStr };
  payload.end = { date: endStr };
} else {
  payload.start = { dateTime: startIso, timeZone };
  payload.end = { dateTime: endIso, timeZone };
}
await client.patch({ requestBody: payload as Schema$Event });
```

### Correct

```typescript
const payload = {
  summary,
  description,
  ...(allDay
    ? { start: { date: startStr }, end: { date: endStr } }
    : { start: { dateTime: startIso, timeZone }, end: { dateTime: endIso, timeZone } }),
} satisfies Schema$Event;
await client.patch({ requestBody: payload });
```

**Why:** Single object literal is easier to read and avoids mutation; `satisfies` gives type checking without widening the type or requiring a cast.
