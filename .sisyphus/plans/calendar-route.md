# Calendar Route Implementation Plan

## Context

### Original Request
Implement the /calendar route by following the spec in UI_SPEC.md and SPEC.md to create a production-ready calendar with event management capabilities.

### Interview Summary
**Key Discussions**:
- Build on existing `/calendar` route: Already has big-calendar components integrated
- Keep scope simple: Basic event CRUD and display only
- Testing approach: Tests after implementation
- No advanced features: Skip recurring events, reminders, conflicts for now

**Research Findings**:
- Calendar route exists at `src/routes/calendar.tsx` with sample data
- Big-calendar components are already imported and working
- Convex schema needs extension for calendar data (currently only has products and todos)
- Vitest is configured for testing
- WorkOS authentication is set up but needs integration

---

## Work Objectives

### Core Objective
Clean up template code, implement VibeFlow design system, and transform the existing sample calendar route into a production-ready calendar with Convex-backed real-time event management, user authentication, and proper routing.

### Concrete Deliverables
- Clean codebase without TanStack Start template files
- VibeFlow color theme and typography implementation
- Convex schema for events, calendars, and user preferences
- Event CRUD mutations and queries in Convex
- Real-time subscriptions for live updates
- Date-based routing parameters for navigation
- User-specific calendar filtering with WorkOS integration
- Tests for critical functionality

### Definition of Done
- [x] All template/demo code removed
- [x] VibeFlow theme applied throughout the app
- [x] Events persist in Convex database
- [x] Real-time updates work across browser tabs
- [x] Users see only their own events when authenticated
- [x] Calendar views navigate with date parameters in URL
- [x] All CRUD operations (create, read, update, delete) functional
- [x] Tests pass for core functionality

### Must Have
- Event persistence in Convex
- User authentication integration
- Real-time updates via subscriptions
- Mobile responsive design
- Keyboard accessibility (Tab navigation)

### Must NOT Have (Guardrails)
- No Google Calendar sync in this phase
- No recurring events (keep it simple)
- No conflict detection
- No email notifications
- No time blocking features
- No complex event templates

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (Vitest configured)
- **User wants tests**: Tests-after
- **Framework**: Vitest

### Manual QA Procedures

Each TODO includes detailed verification:

**For Frontend/UI changes:**
- Navigate to calendar route
- Interact with views and events
- Verify visual elements and responsiveness

**For Backend changes (Convex):**
- Use Convex dashboard to verify data
- Test mutations via dashboard
- Check real-time subscriptions

**For API operations:**
- Test event CRUD via UI
- Verify data persistence
- Check multi-tab sync

---

## Task Flow

```
Schema → Mutations/Queries → Auth Integration → Route Enhancement → Real-time → Tests
         ↘ (can parallelize some frontend work after schema)
```

## Parallelization

| Group | Tasks | Reason |
|-------|-------|--------|
| A | 1, 2 | Cleanup and theme can be done independently |
| B | 3 | Schema must be done before backend work |
| C | 4, 5, 6 | Can work on these after schema |
| D | 7, 8 | Route and integration work |
| E | 9, 10 | Real-time and auth |
| F | 11, 12 | Testing phase |

---

## TODOs

- [x] 1. Clean Up TanStack Start Template Code

  **What to do**:
  - Remove all demo routes in `src/routes/demo/` directory
  - Remove speakers and talks routes (template conference content)
  - Remove schedule route (template content)
  - Delete all content markdown files in `content/` directory
  - Clean up the index route to remove conference template content
  - Update __root.tsx to remove demo navigation links

  **Must NOT do**:
  - Don't remove the calendar route (we're enhancing it)
  - Don't delete core configuration files
  - Don't remove authentication setup

  **Parallelizable**: NO (should be done first for clean slate)

  **References**:
  - `src/routes/demo/` - All demo files to remove
  - `src/routes/speakers.*` - Template speaker routes to remove
  - `src/routes/talks.*` - Template talk routes to remove
  - `src/routes/schedule.*` - Template schedule route to remove
  - `content/` - All markdown content to remove

  **Acceptance Criteria**:
  - [ ] All demo routes deleted
  - [ ] All template conference routes deleted
  - [ ] All content markdown files deleted
  - [ ] App still runs without errors
  - [ ] No broken imports or references

  **Commit**: YES
  - Message: `chore: remove TanStack Start template code and demo files`
  - Files: Multiple deletions

- [x] 2. Implement VibeFlow Color Theme

  **What to do**:
  - Replace current dark theme in styles.css with VibeFlow colors
  - Add both light and dark mode color schemes from UI_SPEC
  - Update CSS variables to match VibeFlow design system
  - Add Inter font for headers and body text
  - Add JetBrains Mono for monospace (time displays)
  - Ensure Tailwind v4 theme integration works

  **Must NOT do**:
  - Don't break existing Tailwind configuration
  - Don't remove animation utilities
  - Don't modify generated style sections

  **Parallelizable**: YES (can be done independently)

  **References**:
  - `UI_SPEC.md:18-50` - Complete color palette definitions
  - `UI_SPEC.md:53-65` - Typography specifications
  - `src/styles.css` - Current theme to replace

  **Acceptance Criteria**:
  - [ ] Light mode colors match UI_SPEC exactly
  - [ ] Dark mode colors match UI_SPEC exactly
  - [ ] Font families loaded and applied correctly
  - [ ] Theme switcher works (if implemented)
  - [ ] All UI components use new color variables

  **Commit**: YES
  - Message: `feat(theme): implement VibeFlow color system and typography`
  - Files: `src/styles.css`

- [x] 3. Create Convex Schema for Calendar Data

  **What to do**:
  - Define events table with fields: title, description, startDate, endDate, userId, color, location, allDay
  - Define calendars table: name, color, userId, isDefault
  - Define userPreferences table: defaultView, weekStartDay, timeFormat, timezone
  - Add proper indexes for query performance
  - Use proper Convex validators (v.string(), v.number(), etc.)

  **Must NOT do**:
  - Don't add complex fields for features not in scope (recurring, reminders, etc.)
  - Don't over-normalize the schema

  **Parallelizable**: NO (foundation task)

  **References**:
  - `convex/schema.ts` - Current schema structure and patterns
  - `convex/todos.ts` - Example of simple CRUD pattern
  - Convex docs: Schema definition best practices

  **Acceptance Criteria**:
  - [ ] Schema file updated with new tables
  - [ ] Run `npx convex dev` → No errors
  - [ ] Tables visible in Convex dashboard
  - [ ] Can manually insert test data via dashboard

  **Commit**: YES
  - Message: `feat(convex): add calendar schema with events, calendars, and user preferences`
  - Files: `convex/schema.ts`

- [x] 4. Create Event CRUD Mutations in Convex

  **What to do**:
  - Create `events.ts` in convex directory
  - Implement createEvent mutation with validation
  - Implement updateEvent mutation with auth check
  - Implement deleteEvent mutation with ownership verification
  - Add proper error handling and validation

  **Must NOT do**:
  - Don't add complex business logic for out-of-scope features
  - Don't skip ownership checks

  **Parallelizable**: YES (after task 1)

  **References**:
  - `convex/todos.ts` - CRUD pattern example
  - `convex/_generated/server.d.ts` - Type definitions
  - Convex docs: Mutations best practices

  **Acceptance Criteria**:
  - [ ] All mutations callable from Convex dashboard
  - [ ] Create event: `npx convex run events:createEvent` → Returns new event ID
  - [ ] Update event: `npx convex run events:updateEvent` → Updates successfully
  - [ ] Delete event: `npx convex run events:deleteEvent` → Removes event
  - [ ] Error on invalid data → Clear error message

  **Commit**: YES
  - Message: `feat(convex): implement event CRUD mutations with validation`
  - Files: `convex/events.ts`

- [x] 5. Create Event Query Functions in Convex

  **What to do**:
  - Add getEventsByUser query (filter by userId)
  - Add getEventsByDateRange query (for view optimization)
  - Add getEventById query (for detail view)
  - Implement proper pagination for agenda view
  - Add indexes for performance

  **Must NOT do**:
  - Don't return events for other users
  - Don't fetch all events without limits

  **Parallelizable**: YES (after task 3)

  **References**:
  - `convex/todos.ts` - Query pattern example
  - Convex docs: Query optimization and indexes

  **Acceptance Criteria**:
  - [ ] Query user events: Returns only current user's events
  - [ ] Query by date range: Returns events within specified dates
  - [ ] Query performance: < 100ms for typical queries
  - [ ] Pagination works for agenda view

  **Commit**: YES
  - Message: `feat(convex): add event query functions with date filtering`
  - Files: `convex/events.ts`

- [x] 6. Create Calendar Management Functions

  **What to do**:
  - Create calendars.ts in convex directory
  - Add createCalendar, updateCalendar mutations
  - Add getUserCalendars query
  - Add default calendar selection logic
  - Implement calendar color management

  **Must NOT do**:
  - Don't allow users to modify other users' calendars
  - Don't create complex sharing logic

  **Parallelizable**: YES (after task 3)

  **References**:
  - `convex/todos.ts` - CRUD pattern
  - Schema from task 1

  **Acceptance Criteria**:
  - [ ] Users can create multiple calendars
  - [ ] Each calendar has unique color
  - [ ] Default calendar is marked
  - [ ] Calendar list query returns user's calendars only

  **Commit**: YES
  - Message: `feat(convex): add calendar management functions`
  - Files: `convex/calendars.ts`

- [x] 7. Enhance Calendar Route with Date Parameters

  **What to do**:
  - Update route to support date parameters: `/calendar/:view?/:date?`
  - Parse date from URL and set current date state
  - Update navigation to modify URL on date change
  - Ensure browser back/forward works correctly
  - Add date validation and fallback to today

  **Must NOT do**:
  - Don't break existing view switching
  - Don't lose state on navigation

  **Parallelizable**: NO (depends on 3-6)

  **References**:
  - `src/routes/calendar.tsx` - Current route implementation
  - TanStack Router docs: Route parameters
  - `src/components/big-calendar/components/header/date-navigator.tsx` - Date navigation component

  **Acceptance Criteria**:
  - [ ] URL updates when navigating dates: `/calendar/week/2026-01-25`
  - [ ] Direct URL access works: Navigate to specific date via URL
  - [ ] Browser back/forward navigation works
  - [ ] Invalid dates fallback to today

  **Commit**: YES
  - Message: `feat(calendar): add date-based routing parameters`
  - Files: `src/routes/calendar.tsx`, possibly route definition files

- [x] 8. Integrate Convex with Calendar Components

  **What to do**:
  - Replace sample data with Convex queries using useQuery hook
  - Add useMutation hooks for event operations
  - Connect add/edit/delete dialogs to Convex mutations
  - Implement optimistic updates for better UX
  - Add loading and error states

  **Must NOT do**:
  - Don't remove sample data until Convex is working
  - Don't skip error handling

  **Parallelizable**: NO (depends on 4-5)

  **References**:
  - `src/routes/calendar.tsx:37-65` - Sample events to replace
  - `src/routes/demo/convex.tsx` - Convex integration example
  - `src/components/big-calendar/components/dialogs/*.tsx` - Event dialogs
  - TanStack Query docs: Optimistic updates

  **Acceptance Criteria**:
  - [ ] Events load from Convex database
  - [ ] Create event via UI → Appears in calendar
  - [ ] Edit event → Changes persist
  - [ ] Delete event → Removed from view
  - [ ] Loading state shows while fetching
  - [ ] Error toast on operation failure

  **Commit**: YES
  - Message: `feat(calendar): integrate Convex for event data management`
  - Files: `src/routes/calendar.tsx`, dialog components

- [x] 9. Add Real-time Subscriptions

  **What to do**:
  - Convert queries to subscriptions for real-time updates
  - Ensure multi-tab sync works
  - Add connection status indicator
  - Handle reconnection gracefully
  - Test with multiple browser windows

  **Must NOT do**:
  - Don't create infinite re-render loops
  - Don't lose local changes on sync

  **Parallelizable**: YES (after task 8)

  **References**:
  - Convex docs: Real-time subscriptions
  - `src/routes/demo/convex.tsx` - Subscription example

  **Acceptance Criteria**:
  - [ ] Open calendar in two tabs → Changes sync instantly
  - [ ] Create event in tab A → Appears in tab B within 1 second
  - [ ] Connection indicator shows status
  - [ ] Reconnection works after network interruption

  **Commit**: YES
  - Message: `feat(calendar): add real-time sync with Convex subscriptions`
  - Files: `src/routes/calendar.tsx`

- [x] 10. Add User Authentication Integration

  **What to do**:
  - Get current user from WorkOS context
  - Pass userId to all Convex queries and mutations
  - Show user's name/avatar in calendar header
  - Add sign out option
  - Ensure unauthenticated users see appropriate message

  **Must NOT do**:
  - Don't expose other users' data
  - Don't allow unauthenticated access to calendar

  **Parallelizable**: YES (after task 8)

  **References**:
  - `src/routes/demo/workos.tsx` - WorkOS integration example
  - WorkOS AuthKit documentation
  - `src/routes/__root.tsx` - Root layout for auth context

  **Acceptance Criteria**:
  - [ ] Only authenticated users can access calendar
  - [ ] Each user sees only their events
  - [ ] User info displays in header
  - [ ] Sign out works correctly
  - [ ] Unauthenticated redirect to login

  **Commit**: YES
  - Message: `feat(calendar): integrate WorkOS authentication for user-specific calendars`
  - Files: `src/routes/calendar.tsx`, possibly auth utilities

- [x] 11. Write Component Tests

  **What to do**:
  - Test calendar route renders correctly
  - Test view switching functionality
  - Test date navigation
  - Test event CRUD operations (mocked)
  - Test error states and loading states

  **Must NOT do**:
  - Don't test third-party components internals
  - Don't write brittle snapshot tests

  **Parallelizable**: YES (after main implementation)

  **References**:
  - Vitest documentation
  - `@testing-library/react` patterns
  - Existing test examples in project

  **Acceptance Criteria**:
  - [ ] Run `pnpm test` → All calendar tests pass
  - [ ] Test coverage for critical paths > 70%
  - [ ] Tests are maintainable and clear

  **Commit**: YES
  - Message: `test(calendar): add component tests for calendar functionality`
  - Files: `src/routes/calendar.test.tsx`, test utilities

- [x] 12. Write Integration Tests for Convex Functions

  **What to do**:
  - Test event CRUD mutations with various inputs
  - Test query functions with filters
  - Test validation and error cases
  - Test authorization checks
  - Mock Convex context for tests

  **Must NOT do**:
  - Don't test against production database
  - Don't skip edge cases

  **Parallelizable**: YES (after Convex implementation)

  **References**:
  - Convex testing documentation
  - Vitest documentation
  - `convex/events.ts`, `convex/calendars.ts` - Functions to test

  **Acceptance Criteria**:
  - [ ] All Convex functions have test coverage
  - [ ] Edge cases are tested (invalid data, auth failures)
  - [ ] Tests run in CI without external dependencies

  **Commit**: YES
  - Message: `test(convex): add integration tests for calendar functions`
  - Files: `convex/events.test.ts`, `convex/calendars.test.ts`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `chore: remove template code` | Multiple deletions | pnpm dev runs |
| 2 | `feat(theme): implement VibeFlow colors` | src/styles.css | Visual check |
| 3 | `feat(convex): add calendar schema` | convex/schema.ts | npx convex dev |
| 4-6 | `feat(convex): implement calendar backend` | convex/*.ts | Dashboard tests |
| 7-8 | `feat(calendar): integrate with Convex` | src/routes/calendar.tsx | Manual UI test |
| 9-10 | `feat(calendar): add real-time and auth` | src/routes/calendar.tsx | Multi-tab test |
| 11-12 | `test: add calendar test coverage` | *.test.ts | pnpm test |

---

## Success Criteria

### Verification Commands
```bash
npx convex dev  # Convex backend runs without errors
pnpm dev        # Frontend runs, calendar loads
pnpm test       # All tests pass
```

### Manual Testing Checklist
- [ ] Create, edit, delete events works
- [ ] Calendar views (day, week, month, year, agenda) display correctly
- [ ] Date navigation updates URL
- [ ] Multi-tab real-time sync works
- [ ] Mobile responsive design works
- [ ] Authentication prevents unauthorized access

### Final Checklist
- [ ] All "Must Have" features present
- [ ] All "Must NOT Have" items excluded
- [ ] Tests provide adequate coverage
- [ ] No console errors in development
- [ ] Performance is acceptable (< 500ms view switches)