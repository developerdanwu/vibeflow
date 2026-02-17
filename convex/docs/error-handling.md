# Error handling in Convex

**When this applies:** Throwing application errors from queries, mutations, or actions so the client can show structured messages or branch on error type.

## Use ConvexError, not plain Error

Plain `throw new Error("...")` works, but the client only gets an opaque error. Use `ConvexError` so the client receives `error.data` (e.g. `code`, `message`).

### Wrong

```typescript
if (!event) throw new Error("Event not found");
```

### Correct

```typescript
import { ErrorCode, throwConvexError } from "../errors";

if (!event) throwConvexError(ErrorCode.EVENT_NOT_FOUND, "Event not found");
```

**Why:** The client can use `error instanceof ConvexError` and `error.data.code` / `error.data.message` for toasts or UI. Use the shared [convex/errors.ts](../errors.ts) (`ErrorCode`, `throwConvexError`) so codes stay consistent.

## One helper is enough

Use a single helper (`throwConvexError(code, message?)`) for the current payload shape. Do not add a second helper (e.g. `throwConvexErrorWithData`) "for future extra fields" until you have a concrete need.

**Why:** YAGNI—extend the existing helper or add another when you actually need richer payloads (e.g. validation errors with a `field` property).
