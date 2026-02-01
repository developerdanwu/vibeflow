# Convex Data Patterns

## Mutations

**Use TanStack Query's `useMutation` directly. Do NOT create wrapper hooks for simple mutations.**

### ❌ Wrong

```tsx
// Don't create unnecessary hooks like useDeleteEvent, useUpdateTask, etc.
const { deleteEvent } = useDeleteEvent();
const [isDeleting, setIsDeleting] = useState(false); // Manual loading state
```

### ✅ Correct

```tsx
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";

const { mutate: deleteEvent, isPending } = useMutation({
  mutationFn: useConvexMutation(api.events.deleteEvent),
});

// isPending replaces manual loading state
<Button disabled={isPending}>{isPending ? "Deleting..." : "Delete"}</Button>
```

### Why?

TanStack Query gives you `isPending`, `isError`, `onSuccess`, `onError`, retry logic, and devtools for free.

### Exception

Create custom hooks only for **complex multi-step operations** (e.g., mutation + notification + cache invalidation).

---

*Updated: Jan 27, 2026*
