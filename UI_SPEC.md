# VibeFlow - UI/UX Specification

**Version:** 1.0.0  
**Last Updated:** January 24, 2026  
**Status:** Design Ready

---

## Visual Design System

### Brand Identity
- **Logo:** Clean, minimal calendar icon with flowing time blocks
- **Tagline:** "Flow Through Your Day"
- **Tone:** Professional yet approachable, focused on productivity without feeling overwhelming

### Color Palette

#### Light Mode
```css
--primary: #6366F1        /* Indigo - Primary actions, time blocks */
--primary-hover: #4F46E5  /* Darker indigo for hover states */
--secondary: #8B5CF6      /* Purple - Focus time, important events */
--accent: #EC4899         /* Pink - Notifications, urgent tasks */
--success: #10B981        /* Green - Completed tasks */
--warning: #F59E0B        /* Amber - Conflicts, warnings */
--danger: #EF4444         /* Red - Overdue, cancellations */
--neutral: #6B7280        /* Gray - Secondary text */
--background: #FFFFFF     /* White - Main background */
--surface: #F9FAFB        /* Light gray - Cards, panels */
--border: #E5E7EB         /* Border color */
--text-primary: #111827   /* Dark gray - Primary text */
--text-secondary: #6B7280 /* Medium gray - Secondary text */
```

#### Dark Mode
```css
--primary: #818CF8        /* Lighter indigo */
--primary-hover: #6366F1  /* Hover state */
--secondary: #A78BFA      /* Lighter purple */
--accent: #F472B6         /* Lighter pink */
--success: #34D399        /* Lighter green */
--warning: #FBBF24        /* Lighter amber */
--danger: #F87171         /* Lighter red */
--neutral: #9CA3AF        /* Light gray */
--background: #0F172A     /* Dark navy */
--surface: #1E293B        /* Slightly lighter navy */
--border: #334155         /* Dark gray border */
--text-primary: #F1F5F9   /* Light text */
--text-secondary: #CBD5E1 /* Medium light text */
```

### Typography
- **Font Family:** 
  - Headers: "Inter", system-ui, sans-serif
  - Body: "Inter", system-ui, sans-serif
  - Monospace: "JetBrains Mono", monospace (for time displays)
- **Scale:**
  - Display: 48px/56px (landing page hero)
  - H1: 36px/44px (page titles)
  - H2: 30px/38px (section headers)
  - H3: 24px/32px (card titles)
  - H4: 20px/28px (subsection headers)
  - Body: 16px/24px (default text)
  - Small: 14px/20px (secondary text)
  - Tiny: 12px/16px (labels, badges)

### Spacing System
- Base unit: 4px
- Scale: 0, 1 (4px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px), 10 (40px), 12 (48px), 16 (64px), 20 (80px)

### Layout Principles
- **Max Width:** 1440px for main content
- **Sidebar:** 280px fixed width (collapsible to 64px)
- **Main Content:** Fluid with 24px padding
- **Mobile Breakpoints:** 
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

---

## Application Routes & Structure

### Public Routes (Unauthenticated)

#### 1. Landing Page - `/`
**Purpose:** Marketing page to introduce VibeFlow  
**Components:**
- Hero section with animated calendar visualization
- Feature highlights (calendar sync, time blocking, analytics)
- Testimonials carousel
- Pricing section (future consideration)
- CTA buttons: "Get Started" and "Sign In"

**Visual Design:**
- Full-width hero with gradient background
- Floating calendar cards showing time blocks
- Smooth scroll animations
- Mobile-responsive grid layout

#### 2. Sign In - `/auth/signin`
**Purpose:** User authentication  
**Components:**
- WorkOS AuthKit integration
- Social login buttons (Google, Microsoft, GitHub)
- Email/password form
- "Remember me" checkbox
- "Forgot password?" link
- "Create account" link

**Visual Design:**
- Split screen: left side with form, right side with brand visual
- Centered card on mobile
- Subtle animations on input focus

#### 3. Sign Up - `/auth/signup`
**Purpose:** New user registration  
**Components:**
- WorkOS AuthKit registration flow
- Social sign-up options
- Email/password form with validation
- Terms of service checkbox
- Privacy policy link

#### 4. Password Reset - `/auth/reset`
**Purpose:** Password recovery flow  
**Components:**
- Email input for reset link
- Success/error messaging
- Back to sign-in link

### Authenticated Routes (Protected)

#### 5. Dashboard - `/dashboard`
**Purpose:** Main landing after sign-in, overview of day/week  
**Layout:** Sidebar + Main content area  
**Components:**
- **Today's Agenda** widget (next 3-5 events)
- **Current Time Block** indicator with progress bar
- **Quick Actions** toolbar:
  - New Event
  - New Time Block
  - New Task
- **This Week Summary** chart (time allocation)
- **Upcoming Tasks** list (top 5 by priority)
- **Focus Time Available** metric
- **Recent Activity** feed

**Visual Design:**
- Card-based layout with consistent spacing
- Real-time updates with subtle animations
- Color-coded categories throughout
- Mobile: Stacked cards with swipe gestures

#### 6. Calendar Views

##### 6.1 Day View - `/calendar/day/:date?`
**Purpose:** Detailed daily schedule  
**Components:**
- 24-hour timeline (scrollable, current time indicator)
- Events as blocks with duration visualization
- Time blocks with distinct styling (dashed border)
- All-day events section at top
- Mini calendar date picker
- View switcher (day/week/month/agenda)

**Visual Design:**
- Hour grid with 30-minute subdivisions
- Drag-to-create new events
- Hover to see event details
- Click to edit inline
- Mobile: Vertical scroll with sticky time labels

##### 6.2 Week View - `/calendar/week/:date?`
**Purpose:** Weekly overview  
**Components:**
- 7-day grid with current day highlighted
- Compressed event display (show 2-3 per slot)
- "More" indicator for overflow
- Week navigation arrows
- Current time line across all days

**Visual Design:**
- Responsive column width
- Color-coded events by calendar
- Weekend columns slightly dimmed
- Mobile: Horizontal scroll or agenda fallback

##### 6.3 Month View - `/calendar/month/:date?`
**Purpose:** Monthly planning  
**Components:**
- Traditional month grid
- Event dots/bars (max 3 visible)
- Day numbers with event count badges
- Month/year navigation
- Today indicator

**Visual Design:**
- Minimal, clean grid
- Hover to preview day's events
- Click to navigate to day view
- Mobile: Compact grid with event indicators

##### 6.4 Agenda View - `/calendar/agenda`
**Purpose:** List format for easy scanning  
**Components:**
- Grouped by day with date headers
- Expandable event cards
- Infinite scroll or pagination
- Filter bar (by calendar, category)
- Search functionality

**Visual Design:**
- Card-based list
- Timeline connector on left
- Rich preview with attendees, location
- Mobile: Full-width cards with swipe actions

#### 7. Time Blocking - `/timeblocks`
**Purpose:** Manage focus time and recurring blocks  
**Layout:** Split view - templates left, calendar right  
**Components:**
- **Template Library:**
  - Pre-built templates (Deep Work, Email, Breaks)
  - Custom template creator
  - Drag to calendar to apply
- **Time Block Editor:**
  - Name, duration, color
  - Recurrence pattern
  - Buffer time settings
  - Do Not Disturb toggle
- **Active Blocks View:**
  - Weekly grid showing all blocks
  - Conflict indicators
  - Quick edit/delete actions

**Visual Design:**
- Distinct visual style for blocks (diagonal stripes, opacity)
- Color coding by category
- Visual feedback during drag operations
- Mobile: Tab navigation between templates and calendar

#### 8. Tasks - `/tasks`
**Purpose:** Task management hub  
**Layout:** Kanban board or list view toggle  
**Components:**
- **Task Lists:**
  - Today, This Week, Later, Completed
  - Custom lists/projects
- **Task Card:**
  - Title, description, due date
  - Priority indicator (color/icon)
  - Time estimate
  - Category tags
  - Schedule to calendar button
- **Quick Add:** Natural language input at top
- **Filters:** By priority, category, due date

**Visual Design:**
- Clean cards with subtle shadows
- Drag-and-drop between lists
- Progress indicators for subtasks
- Mobile: Swipeable list with actions

#### 9. Analytics - `/analytics`
**Purpose:** Productivity insights and trends  
**Layout:** Dashboard grid  
**Components:**
- **Time Allocation Chart:** Pie/donut by category
- **Weekly Trends:** Line graph of focus vs. meetings
- **Productivity Score:** Custom metric visualization
- **Task Completion Rate:** Progress bars by category
- **Focus Time Heatmap:** Calendar grid with intensity
- **Meeting Analysis:** Average duration, frequency
- **Date Range Selector:** Week/Month/Quarter/Year

**Visual Design:**
- Clean, modern charts (Chart.js or Recharts)
- Consistent color scheme from categories
- Interactive tooltips on hover
- Export options (PNG, CSV)
- Mobile: Stacked full-width charts

#### 10. Settings - `/settings/*`
**Purpose:** User preferences and configuration  
**Subpages:**

##### 10.1 Profile - `/settings/profile`
- Avatar upload
- Name, email, timezone
- Bio/status message

##### 10.2 Calendars - `/settings/calendars`
- Connected calendars list
- Add/remove calendar connections
- Sync settings per calendar
- Color customization
- Visibility toggles

##### 10.3 Preferences - `/settings/preferences`
- Default calendar view
- Week start day
- Time format (12/24 hour)
- Date format
- Language (future)
- Theme (light/dark/auto)

##### 10.4 Time Blocks - `/settings/timeblocks`
- Default buffer times
- Do Not Disturb preferences
- Auto-decline meeting settings
- Focus time goals

##### 10.5 Notifications - `/settings/notifications`
- Email notification preferences
- Browser push notifications
- Reminder defaults
- Digest email settings

##### 10.6 Integrations - `/settings/integrations`
- Google Calendar connection status
- Future: Slack, Notion, etc.
- Webhook configurations
- API keys (future)

##### 10.7 Account - `/settings/account`
- Change password
- Two-factor authentication
- Export data
- Delete account

**Visual Design:**
- Sidebar navigation for settings sections
- Clean forms with inline validation
- Toggle switches for boolean options
- Success/error toast notifications
- Mobile: Accordion or separate pages

#### 11. Quick Create Modal - `/create` (modal overlay)
**Purpose:** Fast event/task/block creation  
**Trigger:** Keyboard shortcut (Cmd+K) or FAB button  
**Components:**
- Command palette style interface
- Natural language input
- Type selector (Event, Task, Time Block)
- Quick datetime picker
- Category/calendar selector

**Visual Design:**
- Centered modal with backdrop
- Smooth slide-up animation
- Keyboard navigation support
- Auto-focus on input

---

## Component Library

### Core Components

#### Navigation
- **Sidebar:** Collapsible with icon + label items
- **Header:** App bar with search, notifications, user menu
- **Breadcrumbs:** Contextual navigation
- **Tab Bar:** For sub-navigation within pages

#### Forms
- **Input Fields:** With floating labels, validation states
- **Date/Time Pickers:** Custom calendar dropdowns
- **Select Dropdowns:** With search capability
- **Toggle Switches:** For boolean settings
- **Radio Groups:** For exclusive choices
- **Checkboxes:** For multiple selections
- **Sliders:** For duration/range selection

#### Display
- **Cards:** Consistent padding, border radius, shadows
- **Badges:** For counts, statuses
- **Chips:** For tags, categories
- **Tooltips:** For additional context
- **Progress Bars:** For completion tracking
- **Skeleton Loaders:** For loading states

#### Feedback
- **Toast Notifications:** Bottom-right positioning
- **Modals:** Centered with backdrop
- **Alerts:** Inline contextual messages
- **Empty States:** Helpful illustrations and CTAs
- **Error States:** Clear error messages with recovery actions

#### Calendar Specific
- **Event Card:** Compact and expanded views
- **Time Block:** Distinct visual style
- **Calendar Grid:** Responsive day/week/month layouts
- **Time Slot:** Clickable/draggable areas
- **Conflict Indicator:** Visual overlap warning

---

## Mobile Responsiveness

### Navigation
- Bottom tab bar for main sections
- Hamburger menu for sidebar content
- Swipe gestures for view changes

### Layouts
- Single column layouts
- Full-width cards with padding
- Sticky headers and CTAs
- Sheet/drawer patterns for forms

### Interactions
- Touch-optimized tap targets (44px minimum)
- Swipe actions for quick operations
- Pull-to-refresh for data updates
- Long press for context menus

---

## Accessibility Requirements

### WCAG 2.1 Level AA Compliance
- Color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Keyboard navigation for all interactive elements
- Screen reader support with proper ARIA labels
- Focus indicators for keyboard users
- Skip navigation links

### Interaction Patterns
- Consistent navigation structure
- Clear error messaging
- Form field labels and instructions
- Alternative text for images
- Proper heading hierarchy

---

## Loading & Error States

### Loading States
1. **Initial Load:** Full-page skeleton with logo
2. **Route Transitions:** Top progress bar
3. **Data Fetching:** Inline skeleton loaders
4. **Lazy Loading:** Blur-up technique for images

### Error States
1. **Network Errors:** Retry button with offline indicator
2. **404 Pages:** Helpful navigation options
3. **Form Errors:** Inline validation messages
4. **Sync Conflicts:** Manual resolution UI
5. **Rate Limits:** Clear messaging with wait time

---

## Animation & Micro-interactions

### Page Transitions
- Fade between routes (200ms)
- Slide for modal/drawer (300ms)
- Smooth scroll for anchor links

### Component Animations
- Button hover: Scale(1.02) + shadow
- Card hover: Translate Y(-2px) + shadow
- Loading spinner: Smooth rotation
- Progress bars: Animated fill
- Toast entrance: Slide + fade

### Feedback
- Click feedback: Ripple effect
- Drag feedback: Opacity change
- Success: Check mark animation
- Delete: Fade out + collapse

---

## Performance Targets

### Core Web Vitals
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

### Optimization Strategies
- Route-based code splitting
- Image lazy loading with placeholders
- Virtual scrolling for long lists
- Optimistic UI updates
- Service worker for offline capability
- CDN for static assets

---

## Future Enhancements (Post-MVP)

### AI Features
- Smart scheduling suggestions
- Meeting optimization recommendations
- Natural language event creation
- Predictive time blocking

### Collaboration
- Shared calendars
- Team availability views
- Meeting polls
- Collaborative time blocking

### Advanced Analytics
- Goal tracking
- Productivity coaching
- Time audit reports
- Custom metrics

### Integrations
- Slack notifications
- Notion sync
- Todoist import
- Zoom meeting creation
- Email to calendar

---

**Document Status:** Ready for Implementation  
**Design Owner:** Product Design Team  
**Engineering Owner:** Frontend Team  
**Last Review:** January 24, 2026