# VibeFlow - MVP Specification

**Version:** 1.0.0
**Last Updated:** January 24, 2026
**Status:** Development Ready

---

## Overview

VibeFlow is a personal productivity calendar application that helps individuals manage time effectively. The app integrates with Google Calendar, enables time blocking, supports basic task management, and provides productivity insights in a clean, focused interface.

**Target Audience:** Individual users seeking better personal time management

---

## MVP Features

### Calendar Core
- **Google Calendar Integration**
  - OAuth2 authentication with Google
  - Bidirectional sync (app ↔ Google Calendar)
  - Support for multiple calendars per user
  - Conflict detection and resolution

- **Calendar Views**
  - Day, week, month, and agenda views
  - Multiple calendars with color coding
  - Calendar filtering and visibility toggles

- **Event Operations**
  - Create, edit, and delete events
  - Recurring events (daily, weekly, monthly)
  - Customizable reminders (email, push)
  - Quick-create with natural language
  - Event color categorization

- **Time Zone Support**
  - Automatic time zone detection
  - Multi-time zone display

### Time Blocking
- **Manual Time Blocking**
  - Create time blocks for focused work
  - Recurring time blocks (daily, weekly)
  - Time block templates (Deep Work, Email, Learning, Exercise)
  - Drag-and-drop reorganization
  - Color coding by category

- **Focus Protection**
  - "Do Not Disturb" modes during blocks
  - Conflict warnings for new events
  - Buffer time configuration
  - Visual indicators for protected time

- **Task Integration**
  - Create time blocks from task lists
  - Link time blocks to task completion
  - Track time spent on tasks

### Basic Task Management
- **Task List**
  - Create, edit, and delete tasks
  - Task prioritization (high, medium, low)
  - Due dates and reminders
  - Task categories/labels

- **Task-to-Calendar**
  - Schedule tasks onto calendar
  - Convert calendar events to tasks
  - View tasks in agenda

### Personal Analytics
- **Time Analysis**
  - Time breakdown by category
  - Weekly and monthly summaries
  - Completion rate tracking
  - Time allocation charts

- **Productivity Insights**
  - Weekly productivity trends
  - Focus time vs. meeting time ratio
  - Task completion patterns

---

## Technology Stack (Aligned with Current Setup)

### Frontend
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite with TanStack Start (SSR)
- **Routing:** TanStack Router (file-based routing)
- **Styling:** Tailwind CSS v4 with tailwindcss-animate
- **State Management:** TanStack Store & React Query
- **UI Components:** shadcn/ui components
- **Dev Tools:** TanStack DevTools, React Query DevTools

### Backend
- **Database:** Convex (real-time, serverless backend)
- **Authentication:** WorkOS AuthKit
- **API Integration:** Google Calendar API (OAuth 2.0)
- **Real-time:** Convex subscriptions

### Infrastructure
- **Hosting:** Cloudflare Pages/Workers
- **Edge Runtime:** Cloudflare Workers (via Wrangler)
- **Content:** Content Collections (for static content)
- **Testing:** Vitest
- **Linting/Formatting:** Biome

## Implementation Tasks (MVP)

### Foundation ✅ (Already Configured)
- [x] Vite + React 19 + TypeScript setup
- [x] TanStack Router configured with file-based routing
- [x] Tailwind CSS v4 configured
- [x] Convex backend initialized
- [x] WorkOS AuthKit integrated
- [x] TanStack Query configured
- [x] TanStack Store for state management
- [x] Biome for linting/formatting

### Calendar Integration
- [ ] Implement Google OAuth2 flow with WorkOS SSO
- [ ] Create Google Calendar API service layer
- [ ] Store Google tokens in Convex
- [ ] Implement Convex actions for calendar sync
- [ ] Set up Convex cron jobs for periodic sync
- [ ] Create calendar connection UI component
- [ ] Implement day/week/month/agenda views using TanStack Router
- [ ] Create Convex mutations for event CRUD
- [ ] Implement recurring event logic (RFC 5545)
- [ ] Add natural language parsing (optional)
- [ ] Implement reminder system with Convex scheduled functions

### Time Blocking
- [ ] Create time block UI components with React
- [ ] Store time blocks in Convex database
- [ ] Implement Convex mutations for time block CRUD
- [ ] Create recurring blocks with Convex scheduled functions
- [ ] Implement drag-and-drop with React DnD Kit
- [ ] Add "Do Not Disturb" state in Convex
- [ ] Create conflict detection using Convex queries
- [ ] Implement buffer time settings in user preferences
- [ ] Create task-to-block conversion flow

### Task Management
- [ ] Define Convex schema for tasks
- [ ] Create Convex mutations for task CRUD
- [ ] Implement task prioritization with Convex indexes
- [ ] Create task categories using Convex documents
- [ ] Implement time tracking with Convex real-time updates

### Analytics
- [ ] Create Convex aggregation queries for time breakdown
- [ ] Build dashboard route with TanStack Router
- [ ] Use React Query for caching analytics data
- [ ] Create chart components with a charting library
- [ ] Implement completion rate tracking with Convex

### Testing
- [ ] Unit tests with Vitest for components
- [ ] Integration tests for Convex functions
- [ ] E2E tests for critical user flows
- [ ] Performance testing with Vitest benchmarks

### Deployment
- [ ] Deploy to Cloudflare Pages
- [ ] Configure Wrangler for production
- [ ] Set up Convex production deployment
- [ ] Configure WorkOS production environment
- [ ] Set up monitoring (optional: Sentry)
- [ ] Configure environment variables in Cloudflare

---

## Success Criteria (MVP)

### Functional
- Google Calendar integration working
- Calendar sync latency < 5 seconds
- Support 10+ calendars per user
- 99.9% sync success rate
- Real-time availability updates < 5 seconds

### Performance
- Calendar view render < 500ms (p95)
- Event/task creation < 1 second (Convex mutations)
- Analytics dashboard load < 2 seconds
- Leverage Cloudflare edge network for global performance
- Real-time updates via Convex subscriptions

### Engagement (3 Months)
- 5,000 active users
- 85% of users connect Google Calendar
- 70% of users create time blocks weekly
- Average 30+ events synced per user

---

## Launch Timeline (MVP)

**Week 1-2:** Google Calendar OAuth integration with WorkOS
**Week 3-4:** Calendar sync and event CRUD with Convex
**Week 5-6:** Time blocking functionality
**Week 7-8:** Task management integration
**Week 9-10:** Analytics dashboard
**Week 11-12:** Testing, polish, and production deployment

---

**Document Status:** Ready for Development
**Owner:** Product Team
**Last Review:** January 24, 2026