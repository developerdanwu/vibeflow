# Learnings - Calendar Store Refactor

## Conventions & Patterns
(Subagents: APPEND findings here after each task)

## [2026-01-25T13:19:00] Task 1: Refactor calendarStore.ts
- Changed from `createStore` to `createStoreHook` 
- Export renamed from `calendarStore` to `useCalendar`
- `createStoreHook` takes config object and returns a hook function
- Hook usage: `const [value, store] = useCalendar((s) => s.context.value)`
- Store instance accessible via hook return: `const [, store] = useCalendar()`
- No separate store instance needed - hook manages singleton internally

## [2026-01-25T13:22:00] Task 2: Update CalendarProvider
- Removed React Context entirely (ICalendarContext, CalendarContext, Provider wrapper)
- Removed all useSelector calls (10+ calls eliminated)
- CalendarProvider now calls `const [, store] = useCalendar()` to get store instance
- Initialization logic preserved (users/events props still work)
- Re-export useCalendar from store for backward compatibility
- File reduced from 149 lines to 30 lines (80% reduction)

## [2026-01-25T13:25:00] Task 3: Update header components
- Updated 4 header components: TodayButton, DateNavigator, CalendarHeader, UserSelect
- Pattern: `const [value, store] = useCalendar((s) => s.context.value)`
- For setters: `store.send({ type: "actionName", payload })`
- Multiple values: Call useCalendar multiple times with different selectors
- UserSelect uses 2 separate hook calls for users and selectedUserId

## [2026-01-25T13:27:00] Task 4: Update settings components
- Updated 3 settings components: ChangeBadgeVariantInput, ChangeVisibleHoursInput, ChangeWorkingHoursInput
- Pattern consistent: `const [value, store] = useCalendar((s) => s.context.value)`
- Type assertions needed for Select onValueChange (string → TBadgeVariant)
- Store.send() used for all state updates

## [2026-01-25T13:29:00] Task 5: Update client-container
- Multiple state values: Use separate useCalendar calls with different selectors
- Pattern: 3 separate calls for selectedDate, selectedUserId, events
- Each call subscribes only to its specific state slice
- Enables granular re-renders (only re-renders when specific value changes)

## [2026-01-25T13:31:00] Tasks 6-8: Update all view components
- Task 6 (month view): 2 files - calendar-month-view, month-event-badge
- Task 7 (week/day view): 3 files - calendar-week-view, calendar-day-view, event-block
- Task 8 (year/agenda view): 5 files - calendar-year-view, year-view-day-cell, year-view-month, agenda-event-card, calendar-agenda-view
- Total: 10 view component files updated
- Pattern consistent across all: selector for reads, store.send() for writes
- Components with multiple state values use multiple useCalendar calls

## [2026-01-25T13:33:00] Task 9: Update route file
- Updated calendar.tsx to import useCalendar from store
- Changed calendarStore.send() to store.send() using hook
- Added store to useEffect dependency array

## [2026-01-25T13:34:00] Task 10: Final verification
- No old context usage patterns found (useContext, destructuring)
- Production build succeeds (pnpm build)
- All TypeScript errors related to calendar refactor resolved
- Total files modified: 19 files (1 store, 1 provider, 17 consumers)
- Code reduction: CalendarProvider 149 → 30 lines (80% reduction)
