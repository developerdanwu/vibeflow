## [2026-01-25T07:38:39] Quick Add Popover - Event Bar Trigger

### Implementation Approach
- Changed QuickAddEventPopover from wrapper component to self-contained component with its own trigger
- Removed whole-cell click behavior from DayCell
- Placed event bar inside the events list area (after events map)

### Key Decisions
1. **Event bar placement**: Added after the events map loop (line 77 in day-cell.tsx) so it appears in the same vertical list as event badges
2. **Desktop-only**: Used `className="hidden lg:flex"` to show only on desktop (lg breakpoint)
3. **Popover positioning**: `side="right"` and `align="start"` to open to the right of the trigger
4. **Styling**: Matched MonthEventBadge height (`h-6.5`) with dashed border to indicate it's an action item

### Component Changes
**quick-add-event-popover.tsx**:
- Interface: `{ children: React.ReactNode; date: Date }` → `{ className?: string; date: Date }`
- Added imports: `Plus` from lucide-react, `cn` from @/lib/utils
- Replaced `<PopoverTrigger>{children}</PopoverTrigger>` with styled event bar
- Added `side="right"` `align="start"` to PopoverContent

**day-cell.tsx**:
- Removed QuickAddEventPopover wrapper from entire cell
- Removed interactive attributes: role="button", tabIndex, onClick, onKeyDown
- Removed cursor-pointer from className
- Removed handleCellClick function
- Removed unused imports: useCalendar, setSelectedDate
- Added `<QuickAddEventPopover date={date} className="hidden lg:flex" />` inside events container

### Patterns Followed
- Event bar styling matches MonthEventBadge visual pattern (height, border radius, padding)
- Dashed border distinguishes it as a placeholder/action item vs solid borders on actual events
- Hover state uses primary color to indicate interactivity
- Desktop-only visibility aligns with MonthEventBadge which also uses `hidden lg:flex`

### Verification Status
✅ Code changes complete and verified
✅ TypeScript compilation clean
✅ No linting errors in modified files
⏸️ Visual/functional testing requires running dev server (manual verification needed)
