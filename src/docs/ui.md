# UI Component Patterns

**CRITICAL:** We use Base UI (not Radix UI). Do NOT use `asChild` prop - it causes TypeScript errors.

## Popover

### ❌ Wrong
```tsx
<PopoverTrigger asChild><button>...</button></PopoverTrigger>
```

### ✅ Correct

**Pattern 1: Direct wrapping (default)**
```tsx
<Popover open={isOpen} onOpenChange={setIsOpen}>
  <PopoverTrigger>
    <Button>Open</Button>
  </PopoverTrigger>
  <PopoverContent>{/* content */}</PopoverContent>
</Popover>
```

**Pattern 2: Using render prop**
```tsx
<PopoverTrigger render={<Button>Open</Button>} />
```

**Pattern 3: With handle (for programmatic control)**
```tsx
<PopoverTrigger handle={handle} payload={{ data }}>
  <Button>Open</Button>
</PopoverTrigger>
```

## Tooltip (Base UI)

Base UI's TooltipTrigger does **not** support `asChild`. Use the **`render` prop** instead: it replaces the default trigger element (similar to asChild). You can pass either a **React element** or a **function** to `render`.

### Wrong
```tsx
<TooltipTrigger asChild>
  <button>Hover me</button>
</TooltipTrigger>
```

### Correct – render prop (element form, preferred)
```tsx
<Tooltip>
  <TooltipTrigger render={<button type="button" className="..." />}>
    Hover me
  </TooltipTrigger>
  <TooltipContent side="top">Tooltip text</TooltipContent>
</Tooltip>
```

### Correct – render prop (function form)
```tsx
<Tooltip>
  <TooltipTrigger
    render={(props) => (
      <button type="button" className="..." {...props}>
        Hover me
      </button>
    )}
  />
  <TooltipContent side="top">Tooltip text</TooltipContent>
</Tooltip>
```

The function form receives props (e.g. ref, event handlers) that must be spread onto your element. Prefer the element form unless you need access to the raw props.

## Composing Multiple Triggers (Tooltip + Popover)

When a single element needs to act as both a tooltip trigger and a popover trigger, **chain `render` props with React elements** instead of manually merging props. Base UI handles all prop merging, ref forwarding, and event handler composition internally.

### ❌ Wrong – manual prop merging with render functions
```tsx
<PopoverTrigger
  render={(popoverProps) => (
    <Tooltip>
      <TooltipTrigger
        render={(tooltipProps) => {
          // Manual merge: fragile, loses refs, type conflicts
          const merged = mergeProps(tooltipProps, popoverProps);
          return <button {...merged}>Click me</button>;
        }}
      />
      <TooltipContent>Info</TooltipContent>
    </Tooltip>
  )}
/>
```

### ✅ Correct – chained render elements
```tsx
<Tooltip>
  <TooltipTrigger
    render={
      <PopoverTrigger
        handle={handle}
        payload={payload}
        render={<button className="..." onClick={(e) => e.stopPropagation()} />}
      />
    }
  >
    Button content here
  </TooltipTrigger>
  <TooltipContent side="top">Tooltip text</TooltipContent>
</Tooltip>
```

The composition chain is: `TooltipTrigger → PopoverTrigger → <button>`. Base UI composes each layer's props (refs, event handlers, ARIA attributes) onto the final DOM element automatically. Children of `TooltipTrigger` become the content of the rendered `<button>`.

This pattern works for any combination of Base UI triggers (Tooltip + Popover, Tooltip + Dialog, etc.) and with custom elements like `motion.button` from Motion.

## Dialog

Same pattern as Popover - NO `asChild`:

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    {/* content */}
    <DialogClose>
      <Button>Close</Button>
    </DialogClose>
  </DialogContent>
</Dialog>
```

## Form Fields

**Do NOT nest `FormField` components.** If you need to align multiple form inputs side-by-side, use sibling `FormField`s inside a wrapper `div` (layout/classes on the wrapper and items are up to you).

### ❌ Wrong - Nested FormField
```tsx
<FormField
  name="title"
  render={({ field }) => (
    <FormItem>
      <FormControl>
        <div>
          <FormField
            name="color"
            render={({ field: colorField }) => (
              <FormItem>
                <FormControl>
                  <ColorPicker {...colorField} />
                </FormControl>
              </FormItem>
            )}
          />
          <Input {...field} />
        </div>
      </FormControl>
    </FormItem>
  )}
/>
```

### ✅ Correct - Sibling FormFields with wrapper div
```tsx
<div>
  <FormField
    name="color"
    render={({ field }) => (
      <FormItem>
        <FormControl>
          <ColorPicker {...field} />
        </FormControl>
      </FormItem>
    )}
  />
  <FormField
    name="title"
    render={({ field }) => (
      <FormItem>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</div>
```

## TanStack Form

- **Form hook:** Use `useAppForm` from `@/components/ui/form` (same API as TanStack Form's `useForm`; supports validators, defaultValues, onSubmit).
- **Field components:** Registered in `form.ts` and used inside `form.AppField`: e.g. `form.AppField name="title" children={(field) => <field.TextField label="Title" placeholder="..." />}`. Custom components live in [src/components/ui/form-components.tsx](src/components/ui/form-components.tsx) and use `useFieldContext()` from `@/components/ui/form`.
- **Form components:** e.g. `form.SubmitButton` used inside `form.AppForm`; they use `useFormContext()` from `@/components/ui/form`.
- **Reference:** [TanStack Form Composition](https://tanstack.com/form/latest/docs/framework/react/guides/form-composition), [shadcn TanStack Form](https://ui.shadcn.com/docs/forms/tanstack-form).

### Zod validation (superRefine)

This follows the general preference (see AGENTS.md) for **linear conditional logic** via early returns. In Zod `superRefine`, handle each case and return (or return after adding an issue); then run the next check. Example:

```ts
.superRefine((data, ctx) => {
  if (data.allDay) {
    if (data.startDate > data.endDate) {
      ctx.addIssue({ code: "custom", message: "...", path: ["endDate"] });
    }
    return;
  }

  if (!data.startTime || !data.endTime) {
    return ctx.addIssue({ code: "custom", message: "...", path: ["startTime"] });
  }

  const startDateTime = new Date(data.startDate);
  startDateTime.setHours(data.startTime.hour, data.startTime.minute, 0, 0);
  const endDateTime = new Date(data.endDate);
  endDateTime.setHours(data.endTime.hour, data.endTime.minute, 0, 0);
  if (startDateTime >= endDateTime) {
    ctx.addIssue({ code: "custom", message: "Start must be before end", path: ["endTime"] });
  }
});
```

### Auto-focusing fields

TanStack Form doesn't have a built-in `autoFocus` prop. Use a **callback ref** on the input component to focus when the field mounts:

```tsx
<form.AppField name="title">
	{(field) => (
		<Input
			ref={(el) => {
				// Focus when creating a new event
				if (mode === "create" && el) {
					setTimeout(() => {
						el.focus();
					}, 0);
				}
			}}
			value={field.state.value}
			onChange={(e) => field.handleChange(e.target.value)}
		/>
	)}
</form.AppField>
```

The callback ref runs when the Input mounts, and `setTimeout` ensures the popover/form is fully rendered before focusing.

## Shared Popover with handle

To open the **same** popover from multiple triggers (e.g. month day cells and day/week time slots):

1. Create one handle at the parent that renders the popover: e.g. `const handle = useRef(Popover.createHandle()).current` (from `@base-ui/react`).
2. Render a single popover component that receives `handle` and renders content based on payload.
3. Pass `handle` to all child views. Each trigger uses `PopoverTrigger` with `handle`, unique `id`, and `payload` (e.g. `payload={{ date, time: { hour, minute } }}`).
4. The popover content can read payload (e.g. `date`, optional `time`) to set initial form values.

## Popover + form (submit on close/unmount)

When a form lives inside a popover, you may want to submit only when the form is dirty, on close or unmount.

### Submit dirty form on popover close/unmount

- **On close:** In the form content component, use a `useEffect` that depends on `isOpen`. Track the previous open state with a ref (e.g. `wasOpenRef`). When the effect sees a transition from open to closed (`wasOpenRef.current === true` and `isOpen === false`), if the form is dirty, call `form.handleSubmit()`. Otherwise call `form.reset(...)`. Use a ref for dirty state so effects can read it synchronously (see below).
- **On unmount:** In the same effect’s cleanup, if the form is dirty, call `form.handleSubmit()` (fire-and-forget). Optionally guard `onSubmit` so it does not call the parent’s `onClose()` when submit was triggered from unmount (e.g. a ref set before `handleSubmit()` in cleanup and checked in `onSubmit`) to avoid setState on an unmounted parent.

### TanStack Form dirty tracking

Prefer **`form.store.subscribe` inside a `useEffect`** to keep a dirty ref in sync with form state (instead of `form.Subscribe` in JSX):

- In the effect: read initial dirty from `form.store.state.isDirty` and set `dirtyRef.current`. Subscribe with `form.store.subscribe(({ currentVal }) => { dirtyRef.current = currentVal.isDirty; })`. Return the unsubscribe from the effect so the subscription is cleaned up on unmount.
- This keeps dirty-tracking logic in one place, avoids an extra `form.Subscribe` in the tree, and ties the subscription to the component lifecycle.

### Clearing external store on unmount

If a “sync” effect (e.g. form values → calendar store) pushes to an external store but has no cleanup, that store can keep stale data after the form/popover unmounts. In the same component’s **unmount cleanup** (e.g. the same effect that optionally submits on unmount), **clear the external store** by calling the same triggers with default/empty values so UI (e.g. a day cell preview) does not show stale data.

## Responsiveness

**Do NOT handle responsiveness unless specifically asked.** Assume desktop viewport size for all UI work.

## DialogFooter

**Do NOT add `className` for spacing buttons in `DialogFooter`.** Buttons are automatically spaced.

### ❌ Wrong
```tsx
<DialogFooter className="gap-2">
  <Button variant="outline">Cancel</Button>
  <Button>Save</Button>
</DialogFooter>
```

### ✅ Correct
```tsx
<DialogFooter>
  <Button variant="outline">Cancel</Button>
  <Button>Save</Button>
</DialogFooter>
```

## Alert Dialog (Global)

Use the `dialogStore` from `@/lib/dialog-store` for global alert and confirm dialogs. No need to render dialog components manually.

### Alert Dialog (single button)
```tsx
import { dialogStore } from "@/lib/dialog-store";

// Trigger an alert
dialogStore.send({
  type: "openAlertDialog",
  title: "Success",
  description: "Your changes have been saved.",
  confirmText: "OK", // optional, defaults to "OK"
  onConfirm: () => {
    // optional callback when user clicks confirm
  },
});
```

### Confirm Dialog (two buttons)
```tsx
import { dialogStore } from "@/lib/dialog-store";

// Trigger a confirm dialog
dialogStore.send({
  type: "openConfirmDialog",
  title: "Delete Event",
  description: "Are you sure you want to delete this event? This action cannot be undone.",
  confirmText: "Delete", // optional, defaults to "Continue"
  cancelText: "Cancel", // optional, defaults to "Cancel"
  onConfirm: () => {
    // handle confirm action
  },
  onCancel: () => {
    // optional callback when user clicks cancel
  },
});
```

### Closing the dialog programmatically
```tsx
dialogStore.send({ type: "closeDialog" });
```

## Toast Configuration

**Global default duration:** Toasts default to 3000ms (3 seconds). Configure in `src/components/ui/sonner.tsx`:

```tsx
toastOptions={{
  duration: 3000, // Default duration for all toasts
  classNames: {
    toast: "cn-toast",
  },
}}
```

Individual toasts can override this by passing a `duration` option:

```tsx
toast.error("Message", { duration: 5000 }); // Override to 5 seconds
```

**Toast behavior:** By default, each toast call creates a new notification. To update the same toast, pass an `id`:

```tsx
// New toast each time
toast.error("Message");

// Updates same toast if called again with same id
toast.error("Updated message", { id: "unique-id" });
```

## Combobox (Base UI)

Base UI Combobox expects **full item objects** as values, not primitive IDs. Use `itemToStringValue`, `itemToStringLabel`, and `isItemEqualToValue` to handle object-to-ID conversion and filtering.

### ❌ Wrong - Using primitive IDs
```tsx
<Combobox
  items={calendars}
  value={field.state.value} // ID string
  onValueChange={(value) => field.handleChange(value)} // Expects ID
>
  {calendars.map((calendar) => (
    <ComboboxItem key={calendar.id} value={calendar.id}>
      {calendar.name}
    </ComboboxItem>
  ))}
</Combobox>
```

### ✅ Correct - Using full objects with filtering
```tsx
const selectedCalendar = calendars?.find(
  (cal) => cal.id === field.state.value,
);

<Combobox
  items={calendars ?? []}
  value={selectedCalendar ?? null} // Full object
  onValueChange={(value) => {
    field.handleChange(value === null ? undefined : value.id);
  }}
  itemToStringValue={(item) => item.id}
  itemToStringLabel={(item) => item.name}
  isItemEqualToValue={(item, value) => item.id === value.id}
>
  <ComboboxInput placeholder="Type calendar name" />
  <ComboboxEmpty>No calendars found</ComboboxEmpty>
  <ComboboxList>
    {(calendar) => (
      <ComboboxItem key={calendar.id} value={calendar}>
        {calendar.name}
      </ComboboxItem>
    )}
  </ComboboxList>
</Combobox>
```

**Why:** Base UI Combobox works with object references for value matching. `itemToStringValue` extracts the ID for form submission, `itemToStringLabel` is used for filtering/searching (defaults to `itemToStringValue` if not provided), and `isItemEqualToValue` compares objects by ID. Use the render prop pattern `{(item) => ...}` in `ComboboxList` instead of `.map()` so Base UI can automatically filter items based on the input value.

## Icon Button Toggles

Use `Button` components with conditional icon rendering for toggle states. Different icons represent different states.

### ✅ Correct - Icon buttons for toggle states
```tsx
<form.AppField name="busy">
  {(field) => {
    const isBusy = field.state.value === "busy";
    return (
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => {
          field.handleChange(isBusy ? "free" : "busy");
        }}
        aria-label={isBusy ? "Busy" : "Free"}
      >
        {isBusy ? <Briefcase /> : <BriefcaseBusiness />}
      </Button>
    );
  }}
</form.AppField>
```

**Why:** Use `Button` with conditional icons for toggle states. Use `size="icon-sm"` for icon-only buttons (not `sm` or `icon-xs`). Always include `aria-label` for accessibility. Different icons (e.g., `BriefcaseBusiness` for empty/free, `Briefcase` for full/busy) clearly communicate state.

## Button and Toggle Icon Sizing

Both `Button` and `Toggle` components automatically size SVG icons via CSS selectors. Don't add explicit size classes to icons inside these components.

### Button Icon Sizing

Button sizes icons based on the button size variant:
- Default: `size-4` (16px)
- `xs`: `size-3` (12px)
- `sm`: `size-3.5` (14px)
- `2xs`: `size-2.5` (10px)

### Toggle Icon Sizing

Toggle uses `size-4` (16px) for all sizes by default.

### ❌ Wrong
```tsx
<Button size="sm">
  <Bold className="size-4" />
  Save
</Button>

<Toggle size="xs" aria-label="Bold">
  <Bold className="size-4" />
</Toggle>
```

### ✅ Correct
```tsx
<Button size="sm">
  <Bold />
  Save
</Button>

<Toggle size="xs" aria-label="Bold">
  <Bold />
</Toggle>
```

**Why:** Both components handle icon sizing automatically. Only add explicit size classes if you need a different size than the default.

## Quick Reference

| Component | Base UI ✅ | Radix UI ❌ |
|-----------|-----------|-------------|
| Trigger composition | Direct wrap or `render` prop | `asChild` prop |
| Multi-trigger composition | Chained `render` elements | Nested `asChild` |
| Close composition | Direct wrap | `asChild` prop |

---

*Updated: Feb 12, 2026*
