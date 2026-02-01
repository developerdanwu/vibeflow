# Testing

## Commands

```bash
pnpm test           # Run all tests
pnpm test --watch   # Watch mode
```

## Test File Placement

Create test files with the `.test.ts` suffix in the `convex/` directory (e.g. `events.test.ts`).

## Example

```typescript
// events.test.ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { createEvent } from "./events";

test("create event", async () => {
  const t = convexTest(schema);
  const eventId = await t.mutation(createEvent, {
    title: "Test Event",
    startDate: Date.now(),
    endDate: Date.now() + 3600000,
    allDay: false,
  });
  expect(eventId).toBeDefined();
});
```

Use `convex-test` for Convex function tests with a test schema.
