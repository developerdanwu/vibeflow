# Auth Fix: WorkOS + Convex Integration per Official Docs

## Context

### Original Request
Fix the WorkOS + Convex authentication integration to follow the official Convex documentation at https://docs.convex.dev/auth/authkit/

### Current State
The auth integration is mostly correct but needs a few adjustments:
1. WorkOS provider missing `redirectUri` prop
2. Need to verify CORS is set up correctly

---

## Work Objectives

### Core Objective
Update the WorkOS provider to match the official Convex + AuthKit documentation exactly.

### Concrete Deliverables
- Updated `src/integrations/workos/provider.tsx` with `redirectUri`
- Verified callback route exists (or created if needed)
- Documentation for required environment variables

### Definition of Done
- [x] `convex/auth.config.ts` matches docs ✓ (already correct)
- [x] `ConvexProviderWithAuthKit` used ✓ (already correct)
- [ ] `AuthKitProvider` has `redirectUri` prop
- [ ] All required environment variables documented
- [ ] Build passes

---

## TODOs

- [ ] 1. Update WorkOS Provider with redirectUri

  **What to do**:
  - Update `src/integrations/workos/provider.tsx`
  - Add `VITE_WORKOS_REDIRECT_URI` environment variable
  - Remove `apiHostname` (not in official docs, may not be needed)
  - Remove `devMode` (not in official docs)
  - Add `redirectUri` prop to `AuthKitProvider`

  **Pattern from docs**:
  ```tsx
  <AuthKitProvider
    clientId={import.meta.env.VITE_WORKOS_CLIENT_ID}
    redirectUri={import.meta.env.VITE_WORKOS_REDIRECT_URI}
  >
  ```

  **References**:
  - `src/integrations/workos/provider.tsx` - File to modify
  - https://docs.convex.dev/auth/authkit/ - Official guide

  **Acceptance Criteria**:
  - [ ] `AuthKitProvider` has `clientId` and `redirectUri` props
  - [ ] Build passes with `pnpm build`

  **Commit**: YES
  - Message: `fix(auth): update WorkOS provider to match official Convex docs`

- [ ] 2. Create Callback Route (if needed)

  **What to do**:
  - Check if `/callback` route exists
  - If not, create `src/routes/callback.tsx` to handle OAuth redirect
  - The callback just needs to render while AuthKit handles the token exchange

  **Pattern from docs**:
  The redirect URI should be `http://localhost:5173/callback` for Vite apps.
  AuthKit handles the callback automatically via the provider.

  **Acceptance Criteria**:
  - [ ] Callback route exists at `/callback`
  - [ ] OAuth flow redirects properly

  **Commit**: YES (if changes made)
  - Message: `feat(auth): add OAuth callback route`

- [ ] 3. Document Environment Variables

  **What to do**:
  - Update `.env.local.example` or README with required variables:
    - `VITE_WORKOS_CLIENT_ID` - WorkOS Client ID
    - `VITE_WORKOS_REDIRECT_URI` - e.g., `http://localhost:5173/callback`
    - `VITE_CONVEX_URL` - Convex deployment URL
  - Note that `WORKOS_CLIENT_ID` must also be set in Convex Dashboard

  **Acceptance Criteria**:
  - [ ] All required env vars documented

  **Commit**: NO (documentation only)

---

## Verification

```bash
pnpm build  # Must pass
pnpm test   # Must pass
```

### Manual Testing
1. Start dev server: `pnpm dev`
2. Start Convex: `npx convex dev`
3. Navigate to `/calendar`
4. Should see sign-in prompt
5. Click sign in → redirects to WorkOS
6. After auth → redirects back to `/callback`
7. User should be authenticated and see calendar
