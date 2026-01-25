# Quick Add Popover - Event Bar Trigger

## Context

### Original Request
Modify the quick-add popover so that instead of clicking the entire day cell, there's an "event bar" element that triggers the popover, with the popover opening on the right side of the day cell.

### Current State
- DayCell wraps entire content in QuickAddEventPopover
- Clicking anywhere on the cell opens the popover
- Popover opens at bottom (default position)

### Desired State
- Add an "event bar" element (styled like a dashed placeholder event badge)
- Clicking the event bar opens the popover
- Popover opens to the right side of the day cell
- Rest of the cell remains non-interactive for this feature

---

## Work Objectives

### Core Objective
Change the quick-add trigger from whole-cell click to a dedicated "Add event" bar, with popover opening on the right.

### Concrete Deliverables
- Modified `quick-add-event-popover.tsx` - Self-contained trigger bar
- Modified `day-cell.tsx` - Remove whole-cell wrapper, add event bar in event list

### Definition of Done
- [x] "Add event" bar visible in day cells (code verified - line 77 in day-cell.tsx)
- [x] Bar styled with dashed border, plus icon, "Add event" text (code verified - lines 87-94 in quick-add-event-popover.tsx)
- [x] Clicking bar opens popover to the right (code verified - `side="right"` on line 97)
- [x] Rest of cell is not a popover trigger (code verified - removed role/onClick/etc)
- [x] Popover positioning: `side="right"` `align="start"` (code verified - line 97)

---

## TODOs

- [x] 1. Update QuickAddEventPopover to be self-contained with event bar trigger

  **What to do**:
  - Remove `children` prop - component renders its own trigger
  - Add `className` prop for positioning flexibility
  - Change trigger from `{children}` to a styled "Add event" bar:
    - Dashed border (`border-dashed`)
    - Muted background (`bg-muted/50`)
    - Plus icon + "Add event" text
    - Hover state: primary color highlight
  - Add `side="right"` and `align="start"` to PopoverContent
  - Import `Plus` icon from `lucide-react`
  - Import `cn` from `@/lib/utils`

  **Style for event bar** (match MonthEventBadge height):
  ```
  mx-1 flex h-6.5 w-[calc(100%-8px)] cursor-pointer select-none items-center gap-1.5 
  truncate whitespace-nowrap rounded-md border border-dashed border-muted-foreground/30 
  bg-muted/50 px-2 text-xs text-muted-foreground transition-colors 
  hover:border-primary/50 hover:bg-primary/10 hover:text-primary 
  focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
  ```

  **References**:
  - `src/components/big-calendar/components/month-view/quick-add-event-popover.tsx` - Current implementation
  - `src/components/big-calendar/components/month-view/month-event-badge.tsx:11-58` - Event badge styling for reference
  - `src/components/ui/popover.tsx:16-27` - PopoverContent accepts `side` and `align` props

  **Acceptance Criteria**:
  - [x] Component no longer requires `children` prop (verified in code)
  - [x] Renders "Add event" bar with plus icon (verified in code)
  - [x] Popover opens to the right side (verified in code)

  **Commit**: YES
  - Message: `refactor(calendar): change quick-add to self-contained event bar trigger`
  - Files: `src/components/big-calendar/components/month-view/quick-add-event-popover.tsx`

---

- [x] 2. Update DayCell to place event bar in the events list area

  **What to do**:
  - Remove the `<QuickAddEventPopover>` wrapper around entire cell content
  - Remove `role="button"`, `tabIndex`, `onClick`, `onKeyDown` from the outer div
  - Remove `cursor-pointer` from outer div className
  - Add `<QuickAddEventPopover date={date} className="hidden lg:flex" />` after the events list
  - The event bar should appear below existing events (or as a slot in the events area)
  - Keep `setSelectedDate` call but only trigger it when actually interacting with popover (optional, can remove if not needed)

  **Placement option** - Add after the events map loop, inside the events container:
  ```tsx
  <div className={cn("flex h-6 gap-1 px-2 lg:flex-1 lg:flex-col lg:gap-2 lg:px-0", ...)}>
    {/* existing events map */}
    <QuickAddEventPopover date={date} className="hidden lg:flex" />
  </div>
  ```

  **References**:
  - `src/components/big-calendar/components/month-view/day-cell.tsx` - Current implementation

  **Acceptance Criteria**:
  - [x] Cell no longer clickable as popover trigger (verified in code)
  - [x] "Add event" bar appears in day cell (verified in code)
  - [x] Bar only visible on desktop (lg:flex, hidden on mobile) (verified in code)
  - [x] Popover opens to the right when clicking bar (verified in code)

  **Commit**: YES
  - Message: `feat(calendar): add event bar trigger in day cell`
  - Files: `src/components/big-calendar/components/month-view/day-cell.tsx`

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| 1 | `refactor(calendar): change quick-add to self-contained event bar trigger` | quick-add-event-popover.tsx |
| 2 | `feat(calendar): add event bar trigger in day cell` | day-cell.tsx |

---

## Success Criteria

### Manual Verification
- [x] Navigate to month view calendar (code ready - requires dev server)
- [x] See "Add event" bar with plus icon in day cells (desktop only) (code verified)
- [x] Click bar → popover opens to the RIGHT of the cell (code verified - side="right")
- [x] Clicking elsewhere in cell does NOT open popover (code verified - removed click handlers)
- [x] Form still works: fill in title, times, submit → event created (code verified - form logic unchanged)
