# Tauri desktop app

VibeFlow can be built as a Tauri 2 desktop app for macOS. The same codebase and **same auth flow** as the web app are used: client-side auth via authkit-react, single `/oauth/workos-callback` route, no server-side auth.

## Commands

- **`pnpm tauri:dev`** – Starts the Vite dev server and opens the Tauri window. Use this for desktop development. Convex: run `pnpm convex:dev` in another terminal when needed.
- **`pnpm tauri:build`** – Builds the frontend with the same `vite.config.ts` as web (`pnpm build`), then builds the Tauri app. Output: `src-tauri/target/release/bundle/`.

Web app commands (`pnpm dev`, `pnpm build`) use the same Vite config; Tauri’s `beforeBuildCommand` runs `pnpm build`, so both targets use `dist/` as the frontend output.

## Auth (web and Tauri)

Web and Tauri both use **authkit-react** and **ConvexProviderWithAuthKit**. There is no server-side auth or separate callback route for Tauri.

1. **Sign-in:** Unauthenticated users see "Opening sign in…". authkit-react’s `signIn()` navigates to the WorkOS Hosted AuthKit page (in the browser or Tauri webview).
2. **Redirect URI:** The app uses the current origin + `/oauth/workos-callback` (e.g. `https://yourapp.com/oauth/workos-callback` for web, `http://localhost:3000/oauth/workos-callback` for Tauri dev). Set `VITE_WORKOS_REDIRECT_URI` in env. Configure these in the WorkOS Dashboard.
3. **Callback:** The app loads `/oauth/workos-callback?code=...`. authkit-react’s provider handles the code exchange client-side; the callback page then redirects to `/`.

## OAuth integrations (Google Calendar, Linear) in Tauri

### Google Calendar (system browser + deep link)

Uses **system browser** and **`vibeflow://`** so the OS routes back to the app. `getOAuthRedirectUri("settings/calendars/callback")` → `vibeflow://settings/calendars/callback` in Tauri. Register that URI in Google Cloud Console (Desktop app type). `openOAuthUrl(authUrl)` opens the auth URL in the system browser; `useDeepLinkListener` handles the deep link and navigates to the callback route.

### Linear (http-only callback, public route)

Linear's dashboard only accepts **http(s)** callback URLs, not custom schemes. Use `getOAuthRedirectUriHttp("oauth/linear-callback")` → `http://localhost:3000/oauth/linear-callback` (Tauri dev) or `${origin}/oauth/linear-callback` (web). Register only these in Linear's "Callback URLs".

**Callback must be a public route** (not under `_authenticated`). When the flow runs in the system browser, the redirect lands in that browser—which may not have the user's app session. The backend identifies the user from the OAuth `state` parameter; do not require auth on the callback page. Route lives at `src/routes/oauth/linear-callback.tsx` → path `/oauth/linear-callback`.

For "system browser then back to app": redirect_uri can point at your website; that page exchanges the code (or calls your backend), then shows "Open VibeFlow" with a `vibeflow://` link. Pass `fromDesktop: true` in `state` so the page knows to show the app CTA.

### Helpers

`@/lib/oauth`: `getOAuthRedirectUri`, `getOAuthRedirectUriHttp`, `openOAuthUrl`. `@/lib/use-deep-link-listener` for deep links. WorkOS (main login) stays in-webview.

## Tauri API guards

Code that uses Tauri APIs (e.g. `@tauri-apps/plugin-opener` to open URLs) must only run inside the Tauri webview:

- Use **`isTauri()`** from `@/lib/tauri` before calling any Tauri API.
- Or **dynamic import**: `const { openUrl } = await import("@tauri-apps/plugin-opener");` only when `isTauri()` is true.

Otherwise the app may throw `window.__TAURI_INTERNALS__ is undefined` when run in a normal browser.

## Config

- **Vite:** Single `vite.config.ts` for both web and Tauri; uses `@tanstack/router-plugin/vite` (SPA). Tauri dev/build runs the same `pnpm dev` / `pnpm build`; `envPrefix` includes `TAURI_ENV_*` for optional build-time platform detection.
- **Tauri:** `src-tauri/tauri.conf.json` – `beforeBuildCommand: pnpm build`, `beforeDevCommand: pnpm dev`, `frontendDist: ../dist`, `identifier: com.vibeflow.app`.
