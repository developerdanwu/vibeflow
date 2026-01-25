# Sidebar Layout Redesign

## Context

### Original Request
Replace the dated top navigation with a modern shadcn sidebar using resizable panels. The calendar should be the main app - always visible - with a collapsible sidebar for Tasks and Settings.

### Interview Summary
**Key Discussions**:
- **Sidebar scope**: App-wide for all authenticated pages
- **Calendar header**: Stays in main area (Today, date nav, view switcher)
- **Mobile**: Collapsed icons (48px), expand on tap
- **Navigation items**: Calendar IS the main app; sidebar has Tasks (slide-out panel) and Settings
- **Collapsed width**: 48px (minimal)
- **Mini calendar**: No - keep it simple
- **Resize behavior**: Drag to resize (48px-400px range)
- **Tasks behavior**: Slide-out panel from sidebar
- **Landing page**: Keep as marketing page (no sidebar)
- **Test strategy**: Manual verification only

**Research Findings**:
- Current layout: `__root.tsx` with Header component containing hamburger menu slide-out
- shadcn components installed: 20 components, but NOT sidebar or resizable
- UI_SPEC.md specifies 280px expanded sidebar, 64px collapsed
- Calendar page has its own internal structure with CalendarHeader component
- shadcn sidebar supports `collapsible="icon"` for icon-only collapsed state
- shadcn resizable provides `ResizablePanelGroup` with drag-to-resize capability

---

## Work Objectives

### Core Objective
Replace the dated hamburger-menu navigation with a modern, permanently visible shadcn sidebar using resizable panels, where the calendar is always the main content area.

### Concrete Deliverables
- shadcn `sidebar` and `resizable` components installed
- New `AppSidebar` component with Tasks and Settings navigation
- New authenticated layout wrapper using `SidebarProvider` and `ResizablePanelGroup`
- Tasks slide-out panel component (shell only)
- Old `Header` component replaced/removed
- Mobile responsive behavior (48px collapsed sidebar)

### Definition of Done
- [ ] `pnpm dev` runs without errors
- [ ] Authenticated routes show sidebar + calendar layout
- [ ] Landing page (/) shows original marketing layout (no sidebar)
- [ ] Sidebar can be dragged to resize between 48px and ~320px
- [ ] Sidebar collapse button toggles between expanded and 48px icon-only
- [ ] Tasks button opens slide-out panel
- [ ] Settings button navigates to /settings (or shows placeholder if route doesn't exist)
- [ ] Mobile viewport shows collapsed sidebar by default

### Must Have
- Resizable sidebar with drag handle
- Collapsible to 48px icon-only mode
- Tasks and Settings navigation items with icons
- Tasks slide-out panel (can be empty shell)
- Authenticated layout wrapping calendar and future authenticated routes
- User profile/auth section in sidebar footer

### Must NOT Have (Guardrails)
- NO changes to calendar functionality (views, events, drag-and-drop)
- NO changes to landing page layout
- NO implementation of Tasks panel content (just the shell/panel)
- NO Settings page creation (just navigation link)
- NO new routes beyond what's needed for layout
- NO over-engineering - keep the sidebar simple (2 nav items + user section)
- NO mini-calendar in sidebar
- NO global top bar/header on authenticated pages

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES (vitest configured)
- **User wants tests**: Manual-only for this task
- **Framework**: N/A for this task
- **QA approach**: Manual verification with browser

### Manual QA Procedures

Each TODO includes specific verification steps using the browser. Evidence will be visual confirmation in the running dev server.

---

## Task Flow

```
Task 0 (Install components)
    ↓
Task 1 (Create AppSidebar)
    ↓
Task 2 (Create AuthenticatedLayout)
    ↓
Task 3 (Update __root.tsx)
    ↓
Task 4 (Create TasksPanel)
    ↓
Task 5 (Update calendar.tsx)
    ↓
Task 6 (Final integration & cleanup)
```

## Parallelization

| Task | Depends On | Reason |
|------|------------|--------|
| 0 | None | Must install components first |
| 1 | 0 | Needs sidebar component |
| 2 | 1 | Uses AppSidebar |
| 3 | 2 | Uses AuthenticatedLayout |
| 4 | 1 | Uses sidebar context |
| 5 | 3 | Needs new layout in place |
| 6 | 5, 4 | Final integration |

---

## TODOs

- [x] 0. Install shadcn sidebar and resizable components

  **What to do**:
  - Run `pnpm dlx shadcn@latest add sidebar` to install the sidebar component
  - Run `pnpm dlx shadcn@latest add resizable` to install the resizable panel component
  - Verify new files created in `src/components/ui/`
  - May also need to install `collapsible` component if not auto-included

  **Must NOT do**:
  - Modify any existing components during installation
  - Change shadcn configuration

  **Parallelizable**: NO (first task)

  **References**:

  **Configuration Reference**:
  - `components.json` - shadcn configuration with "new-york" style, zinc base color

  **Documentation References**:
  - shadcn sidebar docs: `https://ui.shadcn.com/docs/components/sidebar`
  - shadcn resizable docs: `https://ui.shadcn.com/docs/components/resizable`

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Run: `pnpm dlx shadcn@latest add sidebar`
  - [ ] Run: `pnpm dlx shadcn@latest add resizable`
  - [ ] Verify files exist: `ls src/components/ui/sidebar.tsx src/components/ui/resizable.tsx`
  - [ ] Run: `pnpm dev` → App starts without errors

  **Commit**: YES
  - Message: `feat(ui): install shadcn sidebar and resizable components`
  - Files: `src/components/ui/sidebar.tsx`, `src/components/ui/resizable.tsx`, `package.json`, `pnpm-lock.yaml`
  - Pre-commit: `pnpm check`

---

- [x] 1. Create AppSidebar component

  **What to do**:
  - Create `src/components/AppSidebar.tsx`
  - Implement sidebar with:
    - Logo/brand at top ("VibeFlow")
    - Main navigation section with Tasks and Settings items (icons + labels)
    - User profile section at bottom (reuse WorkOSHeader pattern)
    - Collapse/expand toggle button
  - Use shadcn Sidebar components: `Sidebar`, `SidebarContent`, `SidebarGroup`, `SidebarGroupContent`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarFooter`
  - Set `collapsible="icon"` for icon-only collapsed state
  - Use Lucide icons: `CheckSquare` for Tasks, `Settings` for Settings

  **Must NOT do**:
  - Add navigation links beyond Tasks and Settings
  - Add mini-calendar or date picker
  - Implement actual Tasks functionality (just the button that will trigger panel)

  **Parallelizable**: NO (depends on 0)

  **References**:

  **Pattern References**:
  - `src/components/Header.tsx:44-68` - Current navigation link pattern with activeProps styling
  - `src/components/workos-user.tsx` - User authentication display pattern to reuse in footer

  **shadcn Documentation**:
  ```tsx
  // From shadcn docs - basic sidebar structure
  import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, 
           SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from "@/components/ui/sidebar"
  
  export function AppSidebar() {
    return (
      <Sidebar collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="#">Item</a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter />
      </Sidebar>
    )
  }
  ```

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] File created: `src/components/AppSidebar.tsx`
  - [ ] No TypeScript errors: `pnpm check` passes
  - [ ] Component exports correctly (can be imported)

  **Commit**: YES
  - Message: `feat(layout): create AppSidebar component with Tasks and Settings navigation`
  - Files: `src/components/AppSidebar.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 2. Create AuthenticatedLayout component with resizable panels

  **What to do**:
  - Create `src/components/layouts/AuthenticatedLayout.tsx`
  - Implement layout structure:
    ```
    SidebarProvider
      └── ResizablePanelGroup (horizontal)
            ├── ResizablePanel (sidebar) - minSize ~5%, maxSize ~30%
            │     └── AppSidebar
            ├── ResizableHandle (with drag handle visible)
            └── ResizablePanel (main content)
                  └── {children}
    ```
  - Configure ResizablePanel for sidebar:
    - `defaultSize={20}` (~280px on 1400px screen)
    - `minSize={4}` (~48px minimum for collapsed)
    - `maxSize={30}` (~400px maximum)
    - `collapsible={true}` 
  - Add `SidebarTrigger` for collapse toggle
  - Full height layout: `h-screen` with overflow handling

  **Must NOT do**:
  - Add any header/topbar
  - Handle authentication logic (that stays in route components)
  - Add any route-specific content

  **Parallelizable**: NO (depends on 1)

  **References**:

  **Pattern References**:
  - `src/routes/__root.tsx:50-79` - Current provider wrapping pattern (WorkOSProvider, ConvexProvider)

  **shadcn Documentation**:
  ```tsx
  // Resizable with sidebar pattern
  import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
  import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
  
  <SidebarProvider>
    <ResizablePanelGroup direction="horizontal" className="min-h-screen">
      <ResizablePanel defaultSize={20} minSize={4} maxSize={30}>
        <AppSidebar />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={80}>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </ResizablePanel>
    </ResizablePanelGroup>
  </SidebarProvider>
  ```

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] File created: `src/components/layouts/AuthenticatedLayout.tsx`
  - [ ] No TypeScript errors: `pnpm check` passes
  - [ ] Component exports correctly

  **Commit**: YES
  - Message: `feat(layout): create AuthenticatedLayout with resizable sidebar panels`
  - Files: `src/components/layouts/AuthenticatedLayout.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 3. Update __root.tsx to conditionally render layouts

  **What to do**:
  - Modify `src/routes/__root.tsx` to:
    - Remove the global `<Header />` component
    - Keep providers (WorkOSProvider, ConvexProvider) wrapping everything
    - Render `{children}` directly (layout is handled per-route or via route groups)
  - The landing page will render without sidebar
  - Authenticated routes will wrap themselves in AuthenticatedLayout

  **Must NOT do**:
  - Remove WorkOSProvider or ConvexProvider
  - Remove devtools
  - Add conditional logic based on auth state in root (routes handle that)

  **Parallelizable**: NO (depends on 2)

  **References**:

  **Pattern References**:
  - `src/routes/__root.tsx:50-79` - Current RootDocument structure
  - `src/routes/index.tsx` - Landing page that should NOT have sidebar
  - `src/routes/calendar.tsx:61-75` - Auth state handling pattern (AuthLoading, Unauthenticated, Authenticated)

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Run: `pnpm dev`
  - [ ] Navigate to `/` (landing page)
  - [ ] Verify: NO sidebar visible, marketing page shows normally
  - [ ] Verify: NO hamburger menu in header (old Header removed)

  **Commit**: YES
  - Message: `refactor(layout): remove global Header from root layout`
  - Files: `src/routes/__root.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 4. Create TasksPanel slide-out component

  **What to do**:
  - Create `src/components/TasksPanel.tsx`
  - Implement as a sheet/panel that slides out from the sidebar
  - Use shadcn `Sheet` component (already installed as `dialog`? check - may need to install)
  - If Sheet not available, use a simple positioned div with transition
  - Panel should:
    - Slide out to the right of the sidebar
    - Have a header with "Tasks" title and close button
    - Have empty content area with placeholder text "Tasks coming soon..."
    - Be dismissible by clicking outside or close button
  - Connect to sidebar: Tasks button in AppSidebar should toggle this panel

  **Must NOT do**:
  - Implement actual task management functionality
  - Add task creation, editing, or listing
  - Connect to Convex backend

  **Parallelizable**: YES (with task 3, after task 1 is done)

  **References**:

  **Pattern References**:
  - `src/components/Header.tsx:26-74` - Current slide-out sidebar pattern (transform transition)
  - `src/components/ui/dialog.tsx` - Dialog component pattern (Sheet is similar)

  **Implementation Pattern** (if no Sheet component):
  ```tsx
  // Simple slide-out panel without Sheet
  <div className={cn(
    "fixed top-0 left-[var(--sidebar-width)] h-full w-80 bg-background border-r shadow-lg",
    "transform transition-transform duration-300",
    isOpen ? "translate-x-0" : "-translate-x-full"
  )}>
    <div className="p-4 border-b flex justify-between">
      <h2>Tasks</h2>
      <button onClick={onClose}>×</button>
    </div>
    <div className="p-4">Tasks coming soon...</div>
  </div>
  ```

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] File created: `src/components/TasksPanel.tsx`
  - [ ] No TypeScript errors: `pnpm check` passes

  **Commit**: YES
  - Message: `feat(tasks): create TasksPanel slide-out component shell`
  - Files: `src/components/TasksPanel.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 5. Update calendar.tsx to use AuthenticatedLayout

  **What to do**:
  - Modify `src/routes/calendar.tsx` to wrap authenticated content in `AuthenticatedLayout`
  - Keep existing auth state handling (AuthLoading, Unauthenticated, Authenticated)
  - Structure:
    ```tsx
    function CalendarRoute() {
      return (
        <>
          <AuthLoading>...</AuthLoading>
          <Unauthenticated>...</Unauthenticated>
          <Authenticated>
            <AuthenticatedLayout>
              <CalendarContent />
            </AuthenticatedLayout>
          </Authenticated>
        </>
      )
    }
    ```
  - Remove the outer container div from CalendarContent (layout handles full height)
  - Keep CalendarHeader and all calendar view logic intact

  **Must NOT do**:
  - Modify calendar functionality (views, events, etc.)
  - Change CalendarHeader component
  - Modify CalendarProvider or DndProviderWrapper
  - Remove any existing calendar features

  **Parallelizable**: NO (depends on 3)

  **References**:

  **Pattern References**:
  - `src/routes/calendar.tsx:61-75` - Current CalendarRoute structure with auth states
  - `src/routes/calendar.tsx:215-311` - CalendarContent structure to preserve

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Run: `pnpm dev`
  - [ ] Navigate to `/calendar` (while authenticated)
  - [ ] Verify: Sidebar visible on left
  - [ ] Verify: Calendar content fills remaining space
  - [ ] Verify: CalendarHeader (Today, date nav, view buttons) still visible
  - [ ] Verify: All calendar views work (day, week, month, year, agenda)
  - [ ] Verify: Drag sidebar handle to resize - calendar content adjusts
  - [ ] Navigate to `/calendar` (while NOT authenticated)
  - [ ] Verify: Sign-in prompt shows without sidebar

  **Commit**: YES
  - Message: `feat(calendar): integrate AuthenticatedLayout with sidebar`
  - Files: `src/routes/calendar.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 6. Final integration, cleanup, and mobile responsive

  **What to do**:
  - Wire up TasksPanel to AppSidebar:
    - Add state management for panel open/close
    - Tasks button toggles TasksPanel
  - Add Settings click handler (navigate to /settings or show "coming soon" toast)
  - Ensure mobile responsive behavior:
    - On viewport < 768px, sidebar should default to collapsed (48px)
    - Sidebar content shows only icons when collapsed
    - Tapping sidebar item expands OR triggers action
  - Delete old `src/components/Header.tsx` file (no longer needed)
  - Verify all functionality works together

  **Must NOT do**:
  - Create Settings page content
  - Add additional navigation items
  - Change calendar functionality

  **Parallelizable**: NO (final integration)

  **References**:

  **Pattern References**:
  - `src/components/AppSidebar.tsx` - Component to update with panel state
  - `src/components/TasksPanel.tsx` - Panel to wire up
  - `src/components/Header.tsx` - File to delete

  **shadcn Sidebar Mobile Pattern**:
  ```tsx
  // Use useSidebar hook to control state
  import { useSidebar } from "@/components/ui/sidebar"
  
  const { state, setOpen, isMobile } = useSidebar()
  // state: "expanded" | "collapsed"
  // isMobile: boolean
  ```

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Run: `pnpm dev`
  - [ ] Click Tasks in sidebar → TasksPanel slides out
  - [ ] Click close on TasksPanel → Panel closes
  - [ ] Click Settings in sidebar → Navigates or shows feedback
  - [ ] Resize browser to mobile width (< 768px)
  - [ ] Verify: Sidebar shows collapsed (icons only)
  - [ ] Tap sidebar icon → Expands or triggers action
  - [ ] Verify: `src/components/Header.tsx` is deleted
  - [ ] Run: `pnpm check` → All checks pass
  - [ ] Run: `pnpm build` → Build succeeds

  **Commit**: YES
  - Message: `feat(layout): complete sidebar integration with tasks panel and mobile responsive`
  - Files: `src/components/AppSidebar.tsx`, `src/components/TasksPanel.tsx`, delete `src/components/Header.tsx`
  - Pre-commit: `pnpm check && pnpm build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 0 | `feat(ui): install shadcn sidebar and resizable components` | ui/*.tsx, package.json | pnpm dev |
| 1 | `feat(layout): create AppSidebar component` | AppSidebar.tsx | pnpm check |
| 2 | `feat(layout): create AuthenticatedLayout with resizable panels` | layouts/AuthenticatedLayout.tsx | pnpm check |
| 3 | `refactor(layout): remove global Header from root layout` | __root.tsx | pnpm dev |
| 4 | `feat(tasks): create TasksPanel slide-out component shell` | TasksPanel.tsx | pnpm check |
| 5 | `feat(calendar): integrate AuthenticatedLayout with sidebar` | calendar.tsx | pnpm dev |
| 6 | `feat(layout): complete sidebar integration with mobile responsive` | multiple | pnpm build |

---

## Success Criteria

### Verification Commands
```bash
pnpm check    # Expected: No errors
pnpm build    # Expected: Build succeeds
pnpm dev      # Expected: App runs, navigate to test
```

### Final Checklist
- [ ] All "Must Have" items implemented
- [ ] All "Must NOT Have" items verified absent
- [ ] Landing page unchanged (no sidebar)
- [ ] Calendar functionality preserved
- [ ] Sidebar resizable via drag
- [ ] Sidebar collapsible to icons
- [ ] Tasks panel opens/closes
- [ ] Mobile responsive (48px collapsed default)
- [ ] Old Header component removed
