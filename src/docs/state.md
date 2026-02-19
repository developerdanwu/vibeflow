# Client state (XState Store)

Patterns for `createStoreHook` from `@xstate/store-react` (e.g. `useGlobalStore`, `useCalendar`).

The hook **always returns a tuple** `[selectedValue, store]`. Destructure to get the value or the store.

## Reading state

**When this applies:** You only need the selected value (e.g. for conditional render).

### Wrong

```tsx
const taskPanelOpen = useGlobalStore((s) => s.context.taskPanelOpen);
// taskPanelOpen is the tuple [value, store], so it's always truthy
{taskPanelOpen ? <Panel /> : null}  // Panel never closes
```

### Correct

```tsx
const [taskPanelOpen] = useGlobalStore((s) => s.context.taskPanelOpen);
{taskPanelOpen ? <Panel /> : null}
```

**Why:** The hook returns `[selectedValue, store]`. Assigning to one variable gives you the tuple; destructure to get the boolean (or other value) for conditionals.

## Sending events

**When this applies:** You need to call `send` from a component that uses the store hook.

The hook returns `[selectedValue, store]`. The snapshot (first argument to the selector) does not have a `send` property; `send` lives on the store instance (second element).

### Wrong

```tsx
const send = useGlobalStore((s) => s.send); // s is snapshot: no .send
send({ type: "toggleTaskPanel" });
```

### Correct

```tsx
const [, store] = useGlobalStore((s) => s.context.taskPanelOpen);
store.send({ type: "toggleTaskPanel" });
```

**Why:** The selector receives the store snapshot. Use the second element of the tuple when you only need to send events.

## Context updates in event handlers

**When this applies:** You add or change context in a store’s `on` handlers.

Return full context from handlers so TypeScript’s return type stays correct when context gains new keys.

### Wrong

```tsx
on: {
  openSidebar: () => ({ sidebarOpen: true }),
  toggleTaskPanel: (context) => ({ taskPanelOpen: !context.taskPanelOpen }),
},
```

After adding `taskPanelOpen` to context, types can require every handler to return the full context shape.

### Correct

```tsx
on: {
  openSidebar: (context) => ({ ...context, sidebarOpen: true }),
  closeSidebar: (context) => ({ ...context, sidebarOpen: false }),
  toggleTaskPanel: (context) => ({ ...context, taskPanelOpen: !context.taskPanelOpen }),
},
```

**Why:** Spreading `context` and overriding only the changed keys keeps the return type correct and avoids missing-property errors when context is extended.
