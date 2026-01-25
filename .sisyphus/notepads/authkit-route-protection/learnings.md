# Learnings - AuthKit Route Protection

## Conventions & Patterns
(Subagents: append findings here)

## [2026-01-25T03:50:00] Task 2: Create start.ts
- Created src/start.ts with authkitMiddleware
- Middleware runs on every request for session validation
- Uses createStart from @tanstack/react-start
- Registers authkitMiddleware() in requestMiddleware array
- No TypeScript errors detected

## [2026-01-25T03:52:00] Task 3: Update router.tsx
- Added AuthKitProvider from @workos/authkit-tanstack-react-start/client
- Created useAuthFromWorkOS hook to bridge WorkOS and Convex auth
- Hook provides isLoading, isAuthenticated, and fetchAccessToken
- Added Wrap property to router config with provider nesting
- ConvexProviderWithAuth now uses useAuthFromWorkOS instead of old useAuth
- No TypeScript errors in router.tsx

## [2026-01-25T03:53:00] Task 4: Create callback route
- Created src/routes/callback.tsx with handleCallbackRoute
- Uses server-side GET handler for OAuth callback
- Route path: /callback
- Handles WorkOS OAuth redirect automatically

## [2026-01-25T03:54:00] Task 5: Create _authenticated layout
- Created src/routes/_authenticated.tsx layout route
- Uses loader function with getAuth() for server-side auth check
- Redirects to WorkOS sign-in if not authenticated
- Preserves return path via returnPathname in sign-in URL
- Renders Outlet for nested routes
- TypeScript error expected until route tree regenerates

## [2026-01-25T03:55:00] Task 6: Move calendar to _authenticated
- Moved src/routes/calendar.tsx to src/routes/_authenticated/calendar.tsx
- Updated route path from "/calendar" to "/_authenticated/calendar"
- Removed AuthLoading, Authenticated, Unauthenticated wrappers
- Removed LoadingState and SignInPrompt components (no longer needed)
- Updated useAuth import to use @workos/authkit-tanstack-react-start/client
- Updated navigate paths to use /_authenticated/calendar
- Kept AuthenticatedLayout wrapper for sidebar functionality
- TypeScript errors expected until route tree regenerates

## [2026-01-25T03:56:00] Task 7: Update __root.tsx
- Removed WorkOSProvider import and usage
- Removed ConvexProvider import and usage
- Providers now in router.tsx's Wrap property
- Kept TanStackDevtools, Scripts, HeadContent
- Simplified RootDocument to just render children with devtools

## [2026-01-25T03:57:00] Task 8: Cleanup old providers
- Deleted src/integrations/workos/provider.tsx
- Deleted src/integrations/convex/provider.tsx
- Old packages (@workos-inc/authkit-react, @convex-dev/workos) can be removed later if desired
- All auth now handled by new @workos/authkit-tanstack-react-start package

