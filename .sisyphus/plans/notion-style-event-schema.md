# Notion-Style Event Schema Migration

## TL;DR

> **Quick Summary**: Migrate event storage to Notion-style schema where all-day events use date-only strings (timezone-agnostic) and timed events store explicit IANA timezone. This fixes the wrong-day display bug when users view calendars across timezones.
> 
> **Deliverables**:
> - Updated Convex schema with `start_date`, `end_date`, `start_time`, `end_time`, `time_zone` fields
> - Updated mutations that derive numeric `startDate`/`endDate` from new fields
> - Updated `IEvent` interface with all-day and timezone support
> - Helper functions for "which day" logic
> - Updated quick-add to send Notion-style payloads
> - Updated drag-and-drop to maintain new field consistency
> - Query buffer for timezone edge cases
> - TDD unit tests for all helpers
> 
> **Estimated Effort**: Medium (4-6 hours)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 (Tests) → Task 2 (Schema) → Task 3 (Mutations) → Task 5 (Quick-add) → Task 8 (Integration test)

---

## Context

### Original Request
Adopt Notion-style event schema so that:
1. All-day events use date-only fields (`start_date`, `end_date` as YYYY-MM-DD) - timezone-agnostic, no wrong-day display
2. Timed events store explicit timezone (IANA) with date and time fields
3. Keep numeric `startDate`/`endDate` for indexing (derive from new fields)

### Interview Summary
**Key Discussions**:
- Edit event dialog: DEFERRED to separate task
- Migration: NOT NEEDED - no existing data in database
- Drag-and-drop: UPDATE to use new Notion-style fields
- Time display: Show in event's original timezone (e.g., "9:00 AM PST")
- End date semantics: EXCLUSIVE (Google Calendar model)
- Query buffer: Add ±1 day to prevent missing events at timezone boundaries
- Timed event day: Viewer's local day (standard calendar behavior)

**Research Findings**:
- Current schema has `allDay: v.boolean()` but frontend `IEvent` doesn't include it
- Quick-add uses `startOfDay()`/`endOfDay()` then `.getTime()` for all-day
- Display logic uses `parseISO(event.startDate)` throughout
- `IEvent.startDate` is ISO string format (not numeric)
- No edit dialog exists - only read-only details with Delete

### Metis Review
**Identified Gaps** (addressed):
- IEvent missing `allDay` field: Will add to interface
- End date semantics undefined: Exclusive (Google model)
- Query timezone edge cases: Add ±1 day buffer
- Drag-and-drop type conversion: Prevent all-day↔timed conversions (out of scope)

---

## Work Objectives

### Core Objective
Implement Notion-style event storage where all-day events are timezone-agnostic (date-only strings) and timed events preserve original timezone for correct display across viewers.

### Concrete Deliverables
- `convex/schema.ts`: Optional fields `start_date`, `end_date`, `start_time`, `end_time`, `time_zone`
- `convex/events.ts`: Updated `createEvent`/`updateEvent` mutations
- `convex/events.ts`: Updated `getEventsByDateRange` with ±1 day buffer
- `src/components/big-calendar/interfaces.ts`: Updated `IEvent` interface
- `src/components/big-calendar/helpers.ts`: New helper functions for date logic
- `src/components/big-calendar/helpers.test.ts`: TDD unit tests
- `src/routes/_authenticated/calendar.tsx`: Map new fields from Convex
- `quick-add-event-popover.tsx`: Send Notion-style payloads
- `droppable-day-cell.tsx`, `droppable-time-block.tsx`: Send new fields on drag
- `client-container.tsx`, `month-event-badge.tsx`: Use helpers for filtering

### Definition of Done
- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm test` passes (all helper tests green)
- [ ] `pnpm check` passes (lint + format)
- [ ] All-day event created via quick-add stores `start_date`/`end_date` (no time/timezone)
- [ ] Timed event created via quick-add stores all 5 fields + derived numeric
- [ ] Events display on correct calendar day regardless of viewer timezone

### Must Have
- All-day events store `start_date`/`end_date` as YYYY-MM-DD strings
- Timed events store `start_date`, `start_time`, `end_date`, `end_time`, `time_zone`
- Backend derives numeric `startDate`/`endDate` for indexing
- `allDay` field added to `IEvent` interface
- Helper functions for "which calendar day" logic
- Query buffer to prevent timezone edge case misses
- Unit tests for all helper functions

### Must NOT Have (Guardrails)
- Edit event dialog (explicitly deferred)
- Timezone picker UI (use browser auto-detect)
- Migration scripts (no existing data)
- Week/day view time display changes (out of scope for this PR)
- Recurring event support
- DST edge case handling beyond date-fns defaults
- Drag-and-drop all-day↔timed conversion
- Business logic validation (past/future events, conflicts)

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES (Vitest via `pnpm test`)
- **User wants tests**: TDD approach
- **Framework**: Vitest

### TDD Enabled

Each TODO follows RED-GREEN-REFACTOR pattern where applicable.

**Helpers to test**:
1. `getEventCalendarDate(event, "start" | "end"): string` - returns YYYY-MM-DD for display
2. `deriveNumericTimestamp(date: string, time?: string, timezone?: string): number` - converts new fields → numeric
3. `isEventOnDate(event, date): boolean` - checks if event should display on given date
4. `formatEventTime(event): string | null` - formats time in event's timezone (null for all-day)

**Test cases per helper** (max 5 each = 20 total):
- All-day event with date-only fields
- Timed event with date+time+timezone
- Edge case: event spanning multiple days
- Edge case: missing optional fields (fallback behavior)
- Edge case: timezone conversion (PST→UTC)

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Write failing tests for helpers (TDD RED)
└── Task 4: Update IEvent interface + calendar route mapping

Wave 2 (After Wave 1):
├── Task 2: Update Convex schema
├── Task 3: Update Convex mutations (depends on schema)
└── Task 6: Add helper implementations (make tests GREEN)

Wave 3 (After Wave 2):
├── Task 5: Update quick-add-event-popover
├── Task 7: Update drag-and-drop components
├── Task 9: Update display logic (client-container, month-event-badge)
└── Task 10: Update getEventsByDateRange query with buffer

Final (After Wave 3):
└── Task 8: Integration test + verification
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 6 | 4 |
| 2 | None | 3 | 1, 4 |
| 3 | 2 | 5, 7, 10 | 6 |
| 4 | None | 5, 9 | 1, 2 |
| 5 | 3, 4 | 8 | 7, 9, 10 |
| 6 | 1 | 9 | 3 |
| 7 | 3 | 8 | 5, 9, 10 |
| 8 | 5, 7, 9, 10 | None | None (final) |
| 9 | 4, 6 | 8 | 5, 7, 10 |
| 10 | 3 | 8 | 5, 7, 9 |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 4 | `category="quick"` for each, run in parallel |
| 2 | 2, 3, 6 | `category="quick"` for schema/mutations, parallel |
| 3 | 5, 7, 9, 10 | `category="quick"` for each, parallel |
| Final | 8 | `category="quick"` with playwright skill for verification |

---

## TODOs

- [x] 1. Write failing tests for date helper functions (TDD RED phase)

  **What to do**:
  - Create test file `src/components/big-calendar/helpers.test.ts`
  - Write tests for `getEventCalendarDate()`:
    - All-day: returns `start_date` directly
    - Timed: derives date from timestamp in event's timezone
  - Write tests for `deriveNumericTimestamp()`:
    - All-day: midnight UTC of given date
    - Timed: interprets date+time in given timezone, returns UTC ms
  - Write tests for `isEventOnDate()`:
    - All-day: checks if date falls within start_date..end_date range (exclusive end)
    - Timed: checks if timestamp falls on given date in viewer's timezone
  - Write tests for `formatEventTime()`:
    - All-day: returns null
    - Timed: returns formatted time with timezone (e.g., "9:00 AM PST")
  - Tests should FAIL initially (functions don't exist yet)

  **Must NOT do**:
  - Implement the helper functions (that's Task 6)
  - Write more than 20 total test cases
  - Test DST edge cases

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`
    - Simple test file creation, no special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 4)
  - **Blocks**: Task 6
  - **Blocked By**: None

  **References**:
  - `src/components/big-calendar/helpers.ts:1-50` - Existing helper patterns and imports
  - `vitest.config.ts` - Test configuration
  - `date-fns` - Use date-fns functions for date manipulation

  **Acceptance Criteria**:
  ```bash
  # Tests should exist and FAIL (RED phase)
  pnpm test src/components/big-calendar/helpers.test.ts
  # Assert: Tests run but fail (functions not implemented)
  # Assert: At least 16 test cases exist (4 functions × 4 cases each)
  ```

  **Commit**: NO (groups with Task 6)

---

- [x] 2. Update Convex schema with optional date/time/timezone fields

  **What to do**:
  - Add to `events` table in `convex/schema.ts`:
    ```typescript
    start_date: v.optional(v.string()),   // YYYY-MM-DD
    end_date: v.optional(v.string()),     // YYYY-MM-DD
    start_time: v.optional(v.string()),   // HH:mm (24h)
    end_time: v.optional(v.string()),     // HH:mm (24h)
    time_zone: v.optional(v.string()),    // IANA timezone
    ```
  - Keep existing `startDate`, `endDate` (numbers) and `allDay` (boolean)
  - Keep existing indexes (no changes needed)

  **Must NOT do**:
  - Remove existing fields
  - Change field types of existing fields
  - Add new indexes

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `["convex"]`
    - Convex schema patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1, 4)
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References**:
  - `convex/schema.ts:25-38` - Current events table schema
  - `convex/docs/schema.md` - Convex schema best practices

  **Acceptance Criteria**:
  ```bash
  pnpm typecheck
  # Assert: Zero TypeScript errors
  
  npx convex dev --once
  # Assert: Schema pushes successfully
  ```

  **Commit**: YES
  - Message: `feat(convex): add notion-style date fields to events schema`
  - Files: `convex/schema.ts`
  - Pre-commit: `pnpm typecheck`

---

- [x] 3. Update Convex mutations to accept new fields and derive numeric timestamps

  **What to do**:
  - Update `createEvent` mutation args to accept:
    - `start_date: v.optional(v.string())`
    - `end_date: v.optional(v.string())`
    - `start_time: v.optional(v.string())`
    - `end_time: v.optional(v.string())`
    - `time_zone: v.optional(v.string())`
  - Make numeric `startDate`/`endDate` optional in args (derive when new fields provided)
  - Add derivation logic:
    - If `allDay && start_date`: derive `startDate` = UTC midnight of start_date, `endDate` = UTC midnight of end_date
    - If `!allDay && start_date && start_time && time_zone`: parse date+time in timezone, convert to UTC ms
  - Add validation:
    - If `allDay`: require `start_date` and `end_date`, reject time fields
    - If `!allDay`: require all 5 new fields OR numeric fallback
    - Validate YYYY-MM-DD format for dates
    - Validate HH:mm format for times
    - Validate IANA timezone string
  - Update `updateEvent` mutation with same logic
  - Store all new fields when provided

  **Must NOT do**:
  - Remove backward compatibility (numeric-only creation should still work)
  - Add business logic validation (past events, conflicts)
  - Change index behavior

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `["convex"]`
    - Convex mutation patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential after schema)
  - **Blocks**: Task 5, 7, 10
  - **Blocked By**: Task 2

  **References**:
  - `convex/events.ts:4-62` - Current createEvent/updateEvent mutations
  - `convex/docs/custom-functions.md` - Mutation patterns
  - `convex/docs/patterns.md` - Validation patterns

  **Acceptance Criteria**:
  ```bash
  pnpm typecheck
  # Assert: Zero TypeScript errors
  
  # Test in Convex dashboard:
  # 1. Create all-day event with start_date="2026-01-15", end_date="2026-01-16", allDay=true
  # Assert: Event created with start_date, end_date, derived startDate/endDate
  
  # 2. Create timed event with start_date="2026-01-15", start_time="09:00", 
  #    end_date="2026-01-15", end_time="10:00", time_zone="America/Los_Angeles", allDay=false
  # Assert: Event created with all fields + derived numeric timestamps
  ```

  **Commit**: YES
  - Message: `feat(convex): support notion-style fields in createEvent/updateEvent`
  - Files: `convex/events.ts`
  - Pre-commit: `pnpm typecheck`

---

- [x] 4. Update IEvent interface and calendar route mapping

  **What to do**:
  - Add to `IEvent` interface in `interfaces.ts`:
    ```typescript
    allDay: boolean;
    start_date?: string;    // YYYY-MM-DD
    end_date?: string;      // YYYY-MM-DD
    start_time?: string;    // HH:mm
    end_time?: string;      // HH:mm
    time_zone?: string;     // IANA timezone
    ```
  - Update calendar route mapping in `calendar.tsx`:
    - Map `allDay: event.allDay`
    - Map `start_date: event.start_date`
    - Map `end_date: event.end_date`
    - Map `start_time: event.start_time`
    - Map `end_time: event.end_time`
    - Map `time_zone: event.time_zone`
  - Keep existing `startDate`/`endDate` mapping (ISO strings from numeric)

  **Must NOT do**:
  - Remove existing fields
  - Change type of existing fields
  - Modify other interfaces

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`
    - Simple type additions

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1, 2)
  - **Blocks**: Task 5, 9
  - **Blocked By**: None

  **References**:
  - `src/components/big-calendar/interfaces.ts:9-18` - Current IEvent interface
  - `src/routes/_authenticated/calendar.tsx:72-86` - Current mapping logic

  **Acceptance Criteria**:
  ```bash
  pnpm typecheck
  # Assert: Zero TypeScript errors
  # Assert: IEvent has allDay, start_date, end_date, start_time, end_time, time_zone fields
  ```

  **Commit**: YES
  - Message: `feat(calendar): add notion-style fields to IEvent interface`
  - Files: `src/components/big-calendar/interfaces.ts`, `src/routes/_authenticated/calendar.tsx`
  - Pre-commit: `pnpm typecheck`

---

- [x] 5. Update quick-add-event-popover to send Notion-style payloads

  **What to do**:
  - Modify form submission in `quick-add-event-popover.tsx`:
    - For all-day events:
      ```typescript
      await createEvent({
        title: values.title,
        allDay: true,
        start_date: format(values.startDate, "yyyy-MM-dd"),
        end_date: format(addDays(values.endDate, 1), "yyyy-MM-dd"), // exclusive end
        // Remove startDate, endDate numbers - backend derives
      });
      ```
    - For timed events:
      ```typescript
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await createEvent({
        title: values.title,
        allDay: false,
        start_date: format(values.startDate, "yyyy-MM-dd"),
        start_time: format(startDateTime, "HH:mm"),
        end_date: format(values.endDate, "yyyy-MM-dd"),
        end_time: format(endDateTime, "HH:mm"),
        time_zone: browserTz,
        // Remove startDate, endDate numbers - backend derives
      });
      ```
  - Remove old `startDate: startDateTime.getTime()` pattern
  - Import `addDays` from date-fns for exclusive end date handling

  **Must NOT do**:
  - Change form validation logic
  - Modify UI appearance
  - Add timezone picker (use browser auto-detect)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`
    - Simple form submission changes

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 7, 9, 10)
  - **Blocks**: Task 8
  - **Blocked By**: Task 3, 4

  **References**:
  - `src/components/big-calendar/components/month-view/quick-add-event-popover.tsx:184-223` - Current submission logic
  - `date-fns` format function for date formatting

  **Acceptance Criteria**:
  ```bash
  pnpm typecheck
  # Assert: Zero TypeScript errors
  ```
  
  **Playwright verification** (Task 8):
  ```
  1. Open calendar, click on Jan 15
  2. Toggle "All Day" ON, enter title "Team Offsite"
  3. Submit form
  4. Check Convex dashboard:
     - start_date="2026-01-15"
     - end_date="2026-01-16" (exclusive)
     - start_time=undefined
     - time_zone=undefined
     - allDay=true
  ```

  **Commit**: YES
  - Message: `feat(quick-add): send notion-style payload for events`
  - Files: `src/components/big-calendar/components/month-view/quick-add-event-popover.tsx`
  - Pre-commit: `pnpm typecheck`

---

- [x] 6. Implement date helper functions (TDD GREEN phase)

  **What to do**:
  - Implement `getEventCalendarDate(event: IEvent, which: "start" | "end"): string` in `helpers.ts`:
    - If `event.start_date` exists: return it directly (for all-day)
    - Else: derive from `event.startDate` (ISO string → YYYY-MM-DD in event's timezone or UTC)
  - Implement `deriveNumericTimestamp(date: string, time?: string, timezone?: string): number`:
    - If time is undefined: return UTC midnight of date
    - Else: parse date+time in timezone, return UTC ms
  - Implement `isEventOnDate(event: IEvent, date: Date): boolean`:
    - For all-day: check if date falls within [start_date, end_date) (exclusive end)
    - For timed: check if event's timestamp (in viewer's TZ) falls on date
  - Implement `formatEventTime(event: IEvent): string | null`:
    - If `event.allDay`: return null
    - Else: format `start_time` with `time_zone` (e.g., "9:00 AM PST")
  - All tests from Task 1 should now pass (GREEN)

  **Must NOT do**:
  - Modify tests (they define the contract)
  - Add complexity beyond what tests require
  - Handle DST edge cases specially

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`
    - Simple function implementations

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Task 9
  - **Blocked By**: Task 1

  **References**:
  - `src/components/big-calendar/helpers.test.ts` - Tests defining expected behavior (from Task 1)
  - `src/components/big-calendar/helpers.ts` - Existing helpers to follow patterns
  - `date-fns` and `date-fns-tz` for timezone handling

  **Acceptance Criteria**:
  ```bash
  pnpm test src/components/big-calendar/helpers.test.ts
  # Assert: All tests PASS (GREEN)
  
  pnpm typecheck
  # Assert: Zero TypeScript errors
  ```

  **Commit**: YES
  - Message: `feat(helpers): implement notion-style date helper functions`
  - Files: `src/components/big-calendar/helpers.ts`, `src/components/big-calendar/helpers.test.ts`
  - Pre-commit: `pnpm test && pnpm typecheck`

---

- [x] 7. Update drag-and-drop components to send new fields

  **What to do**:
  - Update `droppable-day-cell.tsx`:
    - When event is dropped on new day, calculate new `start_date`/`end_date`
    - Preserve `time_zone` and time fields if timed event
    - For all-day: update `start_date`/`end_date` to new day
    - For timed: update `start_date`/`end_date`, keep `start_time`/`end_time`/`time_zone`
  - Update `droppable-time-block.tsx`:
    - When event is dropped on new time block, update `start_time`/`end_time`
    - Preserve or update `start_date` based on target time block
    - Preserve `time_zone`
  - Both should call `updateEvent` with new Notion-style fields

  **Must NOT do**:
  - Allow converting all-day to timed or vice versa via drag
  - Change drag behavior or visual feedback
  - Add new drag targets

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`
    - Simple component updates

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 5, 9, 10)
  - **Blocks**: Task 8
  - **Blocked By**: Task 3

  **References**:
  - `src/components/big-calendar/components/dnd/droppable-day-cell.tsx` - Day cell drop handler
  - `src/components/big-calendar/components/dnd/droppable-time-block.tsx` - Time block drop handler
  - `src/components/big-calendar/hooks/use-update-event.ts` - Update hook interface

  **Acceptance Criteria**:
  ```bash
  pnpm typecheck
  # Assert: Zero TypeScript errors
  ```
  
  **Manual verification** (Task 8):
  ```
  1. Create all-day event on Jan 15
  2. Drag to Jan 20
  3. Check Convex: start_date="2026-01-20", end_date updated accordingly
  4. Create timed event at 9 AM Jan 15
  5. Drag to Jan 20
  6. Check Convex: start_date="2026-01-20", start_time="09:00" preserved
  ```

  **Commit**: YES
  - Message: `feat(dnd): update drag-drop to send notion-style fields`
  - Files: `src/components/big-calendar/components/dnd/droppable-day-cell.tsx`, `src/components/big-calendar/components/dnd/droppable-time-block.tsx`
  - Pre-commit: `pnpm typecheck`

---

- [x] 8. Integration test and final verification

  **What to do**:
  - Run full test suite: `pnpm test`
  - Run type check: `pnpm typecheck`
  - Run lint/format: `pnpm check`
  - Browser verification using Playwright skill:
    1. Navigate to calendar
    2. Create all-day event "Vacation" on Jan 15
    3. Verify it displays on Jan 15 cell
    4. Create timed event "Meeting" at 9 AM on Jan 20
    5. Verify it displays on Jan 20 with time
    6. Drag all-day event to Jan 22
    7. Verify it moves and Convex record updated
  - Verify Convex records in dashboard have correct field structure

  **Must NOT do**:
  - Fix bugs found (create follow-up tasks instead)
  - Add new features
  - Modify code

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `["playwright"]`
    - Browser automation for UI verification

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Final (after all others)
  - **Blocks**: None (final task)
  - **Blocked By**: Task 5, 7, 9, 10

  **References**:
  - All files modified in previous tasks

  **Acceptance Criteria**:
  ```bash
  pnpm test
  # Assert: All tests pass
  
  pnpm typecheck
  # Assert: Zero errors
  
  pnpm check
  # Assert: Passes
  ```

  **Playwright verification**:
  ```
  1. Navigate to http://localhost:3000/calendar
  2. Click Jan 15 cell → Quick-add opens
  3. Toggle "All Day" ON
  4. Enter title "Team Offsite"
  5. Click Save
  6. Assert: Event badge appears on Jan 15
  7. Screenshot: .sisyphus/evidence/task-8-allday-create.png
  
  8. Click Jan 20 cell → Quick-add opens
  9. Leave "All Day" OFF
  10. Enter title "Standup"
  11. Set time 9:00 AM - 9:30 AM
  12. Click Save
  13. Assert: Event appears on Jan 20 with "9:00 AM" visible
  14. Screenshot: .sisyphus/evidence/task-8-timed-create.png
  ```

  **Commit**: NO (verification only)

---

- [x] 9. Update display logic to use helper functions

  **What to do**:
  - Update `client-container.tsx`:
    - Replace `parseISO(event.startDate)` with `getEventCalendarDate(event, "start")` where checking "which day"
    - Update filtering logic to use `isEventOnDate(event, date)` for day/week/month views
    - Keep existing range query logic (it uses numeric timestamps)
  - Update `month-event-badge.tsx`:
    - Replace `parseISO(event.startDate)` with helper for positioning
    - Use `getEventCalendarDate()` for "which day" checks
  - Update any other display components that check "which day" an event falls on

  **Must NOT do**:
  - Change week/day view time positioning (keep timestamp-based for timed events)
  - Modify event rendering appearance
  - Add new display features

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`
    - Simple refactor to use helpers

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 5, 7, 10)
  - **Blocks**: Task 8
  - **Blocked By**: Task 4, 6

  **References**:
  - `src/components/big-calendar/components/client-container.tsx:27-126` - Current filtering logic
  - `src/components/big-calendar/components/month-view/month-event-badge.tsx:87-106` - Current positioning logic
  - `src/components/big-calendar/helpers.ts` - New helper functions (from Task 6)

  **Acceptance Criteria**:
  ```bash
  pnpm typecheck
  # Assert: Zero TypeScript errors
  
  # Grep for old pattern should find minimal/no results:
  grep -r "parseISO(event.startDate)" src/components/big-calendar/components/
  # Assert: Only in places where timestamp-based positioning is needed (week/day time blocks)
  ```

  **Commit**: YES
  - Message: `refactor(calendar): use notion-style helpers for date display logic`
  - Files: `src/components/big-calendar/components/client-container.tsx`, `src/components/big-calendar/components/month-view/month-event-badge.tsx`
  - Pre-commit: `pnpm typecheck`

---

- [x] 10. Update getEventsByDateRange query with buffer

  **What to do**:
  - Modify `getEventsByDateRange` in `convex/events.ts`:
    - Add ±1 day buffer to query range to catch timezone edge cases
    - Keep return type unchanged
    - Update comment to document buffer reason
  - Example:
    ```typescript
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const bufferedStart = args.startDate - ONE_DAY_MS;
    const bufferedEnd = args.endDate + ONE_DAY_MS;
    
    const events = await ctx.db
      .query("events")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", ctx.user._id).gte("startDate", bufferedStart)
      )
      .collect();
    
    return events.filter((event) => event.startDate <= bufferedEnd);
    ```
  - Client-side filtering (in Task 9) will use helpers to determine which events actually appear on visible days

  **Must NOT do**:
  - Change query return type
  - Add new query parameters
  - Modify other queries

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `["convex"]`
    - Convex query patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 5, 7, 9)
  - **Blocks**: Task 8
  - **Blocked By**: Task 3

  **References**:
  - `convex/events.ts:92-107` - Current getEventsByDateRange query

  **Acceptance Criteria**:
  ```bash
  pnpm typecheck
  # Assert: Zero TypeScript errors
  ```

  **Commit**: YES
  - Message: `fix(convex): add buffer to getEventsByDateRange for timezone edge cases`
  - Files: `convex/events.ts`
  - Pre-commit: `pnpm typecheck`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 2 | `feat(convex): add notion-style date fields to events schema` | convex/schema.ts | pnpm typecheck |
| 3 | `feat(convex): support notion-style fields in createEvent/updateEvent` | convex/events.ts | pnpm typecheck |
| 4 | `feat(calendar): add notion-style fields to IEvent interface` | interfaces.ts, calendar.tsx | pnpm typecheck |
| 5 | `feat(quick-add): send notion-style payload for events` | quick-add-event-popover.tsx | pnpm typecheck |
| 6 | `feat(helpers): implement notion-style date helper functions` | helpers.ts, helpers.test.ts | pnpm test && pnpm typecheck |
| 7 | `feat(dnd): update drag-drop to send notion-style fields` | droppable-*.tsx | pnpm typecheck |
| 9 | `refactor(calendar): use notion-style helpers for date display logic` | client-container.tsx, month-event-badge.tsx | pnpm typecheck |
| 10 | `fix(convex): add buffer to getEventsByDateRange for timezone edge cases` | convex/events.ts | pnpm typecheck |

---

## Success Criteria

### Verification Commands
```bash
pnpm test                    # All tests pass
pnpm typecheck               # Zero TypeScript errors
pnpm check                   # Lint + format pass
pnpm dev                     # App runs without errors
```

### Final Checklist
- [ ] All-day events store `start_date`/`end_date` (no time/timezone)
- [ ] Timed events store all 5 new fields + derived numeric
- [ ] Events display on correct calendar day
- [ ] Drag-and-drop updates new fields correctly
- [ ] Query buffer prevents missing events at timezone boundaries
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
