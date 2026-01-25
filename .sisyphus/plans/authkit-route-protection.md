# AuthKit Server-Side Route Protection

## Context

### Original Request
Refactor to use the AuthKit + Convex + TanStack Start pattern from the get-convex/templates repository to protect routes via server-side `loader` functions instead of client-side `<Authenticated>` components.

### Interview Summary
**Key Discussions**:
- **Environment variables**: User needs to obtain WORKOS_API_KEY, WORKOS_COOKIE_PASSWORD from WorkOS dashboard
- **Route structure**: Use `_authenticated/` folder-based organization
- **Test strategy**: Manual verification only

**Research Findings**:
- Template uses `@workos/authkit-tanstack-react-start` package (SSR-enabled)
- Route protection via `loader` function with `getAuth()` and `throw redirect()`
- Global middleware via `src/start.ts` handles session validation
- OAuth callback at `/callback` route
- Current app uses `@workos-inc/authkit-react` (client-only) + `@convex-dev/workos`
- Convex auth.config.ts already configured correctly

---

## Work Objectives

### Core Objective
Migrate from client-side authentication guards to server-side route protection using TanStack Router's `loader` function pattern, enabling proper SSR authentication and eliminating flash of unauthenticated content.

### Concrete Deliverables
- New package `@workos/authkit-tanstack-react-start` installed
- `src/start.ts` with authkitMiddleware for global session handling
- Updated `src/router.tsx` with AuthKitProvider and custom Convex auth hook
- `src/routes/_authenticated.tsx` layout route for route protection
- `src/routes/callback.tsx` OAuth callback handler
- Calendar route moved to `src/routes/_authenticated/calendar.tsx`
- Updated `__root.tsx` with beforeLoad for global auth context
- Removed old WorkOS/Convex providers (replaced by router config)

### Definition of Done
- [x] `pnpm dev` runs without errors
- [x] Unauthenticated user visiting `/calendar` is redirected to WorkOS sign-in
- [x] After sign-in, user is redirected back to original requested path
- [x] Authenticated user can access `/calendar` and see their events
- [x] Landing page (/) remains accessible to everyone
- [x] Convex queries still work with authentication
- [x] No flash of unauthenticated content on protected routes

### Must Have
- Server-side route protection via `loader`
- authkitMiddleware for session management
- OAuth callback handler
- Return-to-original-path after sign-in
- Convex integration maintained

### Must NOT Have (Guardrails)
- NO changes to Convex backend functions
- NO changes to convex/auth.config.ts (already correct)
- NO changes to landing page accessibility
- NO mixing of old and new auth patterns (complete migration)
- NO client-side `<Authenticated>/<Unauthenticated>` components in protected routes

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES (vitest configured)
- **User wants tests**: Manual-only for this task
- **Framework**: N/A for this task
- **QA approach**: Manual verification with browser

### Manual QA Procedures

Each TODO includes specific verification steps. Key verification:
1. Sign out → visit /calendar → redirected to WorkOS
2. Sign in → redirected back to /calendar
3. Refresh /calendar → stays authenticated (no redirect)
4. Landing page accessible without auth

---

## Pre-requisites (USER ACTION REQUIRED)

**Before starting this work, you must:**

1. Go to WorkOS Dashboard: https://dashboard.workos.com
2. Navigate to API Keys section
3. Copy your API Key (starts with `sk_test_` for development)
4. Create a secure cookie password (32+ characters)
5. Add to `.env.local`:
   ```bash
   WORKOS_CLIENT_ID=client_...  # Same as VITE_WORKOS_CLIENT_ID
   WORKOS_API_KEY=sk_test_...   # From WorkOS Dashboard
   WORKOS_COOKIE_PASSWORD=your_secure_password_at_least_32_characters
   WORKOS_REDIRECT_URI=http://localhost:3000/callback
   ```

---

## Task Flow

```
Task 0 (Prerequisites check)
    ↓
Task 1 (Install package)
    ↓
Task 2 (Create start.ts with middleware)
    ↓
Task 3 (Update router.tsx)
    ↓
Task 4 (Create callback route)
    ↓
Task 5 (Create _authenticated layout)
    ↓
Task 6 (Move calendar route)
    ↓
Task 7 (Update __root.tsx)
    ↓
Task 8 (Cleanup old providers)
    ↓
Task 9 (Final verification)
```

## Parallelization

| Task | Depends On | Reason |
|------|------------|--------|
| 0 | None | Check environment |
| 1 | 0 | Install new package |
| 2 | 1 | Uses new package |
| 3 | 2 | Needs middleware setup |
| 4 | 1 | Uses new package |
| 5 | 1 | Uses new package |
| 6 | 5 | Needs _authenticated layout |
| 7 | 3 | Router must be updated first |
| 8 | 7 | After new providers in place |
| 9 | All | Final check |

---

## TODOs

- [x] 0. Verify environment variables are configured

  **What to do**:
  - Check that `.env.local` contains the required WorkOS server-side variables
  - If missing, STOP and inform user to add them (see Pre-requisites section)

  **Must NOT do**:
  - Proceed without the environment variables
  - Commit any secrets to the repository

  **Parallelizable**: NO (first task)

  **References**:

  **Environment Variables Needed**:
  - `WORKOS_CLIENT_ID` - Same value as `VITE_WORKOS_CLIENT_ID`
  - `WORKOS_API_KEY` - Server-side API key from WorkOS Dashboard
  - `WORKOS_COOKIE_PASSWORD` - 32+ character string for session encryption
  - `WORKOS_REDIRECT_URI` - OAuth callback URL (http://localhost:3000/callback)

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Check `.env.local` for required variables (do not output values)
  - [ ] If missing, stop and notify user

  **Commit**: NO

---

- [x] 1. Install @workos/authkit-tanstack-react-start package

  **What to do**:
  - Run `pnpm add @workos/authkit-tanstack-react-start`
  - This package provides server-side auth utilities for TanStack Start
  - It replaces client-side `@workos-inc/authkit-react` for route protection

  **Must NOT do**:
  - Remove `@workos-inc/authkit-react` yet (will be done in cleanup)
  - Remove `@convex-dev/workos` yet

  **Parallelizable**: NO (depends on 0)

  **References**:

  **Package Documentation**:
  - npm: `https://www.npmjs.com/package/@workos/authkit-tanstack-react-start`
  - WorkOS docs: `https://workos.com/docs/sdks/authkit-tanstack-start`

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Run: `pnpm add @workos/authkit-tanstack-react-start`
  - [ ] Verify in package.json: `"@workos/authkit-tanstack-react-start"` is listed
  - [ ] Run: `pnpm install` (if needed)

  **Commit**: YES
  - Message: `feat(auth): install authkit-tanstack-react-start for server-side auth`
  - Files: `package.json`, `pnpm-lock.yaml`
  - Pre-commit: None

---

- [x] 2. Create src/start.ts with authkitMiddleware

  **What to do**:
  - Create `src/start.ts` file
  - Register authkitMiddleware for global request handling
  - This middleware validates/refreshes sessions on every request

  **Must NOT do**:
  - Add any other middleware
  - Modify existing files

  **Parallelizable**: NO (depends on 1)

  **References**:

  **Template Reference**:
  ```typescript
  // From get-convex/templates - src/start.ts
  import { createStart } from '@tanstack/react-start';
  import { authkitMiddleware } from '@workos/authkit-tanstack-react-start';

  export const startInstance = createStart(() => {
    return {
      requestMiddleware: [authkitMiddleware()],
    };
  });
  ```

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] File created: `src/start.ts`
  - [ ] No TypeScript errors in file

  **Commit**: YES
  - Message: `feat(auth): add authkit middleware for server-side session handling`
  - Files: `src/start.ts`
  - Pre-commit: `pnpm check`

---

- [x] 3. Update src/router.tsx with AuthKitProvider and Convex auth hook

  **What to do**:
  - Import `AuthKitProvider` from new package
  - Import `ConvexProviderWithAuth` from `convex/react` 
  - Create `useAuthFromWorkOS` hook to bridge WorkOS and Convex
  - Add `Wrap` property to router config with providers
  - Remove old provider imports if present

  **Must NOT do**:
  - Change route tree
  - Change query client setup
  - Break SSR query integration

  **Parallelizable**: NO (depends on 2)

  **References**:

  **Current File**:
  - `src/router.tsx` - Current router setup

  **Template Pattern**:
  ```typescript
  import { AuthKitProvider, useAuth, useAccessToken } from '@workos/authkit-tanstack-react-start/client';
  import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';

  const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

  function useAuthFromWorkOS() {
    const { loading, user } = useAuth();
    const { accessToken, getAccessToken } = useAccessToken();

    const fetchAccessToken = useCallback(
      async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
        if (!accessToken || forceRefreshToken) {
          return (await getAccessToken()) ?? null;
        }
        return accessToken;
      },
      [accessToken, getAccessToken],
    );

    return useMemo(
      () => ({
        isLoading: loading,
        isAuthenticated: !!user,
        fetchAccessToken,
      }),
      [loading, user, fetchAccessToken],
    );
  }

  // In router config:
  Wrap: ({ children }) => (
    <AuthKitProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useAuthFromWorkOS}>
        {children}
      </ConvexProviderWithAuth>
    </AuthKitProvider>
  ),
  ```

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] File updated: `src/router.tsx`
  - [ ] No TypeScript errors
  - [ ] Run: `pnpm dev` → App starts (may have provider issues until root is updated)

  **Commit**: YES
  - Message: `feat(auth): configure router with AuthKitProvider and Convex auth bridge`
  - Files: `src/router.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 4. Create src/routes/callback.tsx OAuth callback handler

  **What to do**:
  - Create `src/routes/callback.tsx` file
  - Use `handleCallbackRoute` from authkit package
  - This handles the OAuth redirect from WorkOS

  **Must NOT do**:
  - Add any custom callback logic
  - Modify the standard callback pattern

  **Parallelizable**: YES (with tasks 2-5, after task 1)

  **References**:

  **Template Pattern**:
  ```typescript
  import { createFileRoute } from '@tanstack/react-router';
  import { handleCallbackRoute } from '@workos/authkit-tanstack-react-start';

  export const Route = createFileRoute('/callback')({
    server: {
      handlers: {
        GET: handleCallbackRoute(),
      },
    },
  });
  ```

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] File created: `src/routes/callback.tsx`
  - [ ] No TypeScript errors
  - [ ] Route tree regenerates with `/callback`

  **Commit**: YES
  - Message: `feat(auth): add OAuth callback route handler`
  - Files: `src/routes/callback.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 5. Create src/routes/_authenticated.tsx layout route

  **What to do**:
  - Create `src/routes/_authenticated.tsx` layout route
  - Add `loader` function that checks auth with `getAuth()`
  - Redirect to sign-in if not authenticated, preserving return path
  - Render `<Outlet />` for nested routes

  **Must NOT do**:
  - Add any UI elements to this layout (it's just protection)
  - Use client-side auth checks

  **Parallelizable**: YES (with tasks 2-4, after task 1)

  **References**:

  **Template Pattern**:
  ```typescript
  import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
  import { getAuth, getSignInUrl } from '@workos/authkit-tanstack-react-start';

  export const Route = createFileRoute('/_authenticated')({
    loader: async ({ location }) => {
      const { user } = await getAuth();
      if (!user) {
        const path = location.pathname;
        const href = await getSignInUrl({ data: { returnPathname: path } });
        throw redirect({ href });
      }
    },
    component: () => <Outlet />,
  });
  ```

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] File created: `src/routes/_authenticated.tsx`
  - [ ] No TypeScript errors
  - [ ] Route tree regenerates

  **Commit**: YES
  - Message: `feat(auth): add _authenticated layout route with server-side protection`
  - Files: `src/routes/_authenticated.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 6. Move calendar route to _authenticated folder

  **What to do**:
  - Create `src/routes/_authenticated/` directory
  - Move `src/routes/calendar.tsx` to `src/routes/_authenticated/calendar.tsx`
  - Update the route path in `createFileRoute` from `/calendar` to `/_authenticated/calendar`
  - Remove `<AuthLoading>`, `<Authenticated>`, `<Unauthenticated>` wrappers
  - Remove `AuthenticatedLayout` wrapper (sidebar still works via component)
  - Keep all calendar functionality intact

  **Must NOT do**:
  - Change calendar view logic
  - Change CalendarProvider or DndProviderWrapper
  - Remove the AuthenticatedLayout (keep it for the sidebar)

  **Parallelizable**: NO (depends on 5)

  **References**:

  **Current File**:
  - `src/routes/calendar.tsx:61-75` - Current auth wrapper structure

  **Target Structure**:
  ```typescript
  // src/routes/_authenticated/calendar.tsx
  import { createFileRoute } from "@tanstack/react-router";
  // ... other imports (keep all existing)
  import { AuthenticatedLayout } from "@/components/layouts/AuthenticatedLayout";

  export const Route = createFileRoute('/_authenticated/calendar')({
    validateSearch: calendarSearchSchema,
    component: CalendarRoute,
  });

  function CalendarRoute() {
    // No auth wrappers needed - _authenticated layout handles protection
    return (
      <AuthenticatedLayout>
        <CalendarContent />
      </AuthenticatedLayout>
    );
  }
  ```

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Directory created: `src/routes/_authenticated/`
  - [ ] File moved and updated
  - [ ] Old `src/routes/calendar.tsx` deleted
  - [ ] Route tree regenerates with `/_authenticated/calendar`
  - [ ] No TypeScript errors

  **Commit**: YES
  - Message: `refactor(auth): move calendar to protected _authenticated route`
  - Files: `src/routes/_authenticated/calendar.tsx`, delete `src/routes/calendar.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 7. Update __root.tsx to remove old providers

  **What to do**:
  - Remove `WorkOSProvider` import and usage (now in router)
  - Remove `ConvexProvider` import and usage (now in router)
  - Keep devtools, Scripts, HeadContent
  - The providers are now in router.tsx's `Wrap` property

  **Must NOT do**:
  - Remove devtools
  - Remove Scripts or HeadContent
  - Add new providers here

  **Parallelizable**: NO (depends on 3)

  **References**:

  **Current File**:
  - `src/routes/__root.tsx:52-68` - Current provider structure

  **Target Structure**:
  ```typescript
  function RootDocument({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en">
        <head>
          <HeadContent />
        </head>
        <body>
          {children}
          <TanStackDevtools ... />
          <Scripts />
        </body>
      </html>
    );
  }
  ```

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] File updated: `src/routes/__root.tsx`
  - [ ] WorkOSProvider removed
  - [ ] ConvexProvider removed
  - [ ] No TypeScript errors
  - [ ] Run: `pnpm dev` → App starts

  **Commit**: YES
  - Message: `refactor(auth): remove providers from root (moved to router)`
  - Files: `src/routes/__root.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 8. Cleanup old provider files

  **What to do**:
  - Delete `src/integrations/workos/provider.tsx` (no longer needed)
  - Delete `src/integrations/convex/provider.tsx` (no longer needed)
  - Remove unused packages if desired: `@workos-inc/authkit-react`, `@convex-dev/workos`

  **Must NOT do**:
  - Delete TanStack Query integrations
  - Delete convex/_generated files

  **Parallelizable**: NO (depends on 7)

  **References**:

  **Files to Delete**:
  - `src/integrations/workos/provider.tsx`
  - `src/integrations/convex/provider.tsx`

  **Packages to Remove (optional)**:
  - `@workos-inc/authkit-react` (replaced by `@workos/authkit-tanstack-react-start`)
  - `@convex-dev/workos` (Convex auth now via standard `ConvexProviderWithAuth`)

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Files deleted
  - [ ] No import errors in project
  - [ ] Run: `pnpm dev` → App starts
  - [ ] Run: `pnpm build` → Build succeeds

  **Commit**: YES
  - Message: `refactor(auth): remove old auth provider files`
  - Files: Delete provider files
  - Pre-commit: `pnpm build`

---

- [x] 9. Final verification and testing

  **What to do**:
  - Test complete auth flow in browser
  - Verify all acceptance criteria from Definition of Done

  **Must NOT do**:
  - Skip any verification step
  - Assume it works without testing

  **Parallelizable**: NO (final task)

  **References**:

  **Test Cases**:
  1. Sign out (if signed in)
  2. Visit `/calendar` directly
  3. Verify redirect to WorkOS sign-in
  4. Complete sign-in
  5. Verify redirect back to `/calendar`
  6. Verify calendar loads with events
  7. Refresh page - verify stays authenticated
  8. Visit `/` (landing) - verify accessible
  9. Verify sidebar still works

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Run: `pnpm dev`
  - [ ] Sign out if currently signed in
  - [ ] Navigate to `/calendar` → Redirected to WorkOS sign-in
  - [ ] Complete sign-in → Redirected back to `/calendar`
  - [ ] Calendar displays with events
  - [ ] Refresh `/calendar` → Stays on page (authenticated)
  - [ ] Navigate to `/` → Landing page accessible
  - [ ] Sidebar toggle works
  - [ ] Run: `pnpm build` → Build succeeds

  **Commit**: NO (verification only)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(auth): install authkit-tanstack-react-start` | package.json | pnpm install |
| 2 | `feat(auth): add authkit middleware` | start.ts | pnpm check |
| 3 | `feat(auth): configure router with auth providers` | router.tsx | pnpm check |
| 4 | `feat(auth): add OAuth callback route` | callback.tsx | pnpm check |
| 5 | `feat(auth): add _authenticated layout route` | _authenticated.tsx | pnpm check |
| 6 | `refactor(auth): move calendar to protected route` | _authenticated/calendar.tsx | pnpm check |
| 7 | `refactor(auth): remove providers from root` | __root.tsx | pnpm dev |
| 8 | `refactor(auth): remove old auth provider files` | delete files | pnpm build |

---

## Success Criteria

### Verification Commands
```bash
pnpm check    # Expected: No errors
pnpm build    # Expected: Build succeeds
pnpm dev      # Expected: App runs, test auth flow
```

### Final Checklist
- [x] Server-side auth protection working
- [x] No flash of unauthenticated content
- [x] Return-to-original-path after sign-in
- [x] Landing page accessible to all
- [x] Calendar accessible to authenticated users
- [x] Convex queries working with auth
- [x] Sidebar layout preserved
- [x] Old provider files removed
