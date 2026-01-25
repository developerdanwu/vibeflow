# Architectural Decisions - AuthKit Route Protection

## Decisions Made
(Subagents: append architectural choices here)

## [2026-01-25T04:02:00] Final Architecture Decisions

### Route Structure
- Public routes: `/` (landing page), `/callback` (OAuth)
- Protected routes: `/_authenticated/*` (requires authentication)
- Calendar moved from `/calendar` to `/_authenticated/calendar`

### Provider Architecture
- Moved from __root.tsx to router.tsx Wrap property
- AuthKitProvider wraps ConvexProviderWithAuth
- Custom useAuthFromWorkOS hook bridges WorkOS and Convex

### Authentication Flow
1. User visits protected route → loader runs getAuth()
2. If not authenticated → redirect to WorkOS sign-in with returnPathname
3. User signs in → WorkOS redirects to /callback
4. Callback handler processes OAuth → redirects to returnPathname
5. User lands on original requested page, authenticated

### Files Created
- src/start.ts - AuthKit middleware
- src/routes/callback.tsx - OAuth callback
- src/routes/_authenticated.tsx - Protected layout
- src/routes/_authenticated/calendar.tsx - Protected calendar
- src/routes/index.tsx - Public landing page (restored)

### Files Deleted
- src/integrations/workos/provider.tsx - Old client-side auth
- src/integrations/convex/provider.tsx - Old Convex provider
- src/routes/_auth.tsx - Unused layout file
- src/routes/calendar.tsx - Moved to _authenticated folder

