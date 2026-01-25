# Calendar Events CRUD Implementation

## Context

### Original Request
"Continue implementing the calendar and enable adding events to it simply and displaying them in the calendar"

### Interview Summary
**Key Discussions**:
- Calendar already displays events from Convex (READ is working)
- AddEventDialog exists but `onSubmit` does nothing (has "TO DO" comment)
- EditEventDialog uses a local `useUpdateEvent` hook that only updates local state
- Delete functionality has no UI connection
- User wants full CRUD (Add + Edit + Delete)
- User wants click-to-create on empty time slots AND Add button in header
- No optimistic updates needed - Convex subscriptions handle real-time sync
- No tests required - manual verification only

**Research Findings**:
- `src/routes/calendar.tsx:125` already calls `useQuery(api.events.getEventsByUser)` and transforms events
- Events use `IEvent` interface (numeric `id`, ISO string dates, `IUser` object)
- Convex events use `_id` (string), timestamps (numbers), `userId` (string)
- Transformation happens at lines 133-146 in calendar.tsx
- Click-to-create already wired up in day/week views (wraps time slots in AddEventDialog)
- CalendarHeader already has AddEventDialog wrapping an "Add Event" button
- `use-update-event.ts` only updates local state, not Convex

### Key Data Transformations
**IEvent (UI) → Convex Event:**
- `id` (number, hashed from _id) → `_id` (string, Convex ID)
- `startDate`/`endDate` (ISO strings) → `startDate`/`endDate` (timestamps in ms)
- `user: IUser` → `userId` (string)
- `color` → `color` (same)
- `description` → `description` (same)

---

## Work Objectives

### Core Objective
Wire existing calendar UI dialogs to Convex backend mutations to enable full event CRUD (Create, Read, Update, Delete).

### Concrete Deliverables
1. `useAddEvent` hook that calls `api.events.createEvent` mutation
2. Updated `AddEventDialog` that uses `useAddEvent` on submit
3. `useUpdateEvent` hook rewritten to call `api.events.updateEvent` mutation
4. `useDeleteEvent` hook that calls `api.events.deleteEvent` mutation
5. Delete button added to `EventDetailsDialog`
6. Remove demo warning banners from dialogs (they now work for real)

### Definition of Done
- [x] User can click empty time slot → dialog opens with prefilled date/time → submit creates event in Convex → event appears in calendar
- [x] User can click "Add Event" button → dialog opens → submit creates event in Convex
- [x] User can click event → view details → click Edit → modify → submit updates event in Convex
- [x] User can click event → view details → click Delete → event removed from Convex
- [x] No "This is for demonstration purposes only" warnings remain

### Must Have
- Events persist to Convex database
- Real-time sync (via existing Convex subscriptions)
- Proper error handling (toast notifications on failure)
- Loading states during mutations

### Must NOT Have (Guardrails)
- DO NOT implement optimistic updates (Convex handles this)
- DO NOT modify calendar views or rendering logic
- DO NOT change the event form fields or validation
- DO NOT add Google Calendar integration
- DO NOT add recurring event support
- DO NOT add reminder/notification features
- DO NOT write tests (per user request)

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES (Vitest)
- **User wants tests**: NO
- **Framework**: n/a

### Manual QA Procedures

Each TODO includes detailed verification steps using the development server and browser.

---

## Task Flow

```
Task 1 (useAddEvent hook)
    ↓
Task 2 (Wire AddEventDialog)
    ↓
Task 3 (Rewrite useUpdateEvent hook)
    ↓
Task 4 (Wire EditEventDialog) - depends on Task 3
    ↓
Task 5 (useDeleteEvent hook + Delete button)
    ↓
Task 6 (Remove demo warnings, final cleanup)
```

## Parallelization

| Task | Depends On | Reason |
|------|------------|--------|
| 1 | None | Foundation hook |
| 2 | 1 | Uses hook from Task 1 |
| 3 | None | Can run parallel to 1-2 |
| 4 | 3 | Uses rewritten hook |
| 5 | None | Can run parallel to 1-4 |
| 6 | 2, 4, 5 | Cleanup after all features work |

---

## TODOs

- [x] 1. Create `useAddEvent` hook for creating events in Convex

  **What to do**:
  - Create new file `src/components/big-calendar/hooks/use-add-event.ts`
  - Import `useMutation` from `convex/react` and `api` from `convex/_generated/api`
  - Create hook that wraps `api.events.createEvent` mutation
  - Accept form data matching `TEventFormData` schema, transform to Convex format:
    - Combine `startDate` + `startTime` into timestamp (ms)
    - Combine `endDate` + `endTime` into timestamp (ms)
    - Map `color` directly
    - Map `description` directly
    - Set `allDay: false` (default for time-specific events)
  - Return `{ addEvent, isLoading }` where `isLoading` tracks mutation state
  - Handle errors with try/catch, log or throw for upstream handling

  **Must NOT do**:
  - Don't add optimistic updates
  - Don't modify the form schema or validation

  **Parallelizable**: YES (with 3, 5)

  **References**:
  
  **Pattern References** (existing code to follow):
  - `src/components/big-calendar/hooks/use-update-event.ts:5-24` - Existing hook structure (will be rewritten but shows pattern)
  - `src/routes/calendar.tsx:133-146` - Event transformation pattern (Convex → IEvent)

  **API/Type References** (contracts to implement against):
  - `convex/events.ts:4-30` - `createEvent` mutation signature: `{ title, description?, startDate, endDate, calendarId?, color?, location?, allDay }`
  - `src/components/big-calendar/schemas.ts` - `TEventFormData` type (form input shape)
  - `convex/schema.ts:15-28` - Events table schema (target format)

  **Documentation References**:
  - Convex docs: https://docs.convex.dev/client/react#mutations - useMutation hook usage

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] File exists: `src/components/big-calendar/hooks/use-add-event.ts`
  - [ ] No TypeScript errors: Run `pnpm check` → passes
  - [ ] Hook exports `useAddEvent` function
  - [ ] Hook returns `{ addEvent, isLoading }` shape

  **Commit**: NO (groups with Task 2)

---

- [x] 2. Wire `AddEventDialog` to use `useAddEvent` hook

  **What to do**:
  - Open `src/components/big-calendar/components/dialogs/add-event-dialog.tsx`
  - Import `useAddEvent` from the new hook file
  - Replace the empty `onSubmit` function (lines 47-51) with:
    - Call `addEvent()` with transformed form values
    - Handle success: close dialog, reset form
    - Handle errors: show toast notification (use existing toast from shadcn/ui if available)
  - Add loading state to submit button (disable while `isLoading`)
  - Remove the "Responsible" (user) field from the form - Convex mutation gets userId from auth

  **Must NOT do**:
  - Don't change form validation schema
  - Don't modify date/time picker components
  - Don't add new form fields

  **Parallelizable**: NO (depends on Task 1)

  **References**:

  **Pattern References**:
  - `src/components/big-calendar/components/dialogs/edit-event-dialog.tsx:54-76` - Similar onSubmit pattern with date/time combination

  **API/Type References**:
  - `src/components/big-calendar/schemas.ts` - Form schema for validation
  - `src/components/big-calendar/components/dialogs/add-event-dialog.tsx:47-51` - Current empty onSubmit (TO DO comment)

  **UI Component References**:
  - `src/components/ui/button.tsx` - Button component for loading state

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Start dev server: `pnpm dev` (in one terminal) + `npx convex dev` (in another)
  - [ ] Navigate to `http://localhost:3000/calendar`
  - [ ] Click "Add Event" button in header
  - [ ] Fill form: Title="Test Event", pick today's date, start time 10:00 AM, end time 11:00 AM, color=Blue
  - [ ] Click "Create Event" button
  - [ ] Verify: Dialog closes
  - [ ] Verify: Event appears in calendar (may need to navigate to correct view/date)
  - [ ] Verify: Refresh page → event still present (persisted to Convex)
  - [ ] Verify: Convex dashboard shows event in `events` table

  **Commit**: YES
  - Message: `feat(calendar): wire AddEventDialog to Convex createEvent mutation`
  - Files: `src/components/big-calendar/hooks/use-add-event.ts`, `src/components/big-calendar/components/dialogs/add-event-dialog.tsx`

---

- [x] 3. Rewrite `useUpdateEvent` hook to call Convex mutation

  **What to do**:
  - Open `src/components/big-calendar/hooks/use-update-event.ts`
  - Replace local state update with Convex `api.events.updateEvent` mutation
  - The hook receives full `IEvent` object from edit dialog
  - Need to:
    - Extract Convex event `_id` from UI event - CHALLENGE: UI uses numeric hash, not original `_id`
    - SOLUTION: Store original `_id` in IEvent interface or pass it through
    - Transform dates from ISO strings to timestamps
  - Return `{ updateEvent, isLoading }`

  **Important Design Decision**:
  The current `IEvent.id` is a numeric hash of `_id` (see `calendar.tsx:136`). To update, we need the real Convex `_id`. 
  
  **Recommended approach**: Add `convexId: string` to `IEvent` interface and populate it in the transformation. This is minimally invasive.

  **Must NOT do**:
  - Don't change how events are rendered
  - Don't modify calendar views

  **Parallelizable**: YES (with 1, 5)

  **References**:

  **Pattern References**:
  - `src/components/big-calendar/hooks/use-update-event.ts` - Current implementation (local state only)
  - `src/routes/calendar.tsx:133-146` - Where IEvent is created from Convex data (add convexId here)

  **API/Type References**:
  - `convex/events.ts:32-72` - `updateEvent` mutation signature
  - `src/components/big-calendar/interfaces.ts:9-17` - IEvent interface (needs convexId field)

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] No TypeScript errors: `pnpm check` → passes
  - [ ] File updated: `src/components/big-calendar/hooks/use-update-event.ts`
  - [ ] Interface updated: `src/components/big-calendar/interfaces.ts` includes `convexId?: string`
  - [ ] Transformation updated: `src/routes/calendar.tsx` populates `convexId`

  **Commit**: NO (groups with Task 4)

---

- [x] 4. Verify EditEventDialog works with rewritten hook

  **What to do**:
  - The `EditEventDialog` already calls `useUpdateEvent` (line 38)
  - After Task 3, it should automatically work with Convex
  - Verify the date/time transformation in `onSubmit` (lines 59-63) produces correct timestamps
  - May need minor adjustments to pass `convexId` to the mutation
  - Remove demo warning banner (lines 85-89)

  **Must NOT do**:
  - Don't restructure the dialog
  - Don't change form fields

  **Parallelizable**: NO (depends on Task 3)

  **References**:

  **Pattern References**:
  - `src/components/big-calendar/components/dialogs/edit-event-dialog.tsx:54-76` - Current onSubmit implementation

  **API/Type References**:
  - `convex/events.ts:32-72` - updateEvent mutation args

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Start dev server if not running
  - [ ] Navigate to `http://localhost:3000/calendar`
  - [ ] Ensure at least one event exists (create one if needed)
  - [ ] Click on an existing event to open details dialog
  - [ ] Click "Edit" button
  - [ ] Change title to "Updated Event Title"
  - [ ] Change color to a different color
  - [ ] Click "Save changes"
  - [ ] Verify: Dialog closes
  - [ ] Verify: Event shows updated title and color in calendar
  - [ ] Verify: Refresh page → changes persist
  - [ ] Verify: Convex dashboard shows updated event

  **Commit**: YES
  - Message: `feat(calendar): wire EditEventDialog to Convex updateEvent mutation`
  - Files: `src/components/big-calendar/hooks/use-update-event.ts`, `src/components/big-calendar/interfaces.ts`, `src/routes/calendar.tsx`, `src/components/big-calendar/components/dialogs/edit-event-dialog.tsx`

---

- [x] 5. Create `useDeleteEvent` hook and add Delete button to EventDetailsDialog

  **What to do**:
  - Create new file `src/components/big-calendar/hooks/use-delete-event.ts`
  - Hook wraps `api.events.deleteEvent` mutation
  - Accepts event `convexId` (string), calls mutation with `{ id: convexId }`
  - Returns `{ deleteEvent, isLoading }`
  
  - Open `src/components/big-calendar/components/dialogs/event-details-dialog.tsx`
  - Import `useDeleteEvent` hook
  - Add Delete button next to Edit button in DialogFooter (line 65-70)
  - Style Delete button with `variant="destructive"`
  - On click: call `deleteEvent(event.convexId)`, close dialog on success
  - Add confirmation before delete (optional but recommended - use AlertDialog)

  **Must NOT do**:
  - Don't allow delete without confirmation
  - Don't modify event display in the details view

  **Parallelizable**: YES (with 1, 3)

  **References**:

  **Pattern References**:
  - `src/components/big-calendar/hooks/use-update-event.ts` - Similar hook structure
  - `src/components/big-calendar/components/dialogs/event-details-dialog.tsx:65-70` - DialogFooter where Delete button goes

  **API/Type References**:
  - `convex/events.ts:74-95` - `deleteEvent` mutation: `{ id: v.id("events") }`

  **UI Component References**:
  - `src/components/ui/button.tsx` - Button with `variant="destructive"`
  - Consider: `src/components/ui/alert-dialog.tsx` for delete confirmation (if exists)

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] File exists: `src/components/big-calendar/hooks/use-delete-event.ts`
  - [ ] No TypeScript errors: `pnpm check` → passes
  - [ ] Navigate to `http://localhost:3000/calendar`
  - [ ] Click on an existing event
  - [ ] Verify: Delete button visible in details dialog (red/destructive style)
  - [ ] Click Delete button
  - [ ] Verify: Confirmation appears (if implemented) → confirm
  - [ ] Verify: Event removed from calendar view
  - [ ] Verify: Refresh page → event stays deleted
  - [ ] Verify: Convex dashboard → event removed from `events` table

  **Commit**: YES
  - Message: `feat(calendar): add delete event functionality`
  - Files: `src/components/big-calendar/hooks/use-delete-event.ts`, `src/components/big-calendar/components/dialogs/event-details-dialog.tsx`

---

- [x] 6. Remove demo warnings and final cleanup

  **What to do**:
  - Open `src/components/big-calendar/components/dialogs/add-event-dialog.tsx`
  - Remove the AlertTriangle warning message (lines 67-71)
  - Update DialogDescription to something helpful or remove entirely
  
  - Open `src/components/big-calendar/components/dialogs/edit-event-dialog.tsx`
  - Remove the AlertTriangle warning message (lines 85-89)
  - Update DialogDescription similarly
  
  - Remove the "Responsible" user selector from AddEventDialog since userId comes from auth
  - (It's already removed from form submission, but the UI field may still show)
  
  - Run `pnpm check` to ensure no lint/type errors
  - Run `pnpm build` to verify production build works

  **Must NOT do**:
  - Don't change functional code
  - Don't remove useful form fields

  **Parallelizable**: NO (final task, depends on 2, 4, 5)

  **References**:

  **File References**:
  - `src/components/big-calendar/components/dialogs/add-event-dialog.tsx:67-71` - Warning to remove
  - `src/components/big-calendar/components/dialogs/edit-event-dialog.tsx:85-89` - Warning to remove

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] No yellow warning triangles visible in Add Event dialog
  - [ ] No yellow warning triangles visible in Edit Event dialog
  - [ ] No "demonstration purposes only" text visible anywhere
  - [ ] `pnpm check` → passes with no errors
  - [ ] `pnpm build` → succeeds
  - [ ] Full flow test:
    1. Create event via Add button → works
    2. Create event via click-on-time-slot → works
    3. View event details → works
    4. Edit event → works, changes persist
    5. Delete event → works, event gone

  **Commit**: YES
  - Message: `chore(calendar): remove demo warnings and cleanup`
  - Files: `src/components/big-calendar/components/dialogs/add-event-dialog.tsx`, `src/components/big-calendar/components/dialogs/edit-event-dialog.tsx`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 2 | `feat(calendar): wire AddEventDialog to Convex createEvent mutation` | use-add-event.ts, add-event-dialog.tsx | Create event, verify in Convex |
| 4 | `feat(calendar): wire EditEventDialog to Convex updateEvent mutation` | use-update-event.ts, interfaces.ts, calendar.tsx, edit-event-dialog.tsx | Edit event, verify changes persist |
| 5 | `feat(calendar): add delete event functionality` | use-delete-event.ts, event-details-dialog.tsx | Delete event, verify removal |
| 6 | `chore(calendar): remove demo warnings and cleanup` | add-event-dialog.tsx, edit-event-dialog.tsx | Build passes, no warnings |

---

## Success Criteria

### Verification Commands
```bash
pnpm check    # Expected: No errors
pnpm build    # Expected: Build succeeds
pnpm dev      # Start dev server for manual testing
```

### Final Checklist
- [x] Can create events via Add button
- [x] Can create events via click-on-time-slot (day/week views)
- [x] Events persist to Convex and survive page refresh
- [x] Can edit existing events, changes persist
- [x] Can delete events with confirmation
- [x] No demo/warning banners remain
- [x] Build passes with no errors
- [x] All TypeScript types correct
