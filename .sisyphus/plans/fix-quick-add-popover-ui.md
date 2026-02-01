# Fix Quick-Add Event Popover UI

## TL;DR

> **Quick Summary**: Restore the Quick-Add Event Popover UI that was broken during the TanStack Form migration. The popover is missing its header, submit/cancel buttons, and has incorrect styling/layout.
> 
> **Deliverables**: 
> - Restored popover with header "Quick Add Event"
> - Cancel and Create buttons in footer
> - Proper field labels, spacing, and width (w-80)
> - Functional form submission
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: NO - sequential (single file)
> **Critical Path**: Task 1 → Task 2 → Task 3

---

## Context

### Original Request
User reported the Quick-Add Event Popover UI is "off" after the transition to TanStack Form and wants it fixed to look like it was before.

### Interview Summary
**Key Discussions**:
- Compared current file with git history (commit `55d01ff` - pre-TanStack Form version)
- Identified specific UI elements missing/broken

**Research Findings**:
- This is the ONLY file using `useAppForm` - no other forms are affected
- `UI_SPEC.md` does not specify this component (no design conflict)
- The codebase has registered TanStack Form field components (`TextField`, `TimeField`, etc.) but current implementation uses low-level `form.AppField` with custom inline rendering
- PopoverHeader and PopoverTitle components exist in `@/components/ui/popover`

### Metis Review
**Identified Gaps** (addressed):
- Pattern compliance: Current code uses `form.AppField` with custom inline rendering rather than registered field components - acceptable for this complex layout
- Functional verification: Added acceptance criteria for form submission
- Accessibility: Labels exist but are inline with fields - maintain current accessibility approach
- No UI_SPEC.md conflict - this component is not documented there

---

## Work Objectives

### Core Objective
Restore the Quick-Add Event Popover to its pre-migration visual state while maintaining TanStack Form functionality.

### Concrete Deliverables
- `src/components/big-calendar/components/month-view/quick-add-event-popover.tsx` with restored UI

### Definition of Done
- [ ] Popover displays header "Quick Add Event"
- [ ] Cancel and Create buttons are visible and functional
- [ ] Popover width is w-80 (320px) instead of w-[480px]
- [ ] Input fields have standard styling (not ghost/invisible)
- [ ] Form submits successfully when Create is clicked
- [ ] Popover closes after successful submission
- [ ] `pnpm check` passes

### Must Have
- PopoverHeader with title "Quick Add Event"
- Footer with Cancel and Create (submit) buttons
- Width changed from w-[480px] to w-80
- Standard input styling (remove ghost variant and rounded-none)
- Proper spacing between form elements (gap-3)

### Must NOT Have (Guardrails)
- DO NOT change form validation logic or schema
- DO NOT change form submission logic (createEvent mutation)
- DO NOT change the calendar store sync behavior (StoreSyncEffect)
- DO NOT modify any files outside quick-add-event-popover.tsx
- DO NOT change the Popover handle/anchor pattern
- DO NOT add new dependencies

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES (vitest configured)
- **User wants tests**: Manual verification via browser
- **Framework**: vitest (but this is UI - browser verification preferred)

### Automated Verification (Browser + CLI)

**For this UI change, verification uses:**

1. **Build verification** (CLI):
   ```bash
   pnpm check
   # Assert: Exit code 0, no errors
   ```

2. **Visual verification** (playwright skill):
   ```
   # Agent executes via playwright browser automation:
   1. Navigate to: http://localhost:3000/calendar (or wherever calendar is)
   2. Click on a day cell to trigger quick-add popover
   3. Assert: PopoverTitle "Quick Add Event" is visible
   4. Assert: Button with text "Create" is visible
   5. Assert: Button with text "Cancel" is visible
   6. Assert: Popover width is approximately 320px (w-80)
   7. Fill: title input with "Test Event"
   8. Click: "Create" button
   9. Assert: Popover closes
   10. Screenshot: .sisyphus/evidence/quick-add-popover-fixed.png
   ```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Sequential - single file):
└── Task 1: Restore PopoverHeader and structure
└── Task 2: Add form footer with buttons
└── Task 3: Fix styling (width, inputs, spacing)

Critical Path: All tasks in same file, sequential
```

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2, 3 | Single agent - category="quick", load_skills=["frontend-ui-ux"] |

---

## TODOs

- [ ] 1. Restore PopoverHeader and basic structure

  **What to do**:
  - Add `PopoverHeader` and `PopoverTitle` imports from `@/components/ui/popover`
  - Wrap PopoverContent inner content with proper structure:
    - `<PopoverHeader><PopoverTitle>Quick Add Event</PopoverTitle></PopoverHeader>`
    - Form content below header
  - Change PopoverContent className from `w-[480px]` to `w-80`
  - Remove `min-w-0 overflow-hidden p-0` - use default padding

  **Must NOT do**:
  - DO NOT change form.Subscribe or StoreSyncEffect logic
  - DO NOT change the schema or validation

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple structural changes to a single file
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: UI component structure expertise

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 1 of 3)
  - **Blocks**: Task 2, Task 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/components/ui/popover.tsx:56-75` - PopoverHeader and PopoverTitle component definitions
  - Git commit `55d01ff` lines 84-88 - Previous structure with PopoverHeader:
    ```tsx
    <PopoverContent className="w-80" side="right" align="start">
      <PopoverHeader>
        <PopoverTitle>Quick Add Event</PopoverTitle>
      </PopoverHeader>
    ```

  **Current File Reference**:
  - `src/components/big-calendar/components/month-view/quick-add-event-popover.tsx:239-244` - Current PopoverContent (no header, wrong width)

  **Acceptance Criteria**:

  ```bash
  # Agent runs:
  grep -n "PopoverHeader" src/components/big-calendar/components/month-view/quick-add-event-popover.tsx
  # Assert: Returns line number (import exists)
  
  grep -n "PopoverTitle" src/components/big-calendar/components/month-view/quick-add-event-popover.tsx
  # Assert: Returns line number (component used)
  
  grep "w-80" src/components/big-calendar/components/month-view/quick-add-event-popover.tsx
  # Assert: Returns match (width changed)
  ```

  **Commit**: NO (group with Task 2 and 3)

---

- [ ] 2. Add form footer with Cancel and Create buttons

  **What to do**:
  - Add a footer section after the form fields (inside the form element)
  - Add Cancel button: `<Button type="button" variant="outline" onClick={onClose}>Cancel</Button>`
  - Add Create/Submit button: Either use `<form.SubmitButton label="Create" />` OR manual `<Button type="submit">Create</Button>`
  - Style footer with flexbox: `<div className="flex justify-end gap-2 pt-2">...</div>`
  - Import `Button` from `@/components/ui/button` if not already imported

  **Must NOT do**:
  - DO NOT change form submission logic in onSubmit handler
  - DO NOT add loading states beyond what SubmitButton provides

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Adding standard button pattern
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: UI component composition

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 2 of 3)
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - Git commit `55d01ff` lines 165-171 - Previous button structure:
    ```tsx
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit">Create</Button>
    </div>
    ```
  - `src/components/ui/form-components.tsx:232-256` - SubmitButton component (alternative approach)
  - `src/components/ui/button.tsx` - Button component with variants

  **Current File Reference**:
  - `src/components/big-calendar/components/month-view/quick-add-event-popover.tsx:472-474` - Form ends without buttons

  **Acceptance Criteria**:

  ```bash
  # Agent runs:
  grep -n "Cancel" src/components/big-calendar/components/month-view/quick-add-event-popover.tsx
  # Assert: Returns line number (Cancel button exists)
  
  grep -n 'type="submit"' src/components/big-calendar/components/month-view/quick-add-event-popover.tsx
  # Assert: Returns line number (Submit button exists)
  ```

  **Commit**: NO (group with Task 1 and 3)

---

- [ ] 3. Fix field styling and spacing

  **What to do**:
  - Remove `variant="ghost"` from Input and Textarea components
  - Remove `rounded-none` class from Input and Textarea
  - Remove `hover:bg-transparent focus:bg-transparent focus-visible:bg-transparent` classes
  - Add consistent spacing to form: change `className="grid"` to `className="grid gap-3"`
  - Ensure FieldLabel components are visible (not sr-only)
  - Keep the current layout structure (date/time row, color+title row, description)

  **Must NOT do**:
  - DO NOT change the inline date/time/all-day layout structure
  - DO NOT change field validation behavior
  - DO NOT remove the color picker functionality

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: CSS class modifications
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Styling expertise

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 3 of 3)
  - **Blocks**: None (final task)
  - **Blocked By**: Task 1, Task 2

  **References**:

  **Pattern References**:
  - Git commit `55d01ff` lines 102-116 - Previous Input styling (standard, no ghost)
  - `src/components/ui/input.tsx` - Input variants available
  - `src/components/ui/textarea.tsx` - Textarea variants available

  **Current File Reference**:
  - `src/components/big-calendar/components/month-view/quick-add-event-popover.tsx:426-427` - Current ghost Input
  - `src/components/big-calendar/components/month-view/quick-add-event-popover.tsx:456-459` - Current ghost Textarea

  **Acceptance Criteria**:

  ```bash
  # Agent runs:
  grep 'variant="ghost"' src/components/big-calendar/components/month-view/quick-add-event-popover.tsx
  # Assert: No output (ghost variant removed)
  
  grep "rounded-none" src/components/big-calendar/components/month-view/quick-add-event-popover.tsx
  # Assert: No output (rounded-none removed)
  
  grep 'className="grid gap-3"' src/components/big-calendar/components/month-view/quick-add-event-popover.tsx
  # Assert: Returns match (spacing added)
  ```

  **Commit**: YES
  - Message: `fix(calendar): restore quick-add event popover UI after TanStack Form migration`
  - Files: `src/components/big-calendar/components/month-view/quick-add-event-popover.tsx`
  - Pre-commit: `pnpm check`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 3 (all tasks) | `fix(calendar): restore quick-add event popover UI after TanStack Form migration` | quick-add-event-popover.tsx | `pnpm check` |

---

## Success Criteria

### Verification Commands
```bash
pnpm check  # Expected: Exit 0, no errors
```

### Final Checklist
- [ ] PopoverHeader with "Quick Add Event" title present
- [ ] Cancel and Create buttons visible and functional
- [ ] Popover width is w-80 (320px)
- [ ] Input fields have standard styling (not ghost/invisible)
- [ ] Form submits and creates event
- [ ] Popover closes after submission
- [ ] `pnpm check` passes
- [ ] No changes to other files
