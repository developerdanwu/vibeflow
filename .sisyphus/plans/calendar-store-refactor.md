# Calendar Store Refactor: Use createStoreHook for Optimized Renders

## Context

### Original Request
Refactor `src/components/big-calendar/store/calendarStore.ts` to use `createStoreHook` to create a `useCalendar` hook that supports selectors, instead of using React Context. This will optimize React renders as components won't have to select all the state all the time.

### Interview Summary
**Key Discussions**:
- Current implementation already uses `createStoreHook` but wraps it in React Context via `CalendarProvider`
- The context bundles all state + setters, causing unnecessary re-renders when ANY state changes
- User wants full refactor (not incremental), affecting all 19 consumer files
- Keep a minimal `CalendarProvider` for initialization only (users/events props)
- No tests needed for this refactor

**Research Findings**:
- `createStoreHook` from `@xstate/store-react` returns a hook that supports optional selector
- With selector: `const [value, store] = useCalendar((s) => s.context.value)`
- Without selector: `const [snapshot, store] = useCalendar()`
- Actions are accessed via `store.trigger.actionName({ payload })` or `store.send({ type: "actionName", payload })`

### Metis Review
**Identified Gaps** (addressed):
- Store instance export pattern: Export BOTH hook and store instance for initialization compatibility
- Initialization strategy: Provider uses hook internally to get store instance for initialization
- Error boundary for hook usage outside provider: Preserve helpful error message
- Date object immutability: Ensure Date updates create new instances
- Multi-selector pattern: Components needing multiple values use combined selector or multiple hook calls

---

## Work Objectives

### Core Objective
Refactor calendar state management to use XState Store's selector pattern directly, eliminating React Context overhead and enabling granular component re-renders based on actual state dependencies.

### Concrete Deliverables
- Updated `src/components/big-calendar/store/calendarStore.ts` exporting `useCalendar` hook
- Updated `src/components/big-calendar/contexts/calendar-context.tsx` as minimal initialization wrapper
- Updated 17 consumer components to use new selector-based API

### Definition of Done
- [ ] `pnpm check` passes with no errors
- [ ] App loads without runtime errors
- [ ] Calendar interactions work correctly (date selection, user filter, view switches)
- [ ] No TypeScript errors in any modified files

### Must Have
- Export both `useCalendar` hook AND `calendarStore` instance from store file
- Minimal `CalendarProvider` that only initializes store with users/events props
- All consumer components updated to use selector pattern
- Preserve all existing functionality (no regressions)

### Must NOT Have (Guardrails)
- MUST NOT change store schema (context shape, event types, reducers)
- MUST NOT modify component logic beyond hook usage pattern
- MUST NOT add new features or state properties
- MUST NOT change styling or UI behavior
- MUST NOT update dependencies or package versions
- MUST NOT add logging, analytics, or debugging code
- MUST NOT combine with other improvements ("while we're here" changes)

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES (Vitest configured)
- **User wants tests**: Manual-only (user explicitly said no tests needed)
- **Framework**: N/A for this refactor

### Manual QA Verification
Each task includes manual verification in browser:

**Verification Checklist** (after all tasks complete):
1. Change selected date via date navigator
2. Change selected date via month/year view clicks
3. Filter by user in user select dropdown
4. Toggle weekends visibility in settings
5. Change badge variant (colored/dot)
6. Change density setting
7. Modify visible hours range
8. Modify working hours
9. Navigate between views (day/week/month/year/agenda)
10. Verify events display correctly in all views

---

## Task Flow

```
Task 1 (Store) → Task 2 (Provider) → Task 3-8 (Consumers in groups)
```

## Parallelization

| Group | Tasks | Reason |
|-------|-------|--------|
| A | 3, 4, 5 | Header components (independent) |
| B | 6, 7 | Settings components (independent) |
| C | 8 | View components (can be parallel after group A/B) |

| Task | Depends On | Reason |
|------|------------|--------|
| 2 | 1 | Provider needs updated store exports |
| 3-8 | 2 | Consumers need updated provider pattern |

---

## TODOs

- [x] 1. Refactor calendarStore.ts - Export useCalendar hook and store instance

  **What to do**:
  - Keep existing store configuration (context, on events)
  - Rename the export from `calendarStore` to `useCalendar` (as the primary hook export)
  - Also export the underlying store instance for initialization use (as `calendarStore`)
  - The `createStoreHook` return value IS the hook, so `useCalendar = createStoreHook({...})`
  - Export the store instance: `export const calendarStore = useCalendar.store` (if available) OR create store separately

  **Must NOT do**:
  - Change the context shape or event handlers
  - Add new state properties
  - Modify reducer logic

  **Parallelizable**: NO (must complete first)

  **References**:
  
  **Pattern References**:
  - `src/components/big-calendar/store/calendarStore.ts:22-96` - Current store configuration to preserve
  
  **API/Type References**:
  - `src/components/big-calendar/interfaces/index.ts` - IEvent, IUser types
  - `src/components/big-calendar/types/index.ts` - TBadgeVariant, TDensity, TVisibleHours, TWorkingHours types
  
  **External References**:
  - XState Store React docs: `https://stately.ai/docs/xstate-store/react` - createStoreHook API and patterns

  **Acceptance Criteria**:
  - [x] File exports `useCalendar` hook that accepts optional selector
  - [x] File exports `calendarStore` instance for direct `.send()` calls
  - [x] `pnpm check` passes on this file
  - [x] Manual: Import in browser console works without errors

  **Commit**: YES
  - Message: `refactor(calendar): export useCalendar hook with selector support`
  - Files: `src/components/big-calendar/store/calendarStore.ts`
  - Pre-commit: `pnpm check`

---

- [x] 2. Update CalendarProvider - Minimal initialization wrapper

  **What to do**:
  - Remove all `useSelector` calls from CalendarProvider
  - Remove the `ICalendarContext` interface and context value bundling
  - Keep the `useEffect` or initialization logic that calls `calendarStore.send()` for users/events
  - Provider now only wraps children and initializes store, no context value passed
  - Remove or simplify the `CalendarContext` - it may only be needed for error boundary check
  - Update the `useCalendar` export to re-export from store (or keep separate for error checking)

  **Must NOT do**:
  - Remove initialization of users/events from props
  - Change the component tree structure

  **Parallelizable**: NO (depends on Task 1, blocks all consumer tasks)

  **References**:
  
  **Pattern References**:
  - `src/components/big-calendar/contexts/calendar-context.tsx:40-141` - Current provider implementation
  - `src/components/big-calendar/contexts/calendar-context.tsx:49-54` - Initialization pattern to preserve
  
  **API/Type References**:
  - `src/components/big-calendar/store/calendarStore.ts` - New exports from Task 1

  **Acceptance Criteria**:
  - [x] CalendarProvider only initializes store with users/events props
  - [x] No `useSelector` calls remain in CalendarProvider
  - [x] `ICalendarContext` interface removed (no longer needed)
  - [x] `pnpm check` passes
  - [x] Manual: App loads, calendar renders with events

  **Commit**: YES
  - Message: `refactor(calendar): simplify CalendarProvider to initialization only`
  - Files: `src/components/big-calendar/contexts/calendar-context.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 3. Update header components - TodayButton, DateNavigator, CalendarHeader

  **What to do**:
  - Update `today-button.tsx`: Change from `const { setSelectedDate } = useCalendar()` to `const [, store] = useCalendar()` and use `store.send({ type: "setSelectedDate", date: new Date() })`
  - Update `date-navigator.tsx`: Change from `const { selectedDate } = useCalendar()` to `const [selectedDate] = useCalendar((s) => s.context.selectedDate)`
  - Update `calendar-header.tsx`: Change from `const { selectedDate, setSelectedDate } = useCalendar()` to `const [selectedDate, store] = useCalendar((s) => s.context.selectedDate)` and use `store.send()` for setter
  - Update `user-select.tsx`: Change to use selectors for `users`, `selectedUserId` and `store.send()` for setter

  **Must NOT do**:
  - Change component rendering logic
  - Modify prop interfaces
  - Change any styling

  **Parallelizable**: YES (with Tasks 4, 5 after Task 2)

  **References**:
  
  **Pattern References**:
  - `src/components/big-calendar/components/header/today-button.tsx:3-8` - Current hook usage
  - `src/components/big-calendar/components/header/date-navigator.tsx:3-14` - Current hook usage
  - `src/components/big-calendar/components/header/calendar-header.tsx:8-20` - Current hook usage
  - `src/components/big-calendar/components/header/user-select.tsx:1-14` - Current hook usage
  
  **API/Type References**:
  - `src/components/big-calendar/store/calendarStore.ts` - New useCalendar API

  **Acceptance Criteria**:
  - [x] All 4 header files use selector pattern
  - [x] No destructuring from `useCalendar()` (old pattern)
  - [x] `pnpm check` passes
  - [x] Manual: Today button works, date navigation works, user filter works

  **Commit**: YES
  - Message: `refactor(calendar): update header components to use selector pattern`
  - Files: `src/components/big-calendar/components/header/*.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 4. Update settings components - BadgeVariant, VisibleHours, WorkingHours

  **What to do**:
  - Update `change-badge-variant-input.tsx`: Use selector for `badgeVariant`, `store.send()` for setter
  - Update `change-visible-hours-input.tsx`: Use selector for `visibleHours`, `store.send()` for setter  
  - Update `change-working-hours-input.tsx`: Use selector for `workingHours`, `store.send()` for setter

  **Must NOT do**:
  - Change input component logic
  - Modify validation or constraints

  **Parallelizable**: YES (with Tasks 3, 5 after Task 2)

  **References**:
  
  **Pattern References**:
  - `src/components/big-calendar/components/change-badge-variant-input.tsx:3-15` - Current hook usage
  - `src/components/big-calendar/components/change-visible-hours-input.tsx:6-18` - Current hook usage
  - `src/components/big-calendar/components/change-working-hours-input.tsx:6-29` - Current hook usage

  **Acceptance Criteria**:
  - [x] All 3 settings files use selector pattern
  - [x] `pnpm check` passes
  - [x] Manual: Badge variant toggle works, hour range inputs work

  **Commit**: YES
  - Message: `refactor(calendar): update settings components to use selector pattern`
  - Files: `src/components/big-calendar/components/change-*.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 5. Update client-container.tsx - Main container component

  **What to do**:
  - Update to use selectors for `selectedDate`, `selectedUserId`, `events`
  - For multiple values, either:
    - Use multiple `useCalendar()` calls with different selectors, OR
    - Use single selector returning object: `useCalendar((s) => ({ selectedDate: s.context.selectedDate, selectedUserId: s.context.selectedUserId, events: s.context.events }))`
  - Recommend multiple calls for granular re-renders

  **Must NOT do**:
  - Change event filtering logic
  - Modify the component tree structure

  **Parallelizable**: YES (with Tasks 3, 4 after Task 2)

  **References**:
  
  **Pattern References**:
  - `src/components/big-calendar/components/client-container.tsx:14-24` - Current hook usage with multiple values

  **Acceptance Criteria**:
  - [x] Uses selector pattern for all state access
  - [x] `pnpm check` passes
  - [x] Manual: Events render correctly, filtering by user works

  **Commit**: YES
  - Message: `refactor(calendar): update client-container to use selector pattern`
  - Files: `src/components/big-calendar/components/client-container.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 6. Update month view components - MonthView, MonthEventBadge

  **What to do**:
  - Update `calendar-month-view.tsx`: Use selector for `selectedDate`
  - Update `month-event-badge.tsx`: Use selector for `badgeVariant`

  **Must NOT do**:
  - Change event rendering logic
  - Modify date calculations

  **Parallelizable**: YES (with Task 7 after Tasks 3-5)

  **References**:
  
  **Pattern References**:
  - `src/components/big-calendar/components/month-view/calendar-month-view.tsx:2-21` - Current hook usage
  - `src/components/big-calendar/components/month-view/month-event-badge.tsx:6-82` - Current hook usage

  **Acceptance Criteria**:
  - [x] Both files use selector pattern
  - [x] `pnpm check` passes
  - [x] Manual: Month view renders correctly, event badges display properly

  **Commit**: YES
  - Message: `refactor(calendar): update month view components to use selector pattern`
  - Files: `src/components/big-calendar/components/month-view/*.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 7. Update week/day view components - WeekView, DayView, EventBlock

  **What to do**:
  - Update `calendar-week-view.tsx`: Use selectors for `selectedDate`, `workingHours`, `visibleHours`
  - Update `calendar-day-view.tsx`: Use selectors for same values
  - Update `event-block.tsx`: Use selector for `badgeVariant`

  **Must NOT do**:
  - Change time slot calculations
  - Modify event positioning logic

  **Parallelizable**: YES (with Task 6 after Tasks 3-5)

  **References**:
  
  **Pattern References**:
  - `src/components/big-calendar/components/week-and-day-view/calendar-week-view.tsx:14-32` - Current hook usage
  - `src/components/big-calendar/components/week-and-day-view/calendar-day-view.tsx:8-29` - Current hook usage
  - `src/components/big-calendar/components/week-and-day-view/event-block.tsx:7-60` - Current hook usage

  **Acceptance Criteria**:
  - [x] All 3 files use selector pattern
  - [x] `pnpm check` passes
  - [x] Manual: Week view renders correctly, day view renders correctly, events display properly

  **Commit**: YES
  - Message: `refactor(calendar): update week/day view components to use selector pattern`
  - Files: `src/components/big-calendar/components/week-and-day-view/*.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 8. Update remaining components - YearView, AgendaView

  **What to do**:
  - Update `calendar-year-view.tsx`: Use selector for `selectedDate`
  - Update `year-view-month.tsx`: Use selector and `store.send()` for `setSelectedDate`
  - Update `year-view-day-cell.tsx`: Use selector and `store.send()` for `setSelectedDate`
  - Update `calendar-agenda-view.tsx`: Use selector for `selectedDate`
  - Update `agenda-event-card.tsx`: Use selector for `badgeVariant`

  **Must NOT do**:
  - Change year navigation logic
  - Modify agenda grouping logic

  **Parallelizable**: YES (can run parallel with Tasks 6, 7)

  **References**:
  
  **Pattern References**:
  - `src/components/big-calendar/components/year-view/calendar-year-view.tsx:4-14` - Current hook usage
  - `src/components/big-calendar/components/year-view/year-view-month.tsx:11-23` - Current hook usage
  - `src/components/big-calendar/components/year-view/year-view-day-cell.tsx:4-17` - Current hook usage
  - `src/components/big-calendar/components/agenda-view/calendar-agenda-view.tsx:5-19` - Current hook usage
  - `src/components/big-calendar/components/agenda-view/agenda-event-card.tsx:9-65` - Current hook usage

  **Acceptance Criteria**:
  - [x] All 5 files use selector pattern
  - [x] `pnpm check` passes
  - [x] Manual: Year view renders and clicking dates works, agenda view renders correctly

  **Commit**: YES
  - Message: `refactor(calendar): update year/agenda view components to use selector pattern`
  - Files: `src/components/big-calendar/components/year-view/*.tsx`, `src/components/big-calendar/components/agenda-view/*.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 9. Update route file - calendar.tsx initialization

  **What to do**:
  - Check if `src/routes/_authenticated/calendar.tsx` uses `calendarStore.send()` directly
  - If so, ensure it imports from the correct location after refactor
  - Verify initialization pattern still works

  **Must NOT do**:
  - Change route configuration
  - Modify data loading logic

  **Parallelizable**: YES (after Task 1)

  **References**:
  
  **Pattern References**:
  - `src/routes/_authenticated/calendar.tsx:10-85` - Current store usage

  **Acceptance Criteria**:
  - [x] Route file imports from correct location
  - [x] Store initialization works
  - [x] `pnpm check` passes
  - [x] Manual: Calendar route loads correctly

  **Commit**: YES
  - Message: `refactor(calendar): update route file for new store exports`
  - Files: `src/routes/_authenticated/calendar.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 10. Final verification and cleanup

  **What to do**:
  - Run full `pnpm check` on entire codebase
  - Run `pnpm build` to verify production build works
  - Manual testing of all verification checklist items
  - Search codebase for any remaining old API usage patterns
  - Remove any unused imports or dead code

  **Must NOT do**:
  - Add new features
  - Refactor unrelated code

  **Parallelizable**: NO (final step)

  **References**:
  
  **Documentation References**:
  - This plan's Verification Checklist (above)

  **Acceptance Criteria**:
  - [ ] `pnpm check` passes
  - [ ] `pnpm build` completes successfully
  - [ ] All 10 verification checklist items pass
  - [ ] No remaining `useContext(CalendarContext)` or old destructuring patterns
  - [ ] No console errors in browser

  **Commit**: YES (if any cleanup needed)
  - Message: `refactor(calendar): cleanup unused code after selector migration`
  - Files: Any files needing cleanup
  - Pre-commit: `pnpm check && pnpm build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `refactor(calendar): export useCalendar hook with selector support` | calendarStore.ts | pnpm check |
| 2 | `refactor(calendar): simplify CalendarProvider to initialization only` | calendar-context.tsx | pnpm check |
| 3 | `refactor(calendar): update header components to use selector pattern` | header/*.tsx | pnpm check |
| 4 | `refactor(calendar): update settings components to use selector pattern` | change-*.tsx | pnpm check |
| 5 | `refactor(calendar): update client-container to use selector pattern` | client-container.tsx | pnpm check |
| 6 | `refactor(calendar): update month view components to use selector pattern` | month-view/*.tsx | pnpm check |
| 7 | `refactor(calendar): update week/day view components to use selector pattern` | week-and-day-view/*.tsx | pnpm check |
| 8 | `refactor(calendar): update year/agenda view components to use selector pattern` | year-view/*.tsx, agenda-view/*.tsx | pnpm check |
| 9 | `refactor(calendar): update route file for new store exports` | calendar.tsx | pnpm check |
| 10 | `refactor(calendar): cleanup unused code after selector migration` | various | pnpm check && pnpm build |

---

## Success Criteria

### Verification Commands
```bash
pnpm check   # Expected: No errors
pnpm build   # Expected: Build completes successfully
pnpm dev     # Expected: App runs without console errors
```

### Final Checklist
- [ ] All "Must Have" present
  - [ ] `useCalendar` hook exported with selector support
  - [ ] `calendarStore` instance exported for initialization
  - [ ] Minimal CalendarProvider
  - [ ] All 19 consumer files updated
- [ ] All "Must NOT Have" absent
  - [ ] No store schema changes
  - [ ] No new features
  - [ ] No styling changes
  - [ ] No dependency updates
- [ ] All manual verification items pass
  - [ ] Date selection works
  - [ ] User filtering works
  - [ ] All views render correctly
  - [ ] Settings changes work
