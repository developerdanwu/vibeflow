# Big Calendar Integration Plan for VibeFlow

## Executive Summary
This document outlines a comprehensive plan to integrate the big-calendar component library into the VibeFlow application. The integration will provide a fully-featured calendar system with 5 different views, drag-and-drop functionality, and multi-calendar support.

---

## Phase 1: Dependencies & Package Installation ✅ COMPLETED

### Required NPM Packages
The following packages have been installed:

```bash
# Core Calendar Dependencies
✅ pnpm add date-fns@^3                    # Date manipulation (required)
✅ pnpm add react-dnd@^16.0.1             # Drag and drop core
✅ pnpm add react-dnd-html5-backend@^16.0.1  # HTML5 backend for react-dnd
✅ pnpm add react-day-picker@8.10.1       # Calendar picker component
✅ pnpm add react-aria-components@^1.6.0  # Accessibility components

# Form Management (required for event dialogs)
✅ pnpm add react-hook-form@^7.55.0       # Form handling
✅ pnpm add @hookform/resolvers@^5.0.1    # Form validation resolvers

# Radix UI Components (for shadcn components)
✅ pnpm add @radix-ui/react-accordion@^1.2.7
✅ pnpm add @radix-ui/react-avatar@^1.1.6
✅ pnpm add @radix-ui/react-dialog@^1.1.10
✅ pnpm add @radix-ui/react-label@^2.1.4
✅ pnpm add @radix-ui/react-popover@^1.1.10
✅ pnpm add @radix-ui/react-scroll-area@^1.2.5
✅ pnpm add @radix-ui/react-select@^2.2.2
✅ pnpm add @radix-ui/react-separator@^1.1.4
✅ pnpm add @radix-ui/react-slot@^1.2.0
✅ pnpm add @radix-ui/react-switch@^1.2.2
✅ pnpm add @radix-ui/react-tooltip@^1.2.3

# Additional packages installed:
✅ pnpm add @xstate/store              # For state management
```

### Already Available in VibeFlow
✅ class-variance-authority
✅ clsx
✅ lucide-react
✅ tailwind-merge
✅ tailwindcss-animate
✅ zod

---

## Phase 2: shadcn/ui Component Installation ✅ COMPLETED

### Required shadcn Components
All components have been installed:

```bash
# Core UI Components
✅ pnpm dlx shadcn@latest add accordion
✅ pnpm dlx shadcn@latest add avatar
✅ pnpm dlx shadcn@latest add badge
✅ pnpm dlx shadcn@latest add button
✅ pnpm dlx shadcn@latest add dialog
✅ pnpm dlx shadcn@latest add form
✅ pnpm dlx shadcn@latest add input
✅ pnpm dlx shadcn@latest add label
✅ pnpm dlx shadcn@latest add popover
✅ pnpm dlx shadcn@latest add scroll-area
✅ pnpm dlx shadcn@latest add select
✅ pnpm dlx shadcn@latest add skeleton
✅ pnpm dlx shadcn@latest add switch
✅ pnpm dlx shadcn@latest add textarea
✅ pnpm dlx shadcn@latest add tooltip
```

### Custom Components to Migrate
These components have been migrated to `src/components/ui/`:
- ✅ `avatar-group.tsx` - Custom avatar group component
- ✅ `single-calendar.tsx` - Single date picker wrapper
- ✅ `single-day-picker.tsx` - Day picker component
- ✅ `time-input.tsx` - Custom time input component
- ✅ `use-disclosure.ts` - Hook for disclosure state management

---

## Phase 3: Core Calendar Migration

### Directory Structure ✅ CREATED
The following directory structure has been created:

```
src/
├── components/
│   ├── big-calendar/              # Main calendar module ✅
│   │   ├── components/
│   │   │   ├── agenda-view/      # Agenda view components ✅
│   │   │   ├── dialogs/          # Event management dialogs ✅
│   │   │   ├── dnd/              # Drag and drop components ✅
│   │   │   ├── header/           # Calendar header components ✅
│   │   │   ├── month-view/       # Month view components ✅
│   │   │   ├── week-and-day-view/ # Week and day view components ✅
│   │   │   └── year-view/        # Year view components ✅
│   │   ├── contexts/             # Calendar context providers ✅
│   │   ├── hooks/                # Calendar-specific hooks ✅
│   │   ├── store/                # XState store ✅
│   │   ├── helpers.ts            # Utility functions ✅
│   │   ├── interfaces.ts         # TypeScript interfaces ✅
│   │   ├── schemas.ts            # Zod schemas for validation ✅
│   │   └── types.ts              # TypeScript type definitions ✅
│   └── ui/                        # shadcn/ui components ✅
```

### Migration Order

#### Step 1: Core Types & Interfaces ✅ COMPLETED
1. ✅ Copied `big-calendar/src/calendar/types.ts` → `src/components/big-calendar/types.ts`
2. ✅ Copied `big-calendar/src/calendar/interfaces.ts` → `src/components/big-calendar/interfaces.ts`
3. ✅ Copied `big-calendar/src/calendar/schemas.ts` → `src/components/big-calendar/schemas.ts`

#### Step 2: Helper Functions ✅ COMPLETED
1. ✅ Copied `big-calendar/src/calendar/helpers.ts` → `src/components/big-calendar/helpers.ts`

#### Step 3: Context & State Management ✅ COMPLETED
1. ✅ Created XState Store at `src/components/big-calendar/store/calendarStore.ts`
2. ✅ Replaced React Context with XState Store implementation
3. ⏳ Convex integration pending (Phase 4)

#### Step 4: View Components ✅ COMPLETED
1. **Month View** ✅ COMPLETED
   - ✅ `calendar-month-view.tsx`
   - ✅ `day-cell.tsx`
   - ✅ `event-bullet.tsx`
   - ✅ `month-event-badge.tsx`

2. **Week & Day Views** ✅ COMPLETED
   - ✅ `calendar-week-view.tsx`
   - ✅ `calendar-day-view.tsx`
   - ✅ `calendar-time-line.tsx`
   - ✅ `event-block.tsx`
   - ✅ Multi-day event rows

3. **Year View** ✅ COMPLETED
   - ✅ `calendar-year-view.tsx`
   - ✅ `year-view-month.tsx`
   - ✅ `year-view-day-cell.tsx`

4. **Agenda View** ✅ COMPLETED
   - ✅ `calendar-agenda-view.tsx`
   - ✅ `agenda-day-group.tsx`
   - ✅ `agenda-event-card.tsx`

#### Step 5: Drag & Drop Implementation ✅ COMPLETED
All DnD components migrated:
- ✅ `dnd-provider.tsx` - Main DnD context
- ✅ `draggable-event.tsx` - Draggable event wrapper
- ✅ `droppable-day-cell.tsx` - Drop zones for month view
- ✅ `droppable-time-block.tsx` - Drop zones for week/day views
- ✅ `custom-drag-layer.tsx` - Visual feedback during drag

#### Step 6: Event Management Dialogs ✅ COMPLETED
- ✅ `add-event-dialog.tsx`
- ✅ `edit-event-dialog.tsx`
- ✅ `event-details-dialog.tsx`

#### Step 7: Calendar Header ✅ COMPLETED
- ✅ `calendar-header.tsx`
- ✅ `date-navigator.tsx`
- ✅ `today-button.tsx`
- ✅ `user-select.tsx`

#### Step 8: Container & Settings ✅ COMPLETED
- ✅ `client-container.tsx` - Main calendar container
- ✅ `change-badge-variant-input.tsx` - Badge variant selector
- ✅ `change-working-hours-input.tsx` - Working hours configuration
- ✅ `change-visible-hours-input.tsx` - Visible hours configuration

#### Step 9: UI/UX Improvements ✅ COMPLETED
1. **Font System Update** ✅ COMPLETED
   - Added Inter font for better readability and modern look
   - Created dedicated `calendar.css` for calendar-specific styles
   - Applied font-feature-settings for improved typography
   - Fixed font rendering issues in calendar components

2. **View Navigation Enhancement** ✅ COMPLETED
   - Implemented view switching using search params
   - Single route `/calendar?view=month|week|day|year|agenda`
   - Maintains browser history properly
   - No need for multiple route files
   - View buttons with active state styling

---

## Phase 4: Integration with VibeFlow

### Route Integration
Create calendar routes in `src/routes/`:

```typescript
// src/routes/calendar.tsx - Main calendar route
// src/routes/calendar/day.tsx - Day view route
// src/routes/calendar/week.tsx - Week view route
// src/routes/calendar/month.tsx - Month view route
// src/routes/calendar/year.tsx - Year view route
// src/routes/calendar/agenda.tsx - Agenda view route
```

### Convex Integration

#### Schema Updates
Add to `convex/schema.ts`:

```typescript
events: defineTable({
  title: v.string(),
  description: v.optional(v.string()),
  startDate: v.string(), // ISO string
  endDate: v.string(),   // ISO string
  color: v.union(
    v.literal("blue"),
    v.literal("green"),
    v.literal("red"),
    v.literal("yellow"),
    v.literal("purple"),
    v.literal("orange")
  ),
  userId: v.id("users"),
  calendarId: v.id("calendars"),
  isAllDay: v.boolean(),
  recurrence: v.optional(v.object({
    pattern: v.string(),
    endDate: v.optional(v.string())
  }))
})
.index("by_user", ["userId"])
.index("by_calendar", ["calendarId"])
.index("by_date_range", ["startDate", "endDate"]),

calendars: defineTable({
  name: v.string(),
  color: v.string(),
  userId: v.id("users"),
  isDefault: v.boolean(),
  googleCalendarId: v.optional(v.string())
})
.index("by_user", ["userId"])
```

#### Convex Functions
Create these functions:
- `getEvents.ts` - Query events with filters
- `createEvent.ts` - Create new event mutation
- `updateEvent.ts` - Update event mutation
- `deleteEvent.ts` - Delete event mutation
- `getCalendars.ts` - Query user calendars

### Google Calendar Integration
Integrate with existing Google Calendar sync:
1. Map Google Calendar events to local schema
2. Implement bidirectional sync
3. Handle conflict resolution
4. Real-time updates via Convex subscriptions

### State Management with XState Store

Replace React Context with XState Store:

```typescript
// src/components/big-calendar/store/calendarStore.ts
import { createStore } from '@xstate/store';

export const calendarStore = createStore({
  selectedDate: new Date(),
  selectedUserId: 'all' as string | 'all',
  badgeVariant: 'colored' as TBadgeVariant,
  visibleHours: { from: 7, to: 18 },
  workingHours: { /* ... */ },
  events: [] as IEvent[],
  users: [] as IUser[],
}, {
  setSelectedDate: (context, date: Date) => ({ selectedDate: date }),
  setSelectedUserId: (context, userId: string | 'all') => ({ selectedUserId: userId }),
  // ... other actions
});
```

---

## Phase 5: Testing & Optimization

### Testing Requirements
1. Unit tests for date utilities
2. Component tests for each view
3. Integration tests for drag-and-drop
4. E2E tests for critical user flows

### Performance Optimizations
1. Implement virtual scrolling for large event lists
2. Memoize expensive calculations
3. Lazy load calendar views
4. Optimize re-renders with React.memo

### Mobile Responsiveness
1. Test all views on mobile devices
2. Implement touch gestures for mobile
3. Optimize layouts for small screens
4. Add mobile-specific navigation

---

## Phase 6: Cleanup & Documentation

### Post-Integration Cleanup
1. Remove `/big-calendar` directory after successful migration
2. Update import paths to use `@/components/big-calendar`
3. Remove duplicate dependencies
4. Update TypeScript configurations

### Documentation Updates
1. Update AGENTS.md with calendar implementation details
2. Create calendar-specific documentation
3. Add usage examples
4. Document API endpoints

---

## Implementation Timeline

### Week 1 ✅ COMPLETED
- [x] Install all dependencies
- [x] Install shadcn components
- [x] Set up directory structure
- [x] Migrate core types and interfaces

### Week 2 ✅ COMPLETED
- [x] Migrate calendar views (Month, Week, Day, Year, Agenda)
- [x] Implement drag-and-drop components
- [x] Create event management dialogs
- [x] Migrate calendar header components
- [x] Migrate container & settings components
- [x] Create calendar route at `/calendar`
- [x] Fix font rendering - Added Inter font for calendar components
- [x] Implement view switching using search params instead of routes

### Week 3
- [ ] Integrate with Convex backend
- [ ] Implement Google Calendar sync
- [ ] Set up XState Store

### Week 4
- [ ] Testing and bug fixes
- [ ] Mobile optimization
- [ ] Performance optimization
- [ ] Documentation

---

## Risk Mitigation

### Potential Issues & Solutions

1. **Version Conflicts**
   - React 19 vs React 18 compatibility
   - Solution: Update react-dnd if needed, test thoroughly

2. **Styling Conflicts**
   - Tailwind v4 vs v3 differences
   - Solution: Review and update class names, use compatibility mode if needed

3. **State Management Migration**
   - Context to XState Store conversion
   - Solution: Create adapter layer during transition

4. **Type Compatibility**
   - TypeScript version differences
   - Solution: Update types as needed, use type assertions sparingly

---

## Success Criteria

✅ All 5 calendar views functional (Day, Week, Month, Year, Agenda)
✅ View switching via search params instead of separate routes
✅ Modern font system (Inter/Geist) implemented for better readability
✅ Drag-and-drop working across all applicable views
⏳ Events syncing with Google Calendar
⏳ Real-time updates via Convex
⏳ Mobile responsive design
⏳ All tests passing
✅ Performance metrics met (< 500ms view render)
⏳ Documentation complete

---

## Import Path Updates

After migration, all imports within the calendar module should be updated:

### Old Import Paths (big-calendar):
```typescript
import { useCalendar } from "@/calendar/contexts/calendar-context"
import { IEvent } from "@/calendar/interfaces"
import { helpers } from "@/calendar/helpers"
```

### New Import Paths (VibeFlow):
```typescript
import { useCalendar } from "@/components/big-calendar/contexts/calendar-context"
import { IEvent } from "@/components/big-calendar/interfaces"
import { helpers } from "@/components/big-calendar/helpers"
```

## Notes for Implementation

1. **DO NOT** modify any files until plan is approved
2. Use shadcn CLI for component installation when possible
3. Preserve existing VibeFlow patterns and conventions
4. Maintain compatibility with existing authentication (WorkOS)
5. Ensure all calendar data respects user privacy
6. Follow existing code style (tabs, double quotes, etc.)
7. All calendar-related code goes under `src/components/big-calendar/`
8. Shared UI components (from shadcn) go under `src/components/ui/`

---

**Document Status:** IN PROGRESS - WEEK 2 COMPLETE, PHASE 3 COMPLETE
**Created:** January 24, 2026
**Author:** AI Assistant