# Draft: Sidebar Layout Redesign

## Requirements (confirmed)
- Replace current top navigation with shadcn sidebar
- Use resizable panels (collapsible sidebar)
- Calendar takes up the rest of the page

## Technical Findings

### Current State
- **Root layout**: `src/routes/__root.tsx` - has providers and a global Header component
- **Header**: `src/components/Header.tsx` - hamburger menu with 320px slide-out sidebar
- **Calendar page**: `src/routes/calendar.tsx` - self-contained with its own CalendarHeader
- **No persistent sidebar** - only appears on menu click (dated pattern)

### Existing shadcn Components (20 installed)
- Standard: accordion, avatar, badge, button, card, dialog, form, input, label, popover, scroll-area, select, skeleton, switch, textarea, tooltip
- Custom: avatar-group, single-calendar, single-day-picker, time-input

### Components NOT installed (need to add)
- ❌ `sidebar` - shadcn sidebar component
- ❌ `resizable` - for resizable panels

### UI_SPEC.md Layout Principles (Line 71-78)
- **Sidebar**: 280px fixed width (collapsible to 64px)
- **Main Content**: Fluid with 24px padding
- Mobile breakpoints defined

### Configuration
- shadcn style: "new-york"
- Base color: zinc
- CSS variables enabled

## Open Questions
- What navigation items should be in the sidebar?
- Should the calendar header (date nav, view switcher) stay where it is or integrate into sidebar?
- Should the sidebar be the same across all pages or calendar-specific?
- What about mobile responsiveness - bottom tabs or hamburger menu?

## Scope Boundaries
- INCLUDE: TBD
- EXCLUDE: TBD
