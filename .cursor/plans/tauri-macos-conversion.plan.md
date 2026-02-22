---
name: ""
overview: ""
todos: []
isProject: false
---

# Tauri macOS conversion plan

**Overview:** Convert VibeFlow to a Tauri 2 app for macOS distribution by adding Tauri tooling and a static build path, then adapting WorkOS auth to a desktop OAuth flow when running inside Tauri. Web deployment stays unchanged.

**Reference:** [tauri-tanstack-start-react-template](https://github.com/kvnxiao/tauri-tanstack-start-react-template).

---

## Execution order

- **Convex-backend** Sub-task A first (WorkOS code-exchange action; Frontend-ui will call it from Tauri callback).
- **Frontend-ui** Sub-task B (Tauri scaffold + dual-build) and Sub-task E (remove unused server fn) can run in parallel with A.
- Then **Frontend-ui** Sub-task C (auth branching for Tauri), which depends on A and B.
- Then **Frontend-ui** Sub-task D (Tauri API guards + docs), which depends on B.

---

## Summary table


| ID  | Owner          | Scope                                                     | Purpose                                        |
| --- | -------------- | --------------------------------------------------------- | ---------------------------------------------- |
| A   | Convex-backend | convex/                                                   | WorkOS code-exchange action for Tauri callback |
| B   | Frontend-ui    | package.json, vite config, src-tauri/                     | Tauri scaffold and SPA build path              |
| C   | Frontend-ui    | src/routes (callback, _authenticated), router, tauri-auth | Desktop OAuth flow when in Tauri               |
| D   | Frontend-ui    | Tauri API call sites, AGENTS.md or src/docs               | Guards and documentation                       |
| E   | Frontend-ui    | src/data/demo.punk-songs.ts                               | Remove unused createServerFn for SPA build     |


---

## Convex-backend agent

### Sub-task A: WorkOS code-exchange action (run first)

- **Owner:** Convex-backend
- **Scope:** New Convex action in `convex/` (e.g. `convex/auth.ts` or `convex/workos.ts`). Action accepts WorkOS auth `code` (and optional `redirectUri`/state), calls WorkOS to exchange code for tokens, then returns a session/token shape the frontend can use (or stores session server-side and returns a minimal payload). Use WorkOS server SDK; client secret stays in Convex env/secrets.
- **Depends on:** None
- **Handoff:** Contract: action name and args (e.g. `exchangeWorkOSCode({ code, redirectUri })`); return type (e.g. `{ accessToken, user }` or cookie-equivalent) so Frontend-ui can plug into existing `useAuthFromWorkOS` / Convex auth.
- **Verification:** Call action from Convex dashboard or a small test with a real/auth code; confirm tokens/session returned. Convex tests if added.

---

## Frontend-ui agent

### Sub-task B: Tauri scaffold and dual-build config

- **Owner:** Frontend-ui
- **Scope:** `package.json` (add `@tauri-apps/cli`, `@tauri-apps/api`, optional plugins; add scripts `dev:vite`, `build:vite`, `tauri dev`, `tauri build`). Vite: either a Tauri-only config (e.g. `vite.tauri.config.ts`) or env branch in [vite.config.ts](vite.config.ts) so that when building for Tauri we add Nitro and TanStack Start SPA mode (output `.output/public`). Include `contentCollections` in Tauri build. Create `src-tauri/` via `pnpm tauri init` or copy template’s `src-tauri/`; set [tauri.conf.json](https://github.com/kvnxiao/tauri-tanstack-start-react-template/blob/main/src-tauri/tauri.conf.json) `beforeDevCommand`, `devUrl`, `beforeBuildCommand`, `frontendDist: "../.output/public"`, `identifier` (e.g. `com.vibeflow.app`). Ensure web `pnpm build` and `pnpm dev` stay unchanged (default config = current behavior).
- **Depends on:** None
- **Handoff:** `pnpm tauri dev` starts Vite and opens Tauri window; `pnpm tauri build` produces macOS app and populates `.output/public`. No change to web build.
- **Verification:** `pnpm tauri build` succeeds; built app opens; `pnpm build` still produces existing web artifact.

### Sub-task C: Auth branching for Tauri (desktop OAuth flow)

- **Owner:** Frontend-ui
- **Scope:** [src/routes/_authenticated.tsx](src/routes/_authenticated.tsx) (when in Tauri, do not use server `getAuth()`/`getSignInUrl()` in loader; use client-side guard and redirect to Tauri sign-in). [src/routes/callback.tsx](src/routes/callback.tsx) (when in Tauri and no server, render client component that reads `code` from URL, calls Convex action from Sub-task A to exchange, then stores session and redirects). Add Tauri sign-in entry (e.g. open system browser to WorkOS with custom redirect URI `vibeflow://auth/callback`). [src/router.tsx](src/router.tsx): ensure Tauri session (from code exchange) feeds same `useAuthFromWorkOS` / `AuthKitProvider` contract so Convex auth works. Add runtime Tauri detection (`window.__TAURI_INTERNALS`__ or `import.meta.env.VITE_TAURI`). WorkOS Dashboard: add redirect URI for desktop app (manual step; document in handoff).
- **Depends on:** Sub-task A (Convex action to call), Sub-task B (Tauri build to test in)
- **Handoff:** In Tauri production build, unauthenticated users go to WorkOS via browser; callback handled in client; code exchanged via Convex action; protected routes and Convex work. Web and `tauri dev` (localhost) keep existing server auth.
- **Verification:** In Tauri window (production build or dev with desktop flow), sign in via browser → callback → session; open protected route and confirm Convex data. In browser, confirm existing web auth and callback still work. `pnpm check` passes.

### Sub-task D: Tauri API guards and documentation

- **Owner:** Frontend-ui
- **Scope:** Any place that uses `@tauri-apps/api` (e.g. opening URLs): guard with `window.__TAURI_INTERNALS__ != null` or dynamic import so it never runs in browser or during SSR. [AGENTS.md](AGENTS.md) (or a short `src/docs/tauri.md`): how to run Tauri dev vs web dev; production Tauri uses static build + desktop auth; Tauri API usage must be guarded outside webview.
- **Depends on:** Sub-task B
- **Handoff:** No `__TAURI_INTERNALS`__ errors when opening app in browser; docs describe Tauri vs web workflow.
- **Verification:** `pnpm check`; open web app in browser and confirm no Tauri errors; AGENTS.md or tauri.md updated.

### Sub-task E: Remove unused server function for SPA build

- **Owner:** Frontend-ui
- **Scope:** [src/data/demo.punk-songs.ts](src/data/demo.punk-songs.ts): remove `createServerFn` (getPunkSongs) or replace with static/client data so SPA/Tauri build has no server function that would run on a non-existent server.
- **Depends on:** None
- **Handoff:** No server fn left that could be invoked in Tauri/SPA context.
- **Verification:** `pnpm check`; `pnpm tauri build` (and web build) succeed; no references to `getPunkSongs` or remove those references too.

---

## Out of scope (document only)

- **macOS notarization and code signing:** Required for distribution; follow Tauri + Apple docs; do not store signing secrets in repo.
- **Nitro + SPA versioning:** Use a known-good Nitro/TanStack Start version (e.g. template’s); track [TanStack/router#5967](https://github.com/TanStack/router/issues/5967) if upgrading.

