# Dashboard Route Implementation Plan

## Context

### Original Request
Create a comprehensive plan to implement the `/dashboard` route for VibeFlow, adapting the existing calendar implementation and removing all template code from TanStack Start to match the specifications in SPEC.md and UI_SPEC.md.

### Interview Summary
**Key Discussions**:
- Dashboard route implementation as specified in UI_SPEC.md (lines 134-154)
- Reuse existing calendar components from `/big-calendar/` 
- Remove all example/template content (Haute Pâtisserie conference)
- Calendar implementation already exists and should be adapted

**Research Findings**:
- Existing calendar route at `/calendar` with full implementation
- Calendar components in `src/components/big-calendar/`
- Current Convex schema only has `products` and `todos` tables
- Example content from conference template throughout the app
- WorkOS auth and Convex providers already configured

### Identified Gaps
**Addressed Requirements**:
- Convex schema needs expansion for events, time blocks, tasks, and user data
- Sample data needs replacement with Convex queries
- Authentication guard needed for dashboard route
- Charts library needed for analytics (This Week Summary)
- Real-time data subscriptions for live updates

---

## Work Objectives

### Core Objective
Implement a fully functional dashboard route that serves as the main authenticated landing page, displaying productivity metrics, agenda, tasks, and quick actions while integrating with the existing calendar infrastructure.

### Concrete Deliverables
- `/dashboard` route file with all specified widgets
- Convex schema for events, time blocks, tasks, and activity
- Dashboard-specific components (widgets)
- Data fetching with Convex queries
- Removal of all template/example code
- Authentication protection for dashboard

### Definition of Done
- [ ] Dashboard route accessible at `/dashboard` 
- [ ] All 7 dashboard widgets display with appropriate data
- [ ] Authentication required to access dashboard
- [ ] Real-time updates via Convex subscriptions
- [ ] All template/example code removed
- [ ] Responsive design for mobile/tablet/desktop

### Must Have
- Today's Agenda widget showing next 3-5 events
- Current Time Block indicator with progress
- Quick Actions toolbar (New Event, Time Block, Task)
- This Week Summary time allocation chart
- Upcoming Tasks list (top 5 by priority)
- Focus Time Available metric
- Recent Activity feed
- Real-time data updates
- Mobile responsive layout

### Must NOT Have (Guardrails)
- Do NOT implement full CRUD operations for events/tasks (just display)
- Do NOT implement Google Calendar sync (use local data only)
- Do NOT implement complex analytics (keep charts simple)
- Do NOT modify authentication flow (use existing WorkOS setup)
- Do NOT create new calendar views (reuse existing components)
- Do NOT leave any conference template content

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO
- **User wants tests**: Manual-only for now
- **Framework**: None (manual verification)

### Manual QA Procedures

Each TODO includes detailed verification procedures:

**Dashboard Route Verification:**
- Navigate to: `http://localhost:3000/dashboard`
- Verify: All 7 widgets render correctly
- Check: Responsive layout on different screen sizes
- Confirm: Real-time updates when data changes

**Data Flow Verification:**
- Open Convex dashboard
- Create/modify test data
- Verify: Dashboard reflects changes immediately
- Check: No console errors during updates

---

## Task Flow

```
1. Schema → 2. Clean Template → 3. Route → 4. Components → 5. Data → 6. Polish
```

## Parallelization

| Group | Tasks | Reason |
|-------|-------|--------|
| A | 1, 2 | Independent: schema and cleanup can happen in parallel |
| B | 4, 5 | Components and initial data setup can overlap |

| Task | Depends On | Reason |
|------|------------|--------|
| 3 | 1, 2 | Need clean codebase and schema before route |
| 4 | 3 | Components need route structure |
| 5 | 1 | Data fetching needs schema |
| 6 | 4, 5 | Polish after functionality complete |

---

## TODOs

- [ ] 1. Expand Convex Schema for Dashboard Data

  **What to do**:
  - Define schema for events table (title, description, startDate, endDate, userId, calendarId, color, recurrence)
  - Define schema for timeBlocks table (title, startTime, endTime, userId, category, isActive, recurrence)
  - Define schema for tasks table (title, description, priority, dueDate, userId, completed, category)
  - Define schema for activity table (type, description, timestamp, userId, relatedId)
  - Define schema for users table (name, email, timezone, preferences)
  - Add proper indexes for query performance

  **Must NOT do**:
  - Do not delete existing todos table (might be used elsewhere)
  - Do not implement complex relations (keep it simple)

  **Parallelizable**: YES (with task 2)

  **References**:
  - `convex/schema.ts` - Existing schema structure to follow
  - `convex/todos.ts` - Pattern for Convex functions
  - `.cursorrules` - Convex schema patterns and best practices
  - SPEC.md lines 61-66 (Task Management data requirements)
  - UI_SPEC.md lines 134-154 (Dashboard widget requirements)

  **Acceptance Criteria**:
  - [ ] Command: `npx convex dev` → Runs without schema errors
  - [ ] Verify in Convex dashboard: All 5 new tables visible
  - [ ] Create test record in each table via dashboard
  - [ ] No TypeScript errors in convex/_generated/

  **Commit**: YES
  - Message: `feat(convex): add dashboard data schema`
  - Files: `convex/schema.ts`

- [ ] 2. Remove Template/Example Code

  **What to do**:
  - Delete speaker/talk related routes (`src/routes/speakers.*`, `src/routes/talks.*`, `src/routes/schedule.index.tsx`)
  - Remove conference content directory (`content/`)
  - Clean up index route - remove conference hero, keep minimal landing
  - Remove conference components (SpeakerCard, TalkCard, RemyAssistant, HeroCarousel)
  - Update page title and meta tags in __root.tsx
  - Remove conference-specific styles if any
  - Ensure Geist font is configured as the default font family

  **Must NOT do**:
  - Do not delete calendar components or routes
  - Do not remove auth/provider setup
  - Do not delete demo routes (might be useful reference)

  **Parallelizable**: YES (with task 1)

  **References**:
  - `src/routes/index.tsx` - Current landing page to simplify
  - `src/routes/__root.tsx:36` - Title to update
  - `src/components/` - Components to review and clean
  - README.md - Remove conference example documentation

  **Acceptance Criteria**:
  - [ ] Command: `ls src/routes/speakers.*` → No such files
  - [ ] Command: `ls content/` → Directory not found
  - [ ] Browse to `/` → Simple landing page, no conference content
  - [ ] Command: `pnpm build` → Builds successfully
  - [ ] Search codebase for "Pâtisserie" → No results

  **Commit**: YES
  - Message: `chore: remove template conference code`
  - Files: Multiple deletions and edits

- [ ] 3. Create Dashboard Route

  **What to do**:
  - Create `src/routes/dashboard.tsx` file
  - Set up route with authentication check (redirect if not logged in)
  - Create main dashboard layout with responsive grid
  - Add placeholder sections for all 7 widgets
  - Import CalendarProvider for calendar context
  - Set up container with proper spacing and max-width

  **Must NOT do**:
  - Do not implement widget logic yet (just structure)
  - Do not copy complex patterns from deleted routes

  **Parallelizable**: NO (depends on tasks 1, 2)

  **References**:
  - `src/routes/calendar.tsx` - Route structure pattern to follow
  - UI_SPEC.md lines 134-154 - Dashboard layout requirements
  - `src/integrations/workos/provider` - Auth context for protection
  - `src/components/big-calendar/contexts/calendar-context.tsx` - Calendar context to use

  **Acceptance Criteria**:
  - [ ] Navigate to `/dashboard` while logged out → Redirects to login
  - [ ] Navigate to `/dashboard` while logged in → Shows dashboard layout
  - [ ] Inspect page → 7 placeholder sections visible
  - [ ] Resize browser → Responsive grid adjusts properly
  - [ ] Console → No errors or warnings

  **Commit**: YES
  - Message: `feat: add dashboard route with layout`
  - Files: `src/routes/dashboard.tsx`

- [ ] 4. Create Dashboard Components

  **What to do**:
  - Create `src/components/dashboard/TodaysAgenda.tsx` - List next 3-5 events
  - Create `src/components/dashboard/CurrentTimeBlock.tsx` - Active block with progress bar
  - Create `src/components/dashboard/QuickActions.tsx` - Toolbar with 3 action buttons
  - Create `src/components/dashboard/WeekSummary.tsx` - Time allocation chart
  - Create `src/components/dashboard/UpcomingTasks.tsx` - Priority-sorted task list
  - Create `src/components/dashboard/FocusTimeMetric.tsx` - Available focus time display
  - Create `src/components/dashboard/RecentActivity.tsx` - Activity feed list
  - Use existing UI components from shadcn where applicable

  **Must NOT do**:
  - Do not implement complex interactions yet
  - Do not connect to real data yet (use mock data)

  **Parallelizable**: YES (can start with task 5)

  **References**:
  - `src/components/big-calendar/components/agenda-view/agenda-event-card.tsx` - Event display pattern
  - UI_SPEC.md lines 137-147 - Widget specifications
  - `src/components/ui/` - Existing UI components to leverage
  - `src/components/big-calendar/components/header/calendar-header.tsx` - Header pattern

  **Acceptance Criteria**:
  - [ ] All 7 components created and exported
  - [ ] Import components in dashboard route → No errors
  - [ ] Each component renders with mock data
  - [ ] Components use consistent styling with app theme
  - [ ] TypeScript → No type errors

  **Commit**: YES
  - Message: `feat: add dashboard widget components`
  - Files: `src/components/dashboard/*.tsx`

- [ ] 5. Implement Convex Data Layer

  **What to do**:
  - Create `convex/events.ts` with queries (getTodaysEvents, getWeekEvents)
  - Create `convex/timeBlocks.ts` with queries (getCurrentBlock, getActiveBlocks)
  - Create `convex/tasks.ts` with queries (getUpcomingTasks, getTasksByPriority)
  - Create `convex/activity.ts` with queries (getRecentActivity)
  - Create `convex/analytics.ts` with queries (getWeekSummary, getFocusTime)
  - Add mutations for Quick Actions (createEvent, createTimeBlock, createTask)
  - Set up proper data validation with Convex validators

  **Must NOT do**:
  - Do not implement complex business logic
  - Do not add external API calls

  **Parallelizable**: YES (can start with task 4)

  **References**:
  - `convex/todos.ts` - Convex function patterns
  - Convex docs for query/mutation patterns
  - SPEC.md lines 61-85 - Data requirements

  **Acceptance Criteria**:
  - [ ] Command: `npx convex functions` → All functions listed
  - [ ] Test each query in Convex dashboard → Returns expected shape
  - [ ] Create test data via mutations → Data persists
  - [ ] TypeScript in components → Can import and use queries
  - [ ] Subscribe to queries → Real-time updates work

  **Commit**: YES  
  - Message: `feat: add convex functions for dashboard`
  - Files: `convex/events.ts`, `convex/timeBlocks.ts`, `convex/tasks.ts`, `convex/activity.ts`, `convex/analytics.ts`

- [ ] 6. Connect Dashboard to Real Data

  **What to do**:
  - Replace mock data in dashboard components with Convex queries
  - Add useQuery hooks for real-time subscriptions
  - Implement Quick Actions to trigger Convex mutations
  - Add loading states with skeletons
  - Add error handling for failed queries
  - Ensure responsive updates when data changes

  **Must NOT do**:
  - Do not implement complex forms (keep Quick Actions simple)
  - Do not add optimistic updates (rely on real-time)

  **Parallelizable**: NO (depends on tasks 4, 5)

  **References**:
  - `src/routes/demo/convex.tsx` - Convex hook usage examples
  - TanStack Query patterns for data fetching
  - `src/components/big-calendar/components/agenda-view/calendar-agenda-view.tsx` - Data integration pattern

  **Acceptance Criteria**:
  - [ ] Add test data via Convex dashboard → Appears on dashboard immediately
  - [ ] Modify data → Dashboard updates in real-time
  - [ ] Click Quick Action buttons → Creates new items successfully
  - [ ] Network tab → Convex subscriptions active
  - [ ] Loading states → Display while data fetches
  - [ ] Error states → Handle gracefully if queries fail

  **Commit**: YES
  - Message: `feat: connect dashboard to convex data`
  - Files: `src/components/dashboard/*.tsx`, `src/routes/dashboard.tsx`

- [ ] 7. Add Week Summary Chart

  **What to do**:
  - Install shadcn chart components (uses Recharts under the hood)
  - Run: `pnpm dlx shadcn@latest add chart`
  - Create chart component for time allocation using shadcn/ui charts
  - Display pie/donut chart with category breakdown
  - Use theme colors for consistency
  - Add hover tooltips with details
  - Make responsive for mobile

  **Must NOT do**:
  - Do not install chart libraries directly (use shadcn's chart)
  - Do not add complex chart interactions

  **Parallelizable**: NO (depends on task 6)

  **References**:
  - UI_SPEC.md lines 283-294 - Analytics chart requirements
  - shadcn/ui charts documentation
  - Theme colors from Tailwind config

  **Acceptance Criteria**:
  - [ ] Chart renders with time allocation data
  - [ ] Hover on segments → Shows tooltip with hours
  - [ ] Resize window → Chart scales appropriately
  - [ ] Colors match app theme
  - [ ] No console errors from chart library

  **Commit**: YES
  - Message: `feat: add time allocation chart to dashboard`
  - Files: `src/components/dashboard/WeekSummary.tsx`

- [ ] 8. Polish and Optimize

  **What to do**:
  - Ensure Geist font is set as default font family in the app
  - Update font configuration in Tailwind/CSS if needed
  - Add smooth transitions and micro-animations
  - Optimize component re-renders with React.memo
  - Add keyboard shortcuts for Quick Actions (Cmd+N for new)
  - Ensure mobile responsive design works perfectly
  - Add empty states for widgets with no data
  - Test with various data scenarios
  - Update page title to "Dashboard - VibeFlow"

  **Must NOT do**:
  - Do not over-optimize prematurely
  - Do not add features beyond spec

  **Parallelizable**: NO (final task)

  **References**:
  - UI_SPEC.md lines 475-493 - Animation specifications
  - UI_SPEC.md lines 417-436 - Mobile responsiveness
  - Best practices for React performance

  **Acceptance Criteria**:
  - [ ] All animations smooth at 60fps
  - [ ] Mobile view → All widgets stack properly
  - [ ] Keyboard shortcut Cmd+K → Opens quick create
  - [ ] Empty data → Shows helpful empty states
  - [ ] Performance → No unnecessary re-renders
  - [ ] Page title → Shows "Dashboard - VibeFlow"
  - [ ] Lighthouse score → Good performance metrics

  **Commit**: YES
  - Message: `feat: polish dashboard with animations and optimizations`
  - Files: `src/components/dashboard/*.tsx`, `src/routes/dashboard.tsx`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(convex): add dashboard data schema` | convex/schema.ts | npx convex dev |
| 2 | `chore: remove template conference code` | Multiple files | pnpm build |
| 3 | `feat: add dashboard route with layout` | src/routes/dashboard.tsx | Navigate to /dashboard |
| 4 | `feat: add dashboard widget components` | src/components/dashboard/*.tsx | Components render |
| 5 | `feat: add convex functions for dashboard` | convex/*.ts | Convex dashboard test |
| 6 | `feat: connect dashboard to convex data` | Component updates | Real-time updates work |
| 7 | `feat: add time allocation chart` | WeekSummary.tsx | Chart displays |
| 8 | `feat: polish dashboard` | Multiple files | Full dashboard working |

---

## Success Criteria

### Verification Commands
```bash
pnpm dev                          # Start dev server
npx convex dev                    # Start Convex backend
open http://localhost:3000/dashboard  # View dashboard
pnpm build                        # Build succeeds
pnpm check                        # No linting errors
```

### Final Checklist
- [ ] Dashboard route works and requires authentication
- [ ] All 7 widgets display with real data
- [ ] Real-time updates via Convex subscriptions
- [ ] Mobile responsive design works
- [ ] All template code removed
- [ ] No console errors or warnings
- [ ] Quick Actions create new items
- [ ] Week summary chart displays correctly
- [ ] Focus time metric calculates properly
- [ ] Recent activity shows latest updates