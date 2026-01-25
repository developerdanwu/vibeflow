# Calendar Fullscreen Layout

## Context

### Original Request
Remove the big calendar header and make the calendar span the full screen. Make each of the day cell squares span the whole page and shrink/grow to fill available space.

### Interview Summary
**Key Discussions**:
- User provided screenshot showing current layout with "Jan 2026" header, weekday labels, and calendar grid
- User wants to remove the "Calendar" h1 title (big text at top left)
- Calendar should fill the full viewport without padding/margins
- Day cells should be flexible (grow/shrink) instead of fixed height

**Research Findings**:
- Main route file: `src/routes/_authenticated/calendar.tsx`
- Month view component: `src/components/big-calendar/components/month-view/calendar-month-view.tsx`  
- Day cell component: `src/components/big-calendar/components/month-view/day-cell.tsx`
- The CalendarHeader component (Jan 2026 navigation) should STAY
- The Day/Week/Month/Year/Agenda view switcher buttons are currently in the header section being removed

### Metis Review
**Identified Gaps** (addressed):
- View switcher button relocation: Moved into CalendarHeader component
- Minimum cell height for usability: Applied 80px minimum to prevent tiny cells
- Mobile behavior: Kept compact on mobile, flexible only on desktop (lg: breakpoint)
- Loading state height: Changed to fill available space
- Multi-row month handling: Flexbox will naturally distribute space regardless of 4, 5, or 6 rows

---

## Work Objectives

### Core Objective
Make the calendar fill the full viewport by removing the "Calendar" title header and converting day cells from fixed heights to flexible heights that grow/shrink to fill available space.

### Concrete Deliverables
- Modified `src/routes/_authenticated/calendar.tsx` - removed header, removed padding
- Modified `src/components/big-calendar/components/month-view/calendar-month-view.tsx` - flexible height grid
- Modified `src/components/big-calendar/components/month-view/day-cell.tsx` - flexible cell heights
- Modified `src/components/big-calendar/components/header/calendar-header.tsx` - integrated view switcher buttons

### Definition of Done
- [x] Calendar grid fills viewport from sidebar edge to screen edge (no wasted padding)
- [x] Day cells expand vertically to fill available space
- [x] "Jan 2026" date navigation and view switcher buttons are visible and functional
- [x] Events remain clickable and display correctly
- [x] Layout works on both mobile and desktop

### Must Have
- Full viewport utilization - calendar fills available space
- Flexible day cell heights on desktop
- Preserved date navigation (CalendarHeader)
- Preserved view switching functionality (Day/Week/Month/Year/Agenda buttons)
- Event display and interaction preserved

### Must NOT Have (Guardrails)
- Do NOT modify event rendering logic (EventBullet, MonthEventBadge)
- Do NOT change the 7-column grid structure (grid-cols-7)
- Do NOT modify week day header row (Sun, Mon, Tue...)
- Do NOT add new responsive breakpoints beyond existing `lg:`
- Do NOT add animations, tooltips, or new interactions
- Do NOT modify the CalendarHeader's internal date navigation logic
- Do NOT change the `MAX_VISIBLE_EVENTS = 3` constant
- Do NOT modify drag-and-drop functionality

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES (Vitest)
- **User wants tests**: Manual-only (UI layout changes)
- **Framework**: N/A for this task

### Manual QA Only

Each TODO includes detailed verification procedures using Playwright browser automation to visually confirm layout changes.

**Evidence Required:**
- Screenshots showing calendar fills viewport
- Screenshots showing day cells with different content amounts
- Verification that buttons and navigation work

---

## Task Flow

```
Task 1 (Integrate view buttons into CalendarHeader)
    ↓
Task 2 (Remove "Calendar" header + padding in calendar.tsx)
    ↓
Task 3 (Make calendar-month-view.tsx use flexible heights)
    ↓
Task 4 (Make day-cell.tsx heights flexible)
```

## Parallelization

| Task | Depends On | Reason |
|------|------------|--------|
| 1 | None | CalendarHeader must receive buttons before removing from parent |
| 2 | 1 | Must have buttons relocated before removing header section |
| 3 | 2 | Container must have proper height before grid can fill it |
| 4 | 3 | Parent grid must support flex before children can use flex-1 |

---

## TODOs

- [x] 1. Integrate view switcher buttons into CalendarHeader component

  **What to do**:
  - Add `onViewChange` callback prop to CalendarHeader interface
  - Add the Day/Week/Month/Year/Agenda buttons (same style as current) to CalendarHeader's right side
  - Place buttons in a new button group BEFORE the existing Add Event button
  - The buttons should use the same `px-3 py-1.5 text-sm rounded-lg` styling from calendar.tsx
  - Active state: `bg-primary text-primary-foreground`, inactive: `bg-secondary/20 hover:bg-secondary/30`

  **Must NOT do**:
  - Do NOT modify the DateNavigator component
  - Do NOT change the Today button or user select
  - Do NOT remove the existing Add Event button

  **Parallelizable**: NO (must complete before task 2)

  **References**:
  
  **Pattern References**:
  - `src/routes/_authenticated/calendar.tsx:191-247` - Current view switcher button implementation to move
  - `src/components/big-calendar/components/header/calendar-header.tsx:31-104` - Existing button group structure to follow
  
  **API/Type References**:
  - `src/components/big-calendar/types/index.ts:TCalendarView` - Type for view prop (already used)
  
  **Why Each Reference Matters**:
  - Lines 191-247 contain exact button markup/styling to preserve when moving
  - Lines 31-104 show the existing layout pattern with flex and button groups

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Using playwright browser automation:
    - Navigate to: `http://localhost:3000/calendar`
    - Verify: View switcher buttons (Day/Week/Month/Year/Agenda) appear in CalendarHeader area
    - Action: Click each view button
    - Verify: Calendar view changes appropriately
    - Screenshot: Save to `.sisyphus/evidence/task-1-buttons-relocated.png`

  **Commit**: NO (groups with task 2)

---

- [x] 2. Remove "Calendar" header and container padding

  **What to do**:
  - Remove the entire header section (lines 175-248) containing:
    - The h1 "Calendar" title and user avatar (lines 175-190)
    - The view toggle buttons (lines 191-247) - these are now in CalendarHeader
  - Change the outer container from `p-6` to no padding
  - Remove `mt-6 border rounded-lg p-4 bg-card` from the calendar wrapper (line 250), replace with just `h-full`
  - Change loading state `h-96` to `h-full` to fill available space
  - Pass `onViewChange={handleViewChange}` to CalendarHeader

  **Must NOT do**:
  - Do NOT remove CalendarHeader component (line 249)
  - Do NOT modify CalendarProvider or DndProviderWrapper
  - Do NOT change the renderCalendarView function logic
  - Do NOT remove the loading state entirely

  **Parallelizable**: NO (depends on task 1)

  **References**:
  
  **Pattern References**:
  - `src/routes/_authenticated/calendar.tsx:170-267` - Current container structure
  - `src/routes/_authenticated/calendar.tsx:122-130` - handleViewChange function to pass as prop
  
  **Why Each Reference Matters**:
  - Lines 170-267 show the full container hierarchy to understand what to remove vs keep
  - handleViewChange needs to be passed to CalendarHeader for the moved buttons

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Using playwright browser automation:
    - Navigate to: `http://localhost:3000/calendar`
    - Verify: "Calendar" h1 text is NOT visible
    - Verify: User avatar section is NOT visible  
    - Verify: Calendar touches edges of content area (no visible padding)
    - Verify: CalendarHeader with "Jan 2026" IS visible
    - Verify: View switcher buttons work in their new location
    - Screenshot: Save to `.sisyphus/evidence/task-2-header-removed.png`

  **Commit**: YES
  - Message: `feat(calendar): remove header and make calendar fullscreen`
  - Files: `src/routes/_authenticated/calendar.tsx`, `src/components/big-calendar/components/header/calendar-header.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 3. Make month view grid use flexible heights

  **What to do**:
  - Add `h-full flex flex-col` to the root container div (line 37)
  - Add `flex-1` to the day cells grid container (line 48) to fill remaining space
  - The weekday header row should stay fixed height (no changes needed)
  - Grid rows will automatically distribute the flex-1 space using CSS Grid

  **Must NOT do**:
  - Do NOT change `grid-cols-7` (must stay 7 columns)
  - Do NOT modify weekday header row structure
  - Do NOT change the getCalendarCells helper logic

  **Parallelizable**: NO (depends on task 2 for parent height)

  **References**:
  
  **Pattern References**:
  - `src/components/big-calendar/components/month-view/calendar-month-view.tsx:36-58` - Current grid structure
  
  **Why Each Reference Matters**:
  - Lines 36-58 show the two grid sections: weekday headers (static) and day cells (needs to flex)

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Using playwright browser automation:
    - Navigate to: `http://localhost:3000/calendar`
    - Verify: Calendar grid fills the full height of the viewport
    - Action: Resize browser window vertically
    - Verify: Grid rows expand/contract to fill space
    - Screenshot: Save to `.sisyphus/evidence/task-3-flexible-grid.png`

  **Commit**: NO (groups with task 4)

---

- [x] 4. Make day cells flexible height

  **What to do**:
  - Make the DroppableDayCell wrapper take full height of grid cell
  - Change the day cell container to use flex layout with `flex-1` for content area
  - Add `min-h-[80px]` to ensure cells don't become too small on short screens
  - Change events container from `lg:h-[94px]` to `flex-1` for flexible height on desktop
  - Keep mobile height compact (mobile still uses `h-6` for events area)

  **Must NOT do**:
  - Do NOT change MAX_VISIBLE_EVENTS constant
  - Do NOT modify EventBullet or MonthEventBadge rendering logic
  - Do NOT change border/divide styling for grid lines
  - Do NOT add new responsive breakpoints

  **Parallelizable**: NO (depends on task 3)

  **References**:
  
  **Pattern References**:
  - `src/components/big-calendar/components/month-view/day-cell.tsx:41-108` - Current cell structure with height classes
  - `src/components/big-calendar/components/dnd/droppable-day-cell.tsx` - Wrapper that may need height adjustments
  
  **Why Each Reference Matters**:
  - Lines 43-47: Container with border classes (keep borders, change height behavior)
  - Line 64: Events container with `h-6` mobile and `lg:h-[94px]` desktop - needs `lg:flex-1`

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Using playwright browser automation:
    - Navigate to: `http://localhost:3000/calendar`
    - Verify: Day cells are visibly taller than before (filling available space)
    - Verify: Events still display correctly within expanded cells
    - Action: Navigate to a month with 6 rows (e.g., month starting on Friday with 31 days)
    - Verify: All 6 rows fit on screen without scrolling (cells shrink to accommodate)
    - Action: Navigate to month with 4 rows (February on Sunday)
    - Verify: 4 rows expand to fill the full height
    - Verify: Cell minimum height prevents cells from becoming too small
    - Screenshot: Save to `.sisyphus/evidence/task-4-flexible-cells.png`

  **Commit**: YES
  - Message: `feat(calendar): make day cells flexible height to fill viewport`
  - Files: `src/components/big-calendar/components/month-view/calendar-month-view.tsx`, `src/components/big-calendar/components/month-view/day-cell.tsx`
  - Pre-commit: `pnpm check`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 2 | `feat(calendar): remove header and make calendar fullscreen` | calendar.tsx, calendar-header.tsx | pnpm check |
| 4 | `feat(calendar): make day cells flexible height to fill viewport` | calendar-month-view.tsx, day-cell.tsx | pnpm check |

---

## Success Criteria

### Verification Commands
```bash
pnpm check  # Must pass with no errors
pnpm dev    # Start dev server for visual verification
```

### Final Checklist
- [x] "Calendar" h1 header removed
- [x] Calendar fills full viewport (no padding gaps)
- [x] Day cells expand/shrink based on available space
- [x] All view switcher buttons (Day/Week/Month/Year/Agenda) work
- [x] Date navigation (prev/next month) works
- [x] Events display and are clickable
- [x] Works on both mobile and desktop viewports
- [x] No TypeScript/lint errors (`pnpm check` passes) - only pre-existing warnings
