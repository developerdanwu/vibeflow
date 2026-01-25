# DayCell Quick-Add Event Popover

## Context

### Original Request
When clicking on a DayCell component in month view, open a popover to fill out a new event instead of navigating to the day view.

### Interview Summary
**Key Discussions**:
- **Approach**: Lightweight popover with quick-add form (NOT full dialog)
- **Navigation**: Replace existing navigate-to-day-view behavior entirely
- **Fields**: Title (required), Start Time (required), End Time (required), Description (optional, visible)
- **Time Input**: Use existing TimeInput component (react-aria, 12-hour format)
- **Default Times**: None - user must select both times
- **Validation**: End time must be after start time (show inline error)
- **Post-Submit**: Close popover immediately, no toast
- **No "More options" link**: Keep it simple

**Research Findings**:
- DayCell currently navigates to `/calendar` on click - this will be replaced
- Popover pattern exists using `@base-ui/react/popover`
- Can reuse `useAddEvent()` hook for Convex mutation
- Current `eventSchema` requires description - need modified schema for quick-add

### Metis Review
**Identified Gaps** (addressed):
- Description field handling → Show optional field in popover
- Time input format → Use existing TimeInput (react-aria, 12hr)
- Time validation → Show inline error if end time not after start time
- Schema mismatch → Create separate `quickAddEventSchema`

---

## Work Objectives

### Core Objective
Replace DayCell click behavior to open a quick-add event popover instead of navigating to day view.

### Concrete Deliverables
- `src/components/big-calendar/components/month-view/quick-add-event-popover.tsx` - New popover component
- `src/components/big-calendar/schemas.ts` - Add `quickAddEventSchema`
- `src/components/big-calendar/components/month-view/day-cell.tsx` - Modified to use popover

### Definition of Done
- [ ] Clicking DayCell opens popover with form fields
- [ ] Popover contains: Title, Start Time, End Time, Description
- [ ] Submit creates event via Convex (appears in calendar)
- [ ] Validation prevents submit when end time is not after start time
- [ ] Popover closes on successful submit
- [ ] Clicking outside popover closes it without saving
- [ ] No navigation to day view occurs

### Must Have
- Title field (required)
- Start Time picker (required, 12-hour format)
- End Time picker (required, 12-hour format)
- Description field (optional)
- Validation error display for time constraint
- Submit and Cancel buttons
- Auto-fill date from clicked cell
- Auto-default color to "blue"

### Must NOT Have (Guardrails)
- "More options" or "Full form" link
- Color picker or color selection
- Date pickers (date is implicit from clicked cell)
- Multi-day event support
- "View Day" navigation fallback
- Toast notifications on success
- Loading spinner during submit
- Confirmation dialog on submit
- Keyboard shortcuts to open popover
- Analytics tracking
- Timezone selector
- Recurring event options
- Calendar selection dropdown

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES (Vitest configured)
- **User wants tests**: Manual-only
- **Framework**: N/A

### If Manual QA Only

Each TODO includes detailed verification procedures using manual browser testing.

**Evidence Required:**
- Commands run with actual output
- Visual verification in browser
- Convex dashboard verification for created events

---

## Task Flow

```
Task 1 (Schema) → Task 2 (Popover Component) → Task 3 (DayCell Integration)
```

## Parallelization

| Task | Depends On | Reason |
|------|------------|--------|
| 1 | None | Schema is standalone |
| 2 | 1 | Needs schema for form validation |
| 3 | 2 | Needs popover component to integrate |

---

## TODOs

- [x] 1. Create Quick-Add Event Schema

  **What to do**:
  - Add `quickAddEventSchema` to `src/components/big-calendar/schemas.ts`
  - Include fields: `title` (required), `startTime` (required), `endTime` (required), `description` (optional)
  - Add custom refinement for time validation (end time must be after start time)
  - Export type `TQuickAddEventFormData`
  - Do NOT modify existing `eventSchema`

  **Must NOT do**:
  - Do not touch `eventSchema` - it's used elsewhere
  - Do not add date fields (date is passed separately)
  - Do not add color field (hardcoded to "blue")

  **Parallelizable**: NO (first task)

  **References**:

  **Pattern References**:
  - `src/components/big-calendar/schemas.ts:3-37` - Existing `eventSchema` with Zod validation pattern, shows refine() usage for cross-field validation

  **Type References**:
  - `src/components/big-calendar/schemas.ts:39` - `TEventFormData` type inference pattern using `z.infer<>`

  **Acceptance Criteria**:

  **Manual Verification:**
  - [ ] File saved without TypeScript errors
  - [ ] Run `pnpm check` - no linting errors in schemas.ts
  - [ ] Schema exports visible: `quickAddEventSchema`, `TQuickAddEventFormData`

  **Commit**: YES
  - Message: `feat(calendar): add quickAddEventSchema for day cell popover`
  - Files: `src/components/big-calendar/schemas.ts`
  - Pre-commit: `pnpm check`

---

- [x] 2. Create QuickAddEventPopover Component

  **What to do**:
  - Create new file `src/components/big-calendar/components/month-view/quick-add-event-popover.tsx`
  - Use `Popover`, `PopoverTrigger`, `PopoverContent` from `@/components/ui/popover`
  - Use `useDisclosure()` hook for open/close state
  - Use `react-hook-form` with `zodResolver(quickAddEventSchema)`
  - Include form fields: Title (Input), Start Time (TimeInput), End Time (TimeInput), Description (Textarea)
  - On submit: call `useAddEvent()` with form data + passed `date` prop + hardcoded `color: "blue"`
  - On success: close popover, reset form
  - Show inline validation errors below each field
  - Props interface: `{ children: React.ReactNode; date: Date }`

  **Must NOT do**:
  - No "More options" link
  - No color picker
  - No date pickers
  - No loading spinner
  - No success toast

  **Parallelizable**: NO (depends on Task 1)

  **References**:

  **Pattern References**:
  - `src/components/big-calendar/components/dialogs/add-event-dialog.tsx:48-318` - Full event dialog showing react-hook-form pattern, FormField usage, useDisclosure(), useAddEvent() integration
  - `src/components/ui/popover.tsx:1-91` - Popover component API (Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle)
  - `src/components/ui/single-day-picker.tsx:1-80` - Example of popover usage with form content

  **API/Type References**:
  - `src/components/big-calendar/hooks/use-add-event.ts` - `useAddEvent()` hook that transforms form data and calls Convex mutation
  - `src/components/ui/form.tsx` - Form, FormField, FormItem, FormLabel, FormControl, FormMessage components

  **Component References**:
  - `src/components/ui/input.tsx` - Input component with `data-invalid` prop support
  - `src/components/ui/time-input.tsx` - TimeInput component (react-aria, 12-hour format)
  - `src/components/ui/textarea.tsx` - Textarea component
  - `src/components/ui/button.tsx` - Button component

  **State Management References**:
  - `src/hooks/use-disclosure.ts` - `useDisclosure()` hook for open/close state management

  **Acceptance Criteria**:

  **Manual Verification:**
  - [ ] File created without TypeScript errors
  - [ ] Run `pnpm check` - no linting errors
  - [ ] Component renders in browser (will test in Task 3)

  **Commit**: YES
  - Message: `feat(calendar): create QuickAddEventPopover component`
  - Files: `src/components/big-calendar/components/month-view/quick-add-event-popover.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 3. Integrate Popover into DayCell

  **What to do**:
  - Modify `src/components/big-calendar/components/month-view/day-cell.tsx`
  - Remove `useNavigate` import and `navigate()` call
  - Remove `handleClick` function entirely
  - Import `QuickAddEventPopover` from `./quick-add-event-popover`
  - Wrap the day cell content with `<QuickAddEventPopover date={date}>` as trigger
  - Keep `setSelectedDate(date)` call (for calendar context sync)
  - Ensure clicking the day number button ALSO opens the popover (same behavior as clicking cell)

  **Must NOT do**:
  - Do not preserve navigation as alternative
  - Do not add conditional logic for popover vs navigation
  - Do not modify other components

  **Parallelizable**: NO (depends on Task 2)

  **References**:

  **Pattern References**:
  - `src/components/big-calendar/components/week-and-day-view/calendar-week-view.tsx:129-176` - Shows how AddEventDialog wraps clickable time blocks as trigger children
  - `src/components/big-calendar/components/month-view/day-cell.tsx:1-111` - Current DayCell implementation to be modified

  **Context References**:
  - `src/components/big-calendar/contexts/calendar-context.tsx` - `useCalendar()` hook providing `setSelectedDate`

  **Acceptance Criteria**:

  **Manual Verification:**
  - [ ] Start dev server: `pnpm dev` (in one terminal) + `npx convex dev` (in another terminal)
  - [ ] Open browser to `http://localhost:3000`
  - [ ] Navigate to month view calendar
  - [ ] Click on any day cell
  - [ ] Verify: Popover opens (NOT navigation to day view)
  - [ ] Verify: Popover contains Title, Start Time, End Time, Description fields
  - [ ] Fill in Title: "Test Event"
  - [ ] Select Start Time: 9:00 AM
  - [ ] Select End Time: 10:00 AM
  - [ ] Click Submit
  - [ ] Verify: Popover closes
  - [ ] Verify: Event appears on the calendar (Convex real-time sync)
  - [ ] Open Convex dashboard, verify event created with correct data
  - [ ] Test validation: Open popover, select End Time before Start Time, verify error appears
  - [ ] Test close: Open popover, click outside, verify popover closes without saving
  - [ ] Run `pnpm check` - no linting errors

  **Commit**: YES
  - Message: `feat(calendar): integrate quick-add popover into DayCell`
  - Files: `src/components/big-calendar/components/month-view/day-cell.tsx`
  - Pre-commit: `pnpm check`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(calendar): add quickAddEventSchema for day cell popover` | schemas.ts | `pnpm check` |
| 2 | `feat(calendar): create QuickAddEventPopover component` | quick-add-event-popover.tsx | `pnpm check` |
| 3 | `feat(calendar): integrate quick-add popover into DayCell` | day-cell.tsx | `pnpm check` + manual browser test |

---

## Success Criteria

### Verification Commands
```bash
pnpm check  # Expected: No errors
pnpm dev    # Expected: Dev server starts on localhost:3000
```

### Final Checklist
- [ ] Clicking DayCell opens popover (no navigation)
- [ ] Form has 4 fields: Title, Start Time, End Time, Description
- [ ] Submit disabled until Title + both times filled
- [ ] End time < Start time shows validation error
- [ ] Successful submit closes popover and shows new event
- [ ] Clicking outside closes popover
- [ ] No "More options" or "View Day" features
- [ ] No color picker visible
- [ ] Events created with color "blue"
- [ ] Keyboard accessible (Tab, Enter, Escape work)
