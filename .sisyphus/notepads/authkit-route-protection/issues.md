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


## [2026-01-25T04:10:00] useAuth Hook Context Error - RESOLVED

### Issue
Error: "useAuth must be used within an AuthKitProvider"
Even though AuthKitProvider was wrapping the app in router.tsx

### Root Cause
The `useAuthFromWorkOS` function was calling hooks (`useAuth()`, `useAccessToken()`) at the module level, outside of any React component. React hooks can only be called inside functional components.

### Solution
Converted `useAuthFromWorkOS` function to `ConvexAuthBridge` component:
- Component properly calls hooks inside React component context
- AuthKitProvider wraps ConvexAuthBridge
- ConvexAuthBridge calls useAuth/useAccessToken hooks
- Then wraps children with ConvexProviderWithAuth

### Code Change
```typescript
// Before (WRONG - hooks at module level)
function useAuthFromWorkOS() {
  const { loading, user } = useAuth(); // ❌ Called outside component
  // ...
}

// After (CORRECT - hooks inside component)
function ConvexAuthBridge({ children }) {
  const { loading, user } = useAuth(); // ✅ Called inside component
  // ...
  return <ConvexProviderWithAuth ...>{children}</ConvexProviderWithAuth>
}
```

### Status
✅ RESOLVED - Error should no longer occur after dev server restart

