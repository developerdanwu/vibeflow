# Environment variables

**When this applies:** You need to read or validate `VITE_*` env vars in the frontend.

## Two layers

1. **Static typing** – `env.d.ts` at project root augments Vite’s `ImportMetaEnv` so `import.meta.env` has typed keys. No runtime validation.
2. **Runtime validation** – [src/lib/env.ts](src/lib/env.ts) defines a Zod schema `ZEnvSchema` and type `TEnv`. Env is parsed once and provided via router context.

## How env is parsed

1. **getRouter()** – In [router.tsx](src/router.tsx), `ZEnvSchema.parse(import.meta.env)` runs once. If any required field is missing, the app throws at startup. Parsed `env` is set on router context and returned for App to use (e.g. AuthKitProvider, RouterProvider context).
2. **Router context** – The root route context type includes `env: TEnv`. Any route under that provider can read `env` via `useRouteContext({ from: "/_authenticated" })` (or from the root that declares `env`).
3. **Using env in routes** – Prefer `context.env` so you get validated, typed values. Example: `const { env } = useRouteContext({ from: "/_authenticated" }); env.VITE_LINEAR_CLIENT_ID`.

## Auth from router context

**When this applies:** You need the current user or auth helpers (signIn, signOut, isLoading) in a route or any component under the router.

Auth is provided by the root route’s `beforeLoad` (it awaits `context.authPromise` and returns `{ auth }`). Read it from the root route context; do not add a separate React Context for auth.

### Root route id

Use the root route id `"__root__"` (no leading slash). The route tree uses this id for the root route.

**Wrong:** `useRouteContext({ from: "/__root__" })` — type error (invalid route id).

**Correct:** `useRouteContext({ from: "__root__" })` — returns root context including `auth`.

### Example

```tsx
const { auth } = useRouteContext({ from: "__root__" });
const user = auth.user;       // WorkOS user or null
const loading = auth.isLoading;
// auth.signIn, auth.signOut also available
```

## Schema: never optional

**All env vars in `ZEnvSchema` must be required** (e.g. `z.string()`). Do not use `z.string().optional()` or other optional validators. If a var is missing, the app should fail at startup when `ZEnvSchema.parse(import.meta.env)` runs. Optional env leads to undefined at runtime and feature-specific code paths that are easy to miss; required env keeps behavior predictable.

## Adding a new env var

1. Add the key to `env.d.ts` in `ImportMetaEnv` (optional = `?: string`, required = `: string`).
2. Add it to `ZEnvSchema` in [src/lib/env.ts](src/lib/env.ts) as **required** (`z.string()`). Do not add optional env to the schema.
3. Use `context.env` in routes or `parsedEnv` in App; avoid reading `import.meta.env` in components that have access to router context.
