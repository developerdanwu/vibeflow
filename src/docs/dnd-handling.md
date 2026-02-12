# Drag and Drop Handling

Patterns for handling drag and drop interactions, especially for locked/non-editable events.

## Preventing Drag for Locked Events

When an event is locked (e.g., created by someone else), we need to prevent dragging while still allowing clicks to open event details.

### ❌ Wrong - Using `onPointerDown` directly

```tsx
const handlePointerDown = (e: React.PointerEvent) => {
  if (isLocked) {
    toast.error("This event cannot be moved.");
    e.stopPropagation();
    e.preventDefault();
  }
};

// Problem: This fires on clicks too, blocking event details popover
<div onPointerDown={handlePointerDown}>
  {children}
</div>
```

### ✅ Correct - Track pointer movement to distinguish clicks from drags

```tsx
const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
const DRAG_THRESHOLD = 5; // pixels - matches dnd-kit's activation distance

const handlePointerDown = (e: React.PointerEvent) => {
  if (!isLocked) {
    return;
  }
  // Track initial pointer position
  pointerStartRef.current = { x: e.clientX, y: e.clientY };
};

const handlePointerMove = (e: React.PointerEvent) => {
  if (!isLocked || !pointerStartRef.current) {
    return;
  }

  const deltaX = Math.abs(e.clientX - pointerStartRef.current.x);
  const deltaY = Math.abs(e.clientY - pointerStartRef.current.y);
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  // Only show toast if user actually moved the pointer (drag attempt)
  if (distance > DRAG_THRESHOLD) {
    toast.error("This event cannot be moved. It was created by someone else.");
    // Prevent the drag from starting
    e.stopPropagation();
    e.preventDefault();
    pointerStartRef.current = null;
  }
};

const handlePointerUp = () => {
  pointerStartRef.current = null;
};

// For locked events, handle pointer events manually
if (isLocked) {
  return (
    <div
      ref={setNodeRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="cursor-not-allowed"
    >
      {children}
    </div>
  );
}
```

**Why:** 
- Clicks don't move the pointer, so `handlePointerMove` never fires → event details can open normally
- Drag attempts move the pointer beyond threshold → toast shows and drag is prevented
- Matches dnd-kit's activation distance (5px) for consistent behavior

## Toast Behavior for Drag Attempts

Each drag attempt should show a **new toast** (not update the same one), so users can see multiple attempts.

### ❌ Wrong - Using toastId to update same toast

```tsx
const toastId = `locked-event-${event.id}`;

toast.error("This event cannot be moved.", {
  id: toastId, // Updates same toast on each attempt
});
```

### ✅ Correct - No toastId, each attempt creates new toast

```tsx
// No toastId - each call creates a new toast
toast.error("This event cannot be moved. It was created by someone else.");
```

**Why:** Multiple drag attempts should be visible as separate notifications, making it clear to users that their attempts are being blocked.

## Preventing Visual Drag Movement

For locked events, don't attach dnd-kit's drag listeners. Handle pointer events manually to prevent any visual drag movement.

### ✅ Correct Pattern

```tsx
const { attributes, listeners, setNodeRef } = useDraggable({
  id,
  data: { type: "event", event },
});

// For locked events, don't attach listeners
if (isLocked) {
  return (
    <div
      ref={setNodeRef}
      // No {...listeners} - prevents drag from starting
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      {...attributes}
    >
      {children}
    </div>
  );
}

// For editable events, attach listeners normally
return (
  <div ref={setNodeRef} {...listeners} {...attributes}>
    {children}
  </div>
);
```

**Why:** Without `{...listeners}`, dnd-kit never initiates the drag, so there's no visual movement even if the user tries to drag.
