---
name: simplify-react-code
description: Simplifies React code by removing unused code, reducing refs, eliminating duplication, minimizing unnecessary useEffects, and applying React best practices. Use when refactoring React components, cleaning up code, or when code feels overly complex.
---

# Simplify React Code

Simplifies React components by removing unused code, reducing refs, eliminating duplication, and minimizing unnecessary effects while following React best practices.

## When to Use

Apply this skill when:
- Code has multiple refs that could be consolidated
- Conditional logic is repetitive or verbose
- Components have duplicate code patterns
- useEffects are used unnecessarily
- Code feels overly complex or verbose
- User requests simplification or cleanup

## Simplification Strategies

### 1. Reduce Refs

**Combine related refs into objects:**
```tsx
// ❌ Multiple refs
const lockedDragRef = useRef<string | null>(null);
const pendingActionRef = useRef<(() => void) | null>(null);
const formDataRef = useRef<TEventFormData | null>(null);

// ✅ Single ref object
const stateRef = useRef({
  lockedDragId: null as string | null,
  pendingAction: null as (() => void) | null,
  formData: null as TEventFormData | null,
});
```

**Use state instead of refs when appropriate:**
```tsx
// ❌ Ref for UI state that triggers re-render
const isOpenRef = useRef(false);
// Later: isOpenRef.current = true; // No re-render

// ✅ State for UI state
const [isOpen, setIsOpen] = useState(false);
```

**Only use refs for:**
- Values that don't need to trigger re-renders
- DOM element references
- Storing values across renders without causing updates
- Avoiding stale closures in callbacks

### 2. Simplify Conditional Logic

**Extract repeated conditions:**
```tsx
// ❌ Repetitive conditions
if (activeData?.type === "event" && activeData.event.isEditable === false) {
  toast.error("This event cannot be moved. It was created by someone else.");
  lockedDragRef.current = event.active.id as string;
} else if (
  activeData?.type === "event-resize" &&
  activeData.event.isEditable === false
) {
  toast.error("This event cannot be resized. It was created by someone else.");
  lockedDragRef.current = event.active.id as string;
}

// ✅ Extract common condition
const isLocked = activeData?.event.isEditable === false;
if (isLocked && (activeData?.type === "event" || activeData?.type === "event-resize")) {
  const action = activeData.type === "event" ? "moved" : "resized";
  toast.error(`This event cannot be ${action}. It was created by someone else.`);
  lockedDragRef.current = event.active.id as string;
}
```

**Use early returns:**
```tsx
// ❌ Nested conditions
const handleDragEnd = (event: DragEndEvent) => {
  if (lockedDragRef.current === event.active.id) {
    lockedDragRef.current = null;
  } else {
    const activeData = parseData(event);
    if (activeData) {
      if (activeData.event.isEditable !== false) {
        // process...
      }
    }
  }
};

// ✅ Early returns
const handleDragEnd = (event: DragEndEvent) => {
  if (lockedDragRef.current === event.active.id) {
    lockedDragRef.current = null;
    return;
  }
  
  const activeData = parseData(event);
  if (!activeData || activeData.event.isEditable === false) {
    return;
  }
  
  // process...
};
```

### 3. Eliminate Duplication

**Extract shared logic:**
```tsx
// ❌ Duplicate logic in multiple components
export function MonthDndProvider({ children }) {
  const onDragStart = (event) => {
    // ... same logic ...
  };
}

export function DayWeekDndProvider({ children }) {
  const onDragStart = (event) => {
    // ... same logic ...
  };
}

// ✅ Shared hook or utility
function useDragHandlers() {
  const lockedDragRef = useRef<string | null>(null);
  
  const onDragStart = (event: DragStartEvent) => {
    const activeData = parseDragData(event);
    const isLocked = activeData?.event.isEditable === false;
    if (isLocked && (activeData?.type === "event" || activeData?.type === "event-resize")) {
      const action = activeData.type === "event" ? "moved" : "resized";
      toast.error(`This event cannot be ${action}. It was created by someone else.`);
      lockedDragRef.current = event.active.id as string;
    } else {
      lockedDragRef.current = null;
    }
  };
  
  return { onDragStart, lockedDragRef };
}
```

**Consolidate similar operations:**
```tsx
// ❌ Repeated dialog pattern
if (activeData.event.recurringEventId) {
  dialogStore.send({
    type: "openRecurringEventDialog",
    onConfirm: (mode) => {
      moveEventToDay(activeData.event, overData.cell.date, mutateAsync, mode);
    },
    onCancel: () => {},
  });
  return;
}
moveEventToDay(activeData.event, overData.cell.date, mutateAsync);

// ✅ Helper function
const handleRecurringOrDirect = (
  event: TEvent,
  action: (mode?: "this" | "all") => void,
) => {
  if (event.recurringEventId) {
    dialogStore.send({
      type: "openRecurringEventDialog",
      onConfirm: action,
      onCancel: () => {},
    });
  } else {
    action();
  }
};
```

### 4. Minimize useEffects

**Avoid useEffects for derived state:**
```tsx
// ❌ useEffect for derived value
const [fullName, setFullName] = useState("");
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// ✅ Direct computation
const fullName = `${firstName} ${lastName}`;
```

**Avoid useEffects for event handlers:**
```tsx
// ❌ useEffect to attach event listener
useEffect(() => {
  const handleClick = () => { /* ... */ };
  element.addEventListener("click", handleClick);
  return () => element.removeEventListener("click", handleClick);
}, [element]);

// ✅ Direct handler in JSX
<button onClick={handleClick}>Click</button>
```

**Only use useEffects for:**
- Side effects (API calls, subscriptions)
- Synchronizing with external systems
- Cleanup operations
- When you need to run code after render

### 5. Remove Unused Code

**Check for:**
- Unused imports
- Unused variables
- Unused refs
- Dead code branches
- Commented-out code
- Unused props or parameters

**Use TypeScript strict mode and linter to catch:**
```bash
pnpm typecheck  # Find unused variables
pnpm lint       # Find unused imports/code
```

### 6. Simplify Component Structure

**Extract helpers outside component:**
```tsx
// ❌ Helper functions inside component (recreated on each render)
function MyComponent() {
  const parseData = (event) => { /* ... */ };
  const handleAction = () => { /* ... */ };
}

// ✅ Extract outside component
const parseData = (event) => { /* ... */ };

function MyComponent() {
  const handleAction = () => { /* ... */ };
}
```

**Use useMemo/useCallback only when needed:**
```tsx
// ❌ Unnecessary memoization
const handleClick = useCallback(() => {
  console.log("clicked");
}, []); // No dependencies, no need for useCallback

// ✅ Direct function
const handleClick = () => {
  console.log("clicked");
};

// ✅ Only memoize when passing to child components or expensive computations
const expensiveValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

## Common Patterns

### Pattern 1: Consolidating Refs

```tsx
// Before: Multiple refs
const ref1 = useRef(null);
const ref2 = useRef(null);
const ref3 = useRef(null);

// After: Single ref object
const refs = useRef({ ref1: null, ref2: null, ref3: null });
```

### Pattern 2: Simplifying Conditionals

```tsx
// Before: Repetitive if-else
if (type === "event" && isEditable === false) {
  // action A
} else if (type === "event-resize" && isEditable === false) {
  // action B (similar to A)
}

// After: Extract common condition
const isLocked = isEditable === false;
if (isLocked) {
  if (type === "event") {
    // action A
  } else if (type === "event-resize") {
    // action B
  }
}
```

### Pattern 3: Early Returns

```tsx
// Before: Nested conditions
function process(data) {
  if (data) {
    if (data.valid) {
      if (data.value) {
        // actual logic
      }
    }
  }
}

// After: Early returns
function process(data) {
  if (!data || !data.valid || !data.value) {
    return;
  }
  // actual logic
}
```

## Workflow

When simplifying code:

1. **Identify patterns:**
   - Multiple refs that could be combined
   - Repetitive conditional logic
   - Duplicate code across components
   - Unnecessary useEffects
   - Unused imports/variables

2. **Apply simplifications:**
   - Consolidate refs into objects
   - Extract common conditions
   - Use early returns
   - Extract shared logic to hooks/utilities
   - Remove unused code

3. **Verify:**
   - Run `pnpm typecheck` - no type errors
   - Run `pnpm lint` - no lint errors
   - Test functionality still works
   - Check for performance regressions

## Examples from Codebase

### Example: Simplifying Drag Handlers

**Current pattern (can be simplified):**
```tsx
const onDragStart = (event: DragStartEvent) => {
  const activeResult = ZCalendarDragData.safeParse(event.active.data.current);
  const activeData = activeResult.success ? activeResult.data : undefined;
  if (activeData?.type === "event" && activeData.event.isEditable === false) {
    toast.error("This event cannot be moved. It was created by someone else.");
    lockedDragRef.current = event.active.id as string;
  } else if (
    activeData?.type === "event-resize" &&
    activeData.event.isEditable === false
  ) {
    toast.error("This event cannot be resized. It was created by someone else.");
    lockedDragRef.current = event.active.id as string;
  } else {
    lockedDragRef.current = null;
  }
};
```

**Simplified:**
```tsx
const onDragStart = (event: DragStartEvent) => {
  const activeData = ZCalendarDragData.safeParse(event.active.data.current).data;
  const isLocked = activeData?.event.isEditable === false;
  
  if (isLocked && (activeData?.type === "event" || activeData?.type === "event-resize")) {
    const action = activeData.type === "event" ? "moved" : "resized";
    toast.error(`This event cannot be ${action}. It was created by someone else.`);
    lockedDragRef.current = event.active.id as string;
  } else {
    lockedDragRef.current = null;
  }
};
```

## Anti-Patterns to Avoid

### ❌ Over-optimization
Don't memoize everything - only when there's a measurable benefit.

### ❌ Premature abstraction
Don't extract code until you see clear duplication (rule of three).

### ❌ Breaking working code
Simplify incrementally and test after each change.

### ❌ Removing necessary complexity
Some complexity is inherent to the problem - don't oversimplify.

## Checklist

When simplifying React code:

- [ ] Identified all refs and consolidated where possible
- [ ] Simplified conditional logic with early returns
- [ ] Extracted duplicate code to shared utilities/hooks
- [ ] Removed unnecessary useEffects
- [ ] Removed unused imports, variables, and code
- [ ] Verified with `pnpm typecheck` and `pnpm lint`
- [ ] Tested functionality still works correctly
