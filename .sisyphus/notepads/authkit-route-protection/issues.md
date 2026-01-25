# Issues & Gotchas - AuthKit Route Protection

## Problems Encountered
(Subagents: append issues and solutions here)

## [2026-01-25T04:05:00] Dev Server Restart Required

### Issue
After creating `src/start.ts` with authkitMiddleware, the dev server shows error:
"AuthKit middleware is not configured"

### Root Cause
The dev server was already running when we created start.ts.
TanStack Start needs to be restarted to pick up the new middleware configuration.

### Solution
User must restart the dev server:
1. Stop current dev server (Ctrl+C)
2. Run `pnpm dev` again
3. The middleware will be loaded and auth will work correctly

### Verification
After restart, visiting /calendar while unauthenticated should redirect to WorkOS sign-in.

