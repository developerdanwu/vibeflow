# Convex Data Patterns (Frontend)

Use this doc for all Convex usage in the React app: queries, mutations, and typing.

## Mutations

**Prefer TanStack Query for mutations. Use `useMutation` + `useConvexMutation(api.*)` at the call site. Do NOT add wrapper hooks (e.g. `useUpdateEvent`, `useDeleteEvent`) for simple mutations.**

### ❌ Wrong

```tsx
// Don't create unnecessary hooks that just wrap the Convex mutation.
const { updateEvent } = useUpdateEvent();
const { deleteEvent } = useDeleteEvent();
const [isDeleting, setIsDeleting] = useState(false); // Manual loading state
```

```tsx
// Don't use Convex's useMutation directly when you want React Query benefits.
import { useMutation } from "convex/react";
const updateEvent = useMutation(api.events.updateEvent);
```

### ✅ Correct

**Button / one-off actions (use `mutate` or `mutateAsync` + `isPending`):**

```tsx
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";

const updateEventFn = useConvexMutation(api.events.updateEvent);
const { mutate: deleteEvent, isPending } = useMutation({
  mutationFn: useConvexMutation(api.events.deleteEvent),
});

// isPending replaces manual loading state
<Button disabled={isPending}>{isPending ? "Deleting..." : "Delete"}</Button>
```

**When you need to await (e.g. in onSubmit or passing to a callback):**

```tsx
const updateEventFn = useConvexMutation(api.events.updateEvent);
const { mutateAsync } = useMutation({ mutationFn: updateEventFn });

// In a submit handler or passed to a helper that expects (payload) => Promise<unknown>
await updateEvent({ id: event.convexId as Id<"events">, startTimestamp, endTimestamp });
```

Use `mutateAsync` when the caller needs to `await` the mutation (forms, DnD drop handlers, etc.). Use `mutate` when you only need fire-and-forget and optional `onSuccess` / `onError`.

### Why?

TanStack Query gives you `isPending`, `isError`, `onSuccess`, `onError`, retry logic, and devtools for free. Calling `api.events.updateEvent` (and other mutations) through React Query keeps server state and loading/error handling consistent.

### Exception

Create custom hooks only for **complex multi-step operations** (e.g. mutation + notification + cache invalidation). Simple “call this Convex mutation” should stay as `useMutation({ mutationFn: useConvexMutation(api.*) })` at the call site.

### Typing mutation payloads

You don't have to manually type mutation payloads. Use Convex's `FunctionArgs` from `convex/server` so the payload type stays in sync with the mutation:

```ts
import type { FunctionArgs } from "convex/server";
import { api } from "@convex/_generated/api";

type UpdateEventPayload = FunctionArgs<typeof api.events.updateEvent>;
// Use this type for helpers or for a returned function's parameter
```

When you inline `onMutate`, `onError`, and `onSettled` in `useMutation`, the callback arguments (e.g. `payload`, `context`) are inferred from the mutation's `mutationFn`—you don't need to type them. Only add an explicit type when you need it for a separate helper (e.g. `patchEventsCache(prev, payload)`) or for the parameter of a function you return from the hook.

### Invalidation

**With Convex, do not invalidate queries after mutations.** Convex keeps the client in sync with the backend via its realtime subscription; the React Query cache is updated automatically when server data changes. Adding `queryClient.invalidateQueries(...)` in `onSettled` (or elsewhere) is unnecessary and can cause extra refetches. Use optimistic updates in `onMutate` and rollback in `onError` if needed; leave invalidation out.

---

*Updated: Feb 2026*
