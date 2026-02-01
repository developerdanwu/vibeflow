# Event Edit Popover - Replace EventDetailsDialog

## TL;DR

> **Quick Summary**: Replace the read-only EventDetailsDialog with an edit popover that is identical to the create popover. Users click an event, see a pre-filled form, make changes, and changes auto-save on close.
> 
> **Deliverables**:
> - Refactored `QuickAddEventPopover` → `EventPopover` supporting create/edit modes
> - Delete button with confirmation in edit popover (top-right trash icon)
> - Migration of 3 components from EventDetailsDialog to EventPopover
> - Removal of EventDetailsDialog
> 
> **Estimated Effort**: Medium (3-5 hours)
> **Parallel Execution**: NO - sequential (each task depends on previous)
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6

---

## Context

### Original Request
> "for the event detail section actually i want to make the UI IDENTICAL to the create event popover and not open up in a dialog. I want the values pre-filled and then they exit the popover, update the event details."

### Interview Summary
**Key Discussions**:
- Auto-save on close: User confirmed same behavior as create popover
- Delete button: Yes, top-right corner with trash icon and confirmation dialog
- Concurrent popovers: Close current (auto-save if dirty), then open edit
- Calendar store sync: Skip for edit mode (event already visible on calendar)

**Research Findings**:
- `QuickAddEventPopover` (542 lines) already has full form with TanStack Form, Zod validation, submit-on-close pattern
- `EventDetailsDialog` (129 lines) is read-only with only delete functionality
- `updateEvent` Convex mutation already exists with same field structure as `createEvent`
- EventDetailsDialog used in exactly 3 places: month-event-badge, event-block, agenda-event-card

### Metis Review
**Identified Gaps** (addressed):
- Concurrent popover handling: Resolved - close current and auto-save if dirty
- Calendar store sync decision: Resolved - skip for edit mode
- Delete button placement: Resolved - top-right trash icon
- Staged migration approach: Incorporated into plan with per-component commits

---

## Work Objectives

### Core Objective
Replace the read-only EventDetailsDialog with an edit-capable popover that shares the same UI as the create popover, with auto-save on close and delete functionality.

### Concrete Deliverables
- `src/components/big-calendar/components/event-popover.tsx` - Renamed/refactored component supporting create and edit modes
- Updated `month-event-badge.tsx` using EventPopover for edit
- Updated `event-block.tsx` using EventPopover for edit
- Updated `agenda-event-card.tsx` using EventPopover for edit
- Deleted `event-details-dialog.tsx`

### Definition of Done
- [ ] Clicking an event opens edit popover with pre-filled data
- [ ] Changes auto-save when popover closes (if form is dirty)
- [ ] Delete button shows confirmation, then deletes event
- [ ] Create flow still works identically (no regressions)
- [ ] All 3 integration points work (month, week/day, agenda views)
- [ ] `pnpm check` passes (typecheck + lint)

### Must Have
- Edit popover form identical to create popover
- Pre-filled form values from existing event data
- Auto-save on close (submit if dirty)
- Delete button with confirmation dialog (top-right trash icon)
- Works in all 3 views (month, week/day, agenda)

### Must NOT Have (Guardrails)
- MUST NOT add recurring event editing
- MUST NOT add event categories/tags
- MUST NOT add "save and create new" button
- MUST NOT add keyboard shortcuts
- MUST NOT add undo/redo functionality
- MUST NOT add event edit history
- MUST NOT add conflict resolution for concurrent edits
- MUST NOT change popover styling, animations, or layout
- MUST NOT improve form field spacing, typography, or design
- MUST NOT create over-abstractions (EventFormBase, useEventFormLogic, etc.)
- MUST NOT refactor calendar store while adding edit mode
- MUST NOT change adjacent code unrelated to this task

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES (vitest)
- **User wants tests**: Manual verification via Playwright browser
- **Framework**: vitest (existing), Playwright for browser verification

### Verification Approach

All acceptance criteria MUST be verified by agent using Playwright browser automation or terminal commands. NO steps like "user manually verifies".

---

## Execution Strategy

### Sequential Execution

```
Task 1: Refactor QuickAddEventPopover to EventPopover with edit mode
   ↓
Task 2: Add delete button to edit popover
   ↓
Task 3: Migrate month-event-badge.tsx
   ↓
Task 4: Migrate event-block.tsx
   ↓
Task 5: Migrate agenda-event-card.tsx
   ↓
Task 6: Delete EventDetailsDialog and cleanup
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|------------|--------|
| 1 | None | 2, 3, 4, 5 |
| 2 | 1 | 3, 4, 5 |
| 3 | 1, 2 | 6 |
| 4 | 1, 2 | 6 |
| 5 | 1, 2 | 6 |
| 6 | 3, 4, 5 | None |

---

## TODOs

- [x] 1. Refactor QuickAddEventPopover to support edit mode

  **What to do**:
  - Rename component from `QuickAddEventPopover` to `EventPopover`
  - Rename file from `quick-add-event-popover.tsx` to `event-popover.tsx`
  - Add `mode: 'create' | 'edit'` prop (default: 'create')
  - Add `event?: IEvent` prop for edit mode
  - Add `getEditDefaultValues(event: IEvent)` function to convert IEvent to form values
  - Conditionally call `createEvent` vs `updateEvent` based on mode
  - Skip calendar store sync (setNewEventTitle, setNewEventStartTime, setNewEventAllDay) when mode === 'edit'
  - Update all existing usages of QuickAddEventPopover to use new name/import

  **Must NOT do**:
  - MUST NOT change form layout or styling
  - MUST NOT add new form fields
  - MUST NOT create separate components for create/edit

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Focused refactoring task with clear boundaries
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Component refactoring with React/TypeScript patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Tasks 2, 3, 4, 5
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `src/components/big-calendar/components/month-view/quick-add-event-popover.tsx` - Current popover implementation to refactor
  - `src/components/big-calendar/components/month-view/quick-add-event-popover.tsx:133-154` - `getDefaultValues()` function pattern for create mode
  - `src/components/big-calendar/components/month-view/quick-add-event-popover.tsx:184-230` - `onSubmit` handler showing createEvent mutation call
  - `src/components/big-calendar/components/month-view/quick-add-event-popover.tsx:303-309` - Calendar store sync pattern (skip for edit)

  **API/Type References**:
  - `src/components/big-calendar/interfaces.ts:9-24` - IEvent interface with all fields for edit mode
  - `convex/events.ts:68-147` - updateEvent mutation signature and args

  **Test References**:
  - `convex/events.test.ts` - Existing event mutation tests

  **WHY Each Reference Matters**:
  - `quick-add-event-popover.tsx` - This is the file being refactored; understand its full structure
  - `getDefaultValues()` - Pattern for creating form defaults; need similar for edit mode
  - `onSubmit` handler - Shows how to call mutation; edit mode will conditionally call updateEvent
  - Calendar store sync - These listeners must be conditionally skipped in edit mode
  - `IEvent` interface - Defines fields available on event for pre-filling form
  - `updateEvent` mutation - API contract for edit mode submission

  **Acceptance Criteria**:

  **Automated Verification (Playwright browser):**
  ```
  # Test create flow still works (REGRESSION TEST):
  1. Navigate to: http://localhost:3000/calendar
  2. Click on empty day cell in month view
  3. Assert: Popover opens
  4. Fill: input for title with "Create Test Event"
  5. Click outside popover (close it)
  6. Wait 1 second for mutation
  7. Assert: Event badge appears with title "Create Test Event"
  8. Screenshot: .sisyphus/evidence/task-1-create-still-works.png
  ```

  **Terminal verification:**
  ```bash
  # Verify typecheck passes
  pnpm typecheck
  # Assert: Exit code 0, no errors
  
  # Verify no broken imports
  pnpm check
  # Assert: Exit code 0
  ```

  **Evidence to Capture:**
  - [ ] Screenshot showing create flow works after refactor
  - [ ] Terminal output of `pnpm check` passing

  **Commit**: YES
  - Message: `refactor(calendar): rename QuickAddEventPopover to EventPopover with edit mode support`
  - Files: `src/components/big-calendar/components/event-popover.tsx`, any files with updated imports
  - Pre-commit: `pnpm check`

---

- [x] 2. Add delete button to edit popover

  **What to do**:
  - Add delete button (Trash2 icon from lucide-react) in top-right corner of popover
  - Only show delete button when `mode === 'edit'` and `event?.convexId` exists
  - Use existing `dialogStore.send({ type: "openConfirmDialog" })` pattern for confirmation
  - Call `deleteEvent` mutation on confirm
  - Close popover after successful delete
  - Add `useDeleteEvent` hook or inline mutation (follow existing pattern)

  **Must NOT do**:
  - MUST NOT change delete confirmation dialog styling
  - MUST NOT add bulk delete functionality
  - MUST NOT add soft delete / archive

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small feature addition to existing component
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: UI component addition with proper patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Task 1)
  - **Blocks**: Tasks 3, 4, 5
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/components/big-calendar/components/dialogs/event-details-dialog.tsx:33-57` - Existing delete confirmation pattern using dialogStore
  - `src/components/big-calendar/hooks/use-delete-event.ts` - Existing delete event hook (if exists)

  **API/Type References**:
  - `src/lib/dialog-store.ts` - dialogStore for confirmation dialogs
  - `convex/events.ts:149-165` - deleteEvent mutation signature

  **External References**:
  - `lucide-react` - Trash2 icon for delete button

  **WHY Each Reference Matters**:
  - `event-details-dialog.tsx:33-57` - Copy this exact confirmation pattern for consistency
  - `dialog-store.ts` - API for showing confirmation dialog
  - `deleteEvent` mutation - Required args for delete operation

  **Acceptance Criteria**:

  **Automated Verification (Playwright browser):**
  ```
  # Test delete button appears in edit mode:
  1. Navigate to: http://localhost:3000/calendar
  2. Click on existing event badge
  3. Assert: Popover opens
  4. Assert: Trash icon button visible in top-right area of popover
  5. Screenshot: .sisyphus/evidence/task-2-delete-button-visible.png
  
  # Test delete confirmation flow:
  6. Click trash icon button
  7. Assert: Confirmation dialog appears with text "Delete Event" or similar
  8. Click cancel button in dialog
  9. Assert: Popover still open, event not deleted
  10. Click trash icon again
  11. Click confirm button
  12. Wait 1 second
  13. Assert: Event badge no longer visible in calendar
  14. Screenshot: .sisyphus/evidence/task-2-delete-confirmed.png
  ```

  **Evidence to Capture:**
  - [ ] Screenshot showing delete button in popover
  - [ ] Screenshot showing event deleted after confirmation

  **Commit**: YES
  - Message: `feat(calendar): add delete button to edit event popover`
  - Files: `src/components/big-calendar/components/event-popover.tsx`
  - Pre-commit: `pnpm check`

---

- [ ] 3. Migrate month-event-badge.tsx to use EventPopover

  **What to do**:
  - Replace `EventDetailsDialog` import with `EventPopover` components
  - Wrap the existing badge content with popover trigger pattern
  - Pass `mode="edit"` and `event={event}` props to popover
  - Remove EventDetailsDialog wrapper
  - Ensure drag-and-drop still works (DraggableEvent wrapper preserved)

  **Must NOT do**:
  - MUST NOT change badge styling or variants
  - MUST NOT change drag-and-drop behavior
  - MUST NOT change tooltip behavior

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Component integration task
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: React component integration

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 1, 2)
  - **Parallel Group**: Sequential
  - **Blocks**: Task 6
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `src/components/big-calendar/components/month-view/month-event-badge.tsx:141-182` - Current EventDetailsDialog usage to replace
  - `src/components/big-calendar/components/event-popover.tsx` - New popover component (from Task 1)

  **WHY Each Reference Matters**:
  - `month-event-badge.tsx:141-182` - This is the exact code being replaced; understand wrapper structure
  - `event-popover.tsx` - The replacement component with edit mode

  **Acceptance Criteria**:

  **Automated Verification (Playwright browser):**
  ```
  # Test edit from month view badge:
  1. Navigate to: http://localhost:3000/calendar
  2. Ensure month view is active
  3. Click on existing event badge in month view
  4. Assert: Popover opens (NOT dialog)
  5. Assert: Title field pre-filled with event title
  6. Assert: Date fields pre-filled
  7. Screenshot: .sisyphus/evidence/task-3-month-edit-popover.png
  
  # Test auto-save from month view:
  8. Change title to "Edited from Month View"
  9. Click outside popover to close
  10. Wait 1 second for mutation
  11. Assert: Event badge now shows "Edited from Month View"
  12. Screenshot: .sisyphus/evidence/task-3-month-edit-saved.png
  ```

  **Evidence to Capture:**
  - [ ] Screenshot showing edit popover from month badge
  - [ ] Screenshot showing edited title in badge

  **Commit**: YES
  - Message: `refactor(calendar): migrate month-event-badge to EventPopover`
  - Files: `src/components/big-calendar/components/month-view/month-event-badge.tsx`
  - Pre-commit: `pnpm check`

---

- [ ] 4. Migrate event-block.tsx to use EventPopover

  **What to do**:
  - Replace `EventDetailsDialog` import with `EventPopover` components
  - Wrap the existing block content with popover trigger pattern
  - Pass `mode="edit"` and `event={event}` props to popover
  - Remove EventDetailsDialog wrapper
  - Ensure resize and drag behavior still works

  **Must NOT do**:
  - MUST NOT change block styling or resize handles
  - MUST NOT change time display logic
  - MUST NOT change drag-and-drop behavior

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Component integration task (similar to Task 3)
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: React component integration

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 1, 2)
  - **Parallel Group**: Sequential
  - **Blocks**: Task 6
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `src/components/big-calendar/components/week-and-day-view/event-block.tsx:84-113` - Current EventDetailsDialog usage to replace
  - Task 3 implementation - Follow same pattern as month-event-badge migration

  **WHY Each Reference Matters**:
  - `event-block.tsx:84-113` - This is the exact code being replaced
  - Task 3 - Consistent migration pattern across components

  **Acceptance Criteria**:

  **Automated Verification (Playwright browser):**
  ```
  # Test edit from week/day view block:
  1. Navigate to: http://localhost:3000/calendar
  2. Switch to week or day view
  3. Click on existing event block
  4. Assert: Popover opens (NOT dialog)
  5. Assert: Title field pre-filled with event title
  6. Assert: Time fields pre-filled (if not all-day event)
  7. Screenshot: .sisyphus/evidence/task-4-block-edit-popover.png
  
  # Test auto-save from week/day view:
  8. Change title to "Edited from Week View"
  9. Click outside popover to close
  10. Wait 1 second
  11. Assert: Event block now shows "Edited from Week View"
  12. Screenshot: .sisyphus/evidence/task-4-block-edit-saved.png
  ```

  **Evidence to Capture:**
  - [ ] Screenshot showing edit popover from event block
  - [ ] Screenshot showing edited title in block

  **Commit**: YES
  - Message: `refactor(calendar): migrate event-block to EventPopover`
  - Files: `src/components/big-calendar/components/week-and-day-view/event-block.tsx`
  - Pre-commit: `pnpm check`

---

- [ ] 5. Migrate agenda-event-card.tsx to use EventPopover

  **What to do**:
  - Replace `EventDetailsDialog` import with `EventPopover` components
  - Wrap the existing card content with popover trigger pattern
  - Pass `mode="edit"` and `event={event}` props to popover
  - Remove EventDetailsDialog wrapper

  **Must NOT do**:
  - MUST NOT change card styling or layout
  - MUST NOT change agenda view sorting/grouping

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Component integration task (similar to Tasks 3, 4)
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: React component integration

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 1, 2)
  - **Parallel Group**: Sequential
  - **Blocks**: Task 6
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `src/components/big-calendar/components/agenda-view/agenda-event-card.tsx:83-131` - Current EventDetailsDialog usage to replace
  - Tasks 3, 4 implementation - Follow same pattern

  **WHY Each Reference Matters**:
  - `agenda-event-card.tsx:83-131` - This is the exact code being replaced
  - Tasks 3, 4 - Consistent migration pattern across all components

  **Acceptance Criteria**:

  **Automated Verification (Playwright browser):**
  ```
  # Test edit from agenda view card:
  1. Navigate to: http://localhost:3000/calendar
  2. Switch to agenda view
  3. Click on existing event card
  4. Assert: Popover opens (NOT dialog)
  5. Assert: Title field pre-filled with event title
  6. Screenshot: .sisyphus/evidence/task-5-agenda-edit-popover.png
  
  # Test auto-save from agenda view:
  7. Change title to "Edited from Agenda View"
  8. Click outside popover to close
  9. Wait 1 second
  10. Assert: Event card now shows "Edited from Agenda View"
  11. Screenshot: .sisyphus/evidence/task-5-agenda-edit-saved.png
  ```

  **Evidence to Capture:**
  - [ ] Screenshot showing edit popover from agenda card
  - [ ] Screenshot showing edited title in card

  **Commit**: YES
  - Message: `refactor(calendar): migrate agenda-event-card to EventPopover`
  - Files: `src/components/big-calendar/components/agenda-view/agenda-event-card.tsx`
  - Pre-commit: `pnpm check`

---

- [ ] 6. Delete EventDetailsDialog and final cleanup

  **What to do**:
  - Delete `src/components/big-calendar/components/dialogs/event-details-dialog.tsx`
  - Verify no remaining imports of EventDetailsDialog (use lsp_find_references)
  - Run full `pnpm check` to ensure no broken references
  - Verify all 3 views work end-to-end

  **Must NOT do**:
  - MUST NOT delete other files in dialogs folder
  - MUST NOT refactor unrelated code during cleanup

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple cleanup and verification
  - **Skills**: []
    - No special skills needed for file deletion

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final task)
  - **Blocks**: None
  - **Blocked By**: Tasks 3, 4, 5

  **References**:

  **Pattern References**:
  - `src/components/big-calendar/components/dialogs/event-details-dialog.tsx` - File to delete

  **WHY Each Reference Matters**:
  - This file should have zero usages after Tasks 3-5; safe to delete

  **Acceptance Criteria**:

  **Terminal verification:**
  ```bash
  # Verify file is deleted
  ls src/components/big-calendar/components/dialogs/event-details-dialog.tsx
  # Assert: "No such file or directory"
  
  # Verify no broken imports
  pnpm check
  # Assert: Exit code 0
  
  # Verify build succeeds
  pnpm build
  # Assert: Exit code 0
  ```

  **Automated Verification (Playwright browser):**
  ```
  # Final end-to-end verification:
  
  # Month view:
  1. Navigate to: http://localhost:3000/calendar
  2. Click event in month view → verify edit popover works
  
  # Week view:
  3. Switch to week view
  4. Click event block → verify edit popover works
  
  # Agenda view:
  5. Switch to agenda view
  6. Click event card → verify edit popover works
  
  # Create still works:
  7. Click empty cell → verify create popover works
  8. Screenshot: .sisyphus/evidence/task-6-final-verification.png
  ```

  **Evidence to Capture:**
  - [ ] Terminal output of `pnpm check` passing
  - [ ] Terminal output of `pnpm build` succeeding
  - [ ] Screenshot of final working state

  **Commit**: YES
  - Message: `chore(calendar): remove deprecated EventDetailsDialog`
  - Files: Delete `event-details-dialog.tsx`
  - Pre-commit: `pnpm check && pnpm build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `refactor(calendar): rename QuickAddEventPopover to EventPopover with edit mode support` | event-popover.tsx, import updates | pnpm check |
| 2 | `feat(calendar): add delete button to edit event popover` | event-popover.tsx | pnpm check |
| 3 | `refactor(calendar): migrate month-event-badge to EventPopover` | month-event-badge.tsx | pnpm check |
| 4 | `refactor(calendar): migrate event-block to EventPopover` | event-block.tsx | pnpm check |
| 5 | `refactor(calendar): migrate agenda-event-card to EventPopover` | agenda-event-card.tsx | pnpm check |
| 6 | `chore(calendar): remove deprecated EventDetailsDialog` | DELETE event-details-dialog.tsx | pnpm check && pnpm build |

---

## Success Criteria

### Verification Commands
```bash
pnpm check  # Expected: Exit code 0
pnpm build  # Expected: Exit code 0
```

### Final Checklist
- [ ] All "Must Have" present:
  - [ ] Edit popover form identical to create popover
  - [ ] Pre-filled form values from existing event data
  - [ ] Auto-save on close (submit if dirty)
  - [ ] Delete button with confirmation dialog (top-right trash icon)
  - [ ] Works in all 3 views (month, week/day, agenda)
- [ ] All "Must NOT Have" absent:
  - [ ] No recurring event editing
  - [ ] No new form fields or styling changes
  - [ ] No over-abstractions created
- [ ] All tests pass:
  - [ ] Create flow regression test passed
  - [ ] Edit flow works in all 3 views
  - [ ] Delete confirmation works
  - [ ] `pnpm check` passes
  - [ ] `pnpm build` succeeds
