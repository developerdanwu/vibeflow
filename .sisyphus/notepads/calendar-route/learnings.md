# Calendar Route Implementation Learnings

## Convex + WorkOS AuthKit Integration

### Required Setup Steps

1. **Install the integration package:**
   ```bash
   pnpm add @convex-dev/workos
   ```

2. **Create `convex/auth.config.ts`:**
   ```typescript
   const clientId = process.env.WORKOS_CLIENT_ID;
   const authConfig = {
     providers: [
       {
         type: "customJwt",
         issuer: "https://api.workos.com/",
         algorithm: "RS256",
         jwks: `https://api.workos.com/sso/jwks/${clientId}`,
         applicationID: clientId,
       },
       {
         type: "customJwt",
         issuer: `https://api.workos.com/user_management/${clientId}`,
         algorithm: "RS256",
         jwks: `https://api.workos.com/sso/jwks/${clientId}`,
       },
     ],
   };
   export default authConfig;
   ```

3. **Set environment variables:**
   - In `.env.local`:
     - `VITE_WORKOS_CLIENT_ID`
     - `VITE_WORKOS_REDIRECT_URI` (e.g., `http://localhost:3000/callback`)
   - In Convex Dashboard:
     - `WORKOS_CLIENT_ID` (same value as VITE_WORKOS_CLIENT_ID)

4. **Configure WorkOS Dashboard:**
   - Enable CORS for your development domain (e.g., `http://localhost:3000`)
   - Set redirect URI in AuthKit settings

5. **Use `ConvexProviderWithAuthKit`:**
   ```typescript
   import { ConvexProviderWithAuthKit } from "@convex-dev/workos";
   import { useAuth } from "@workos-inc/authkit-react";
   
   <ConvexProviderWithAuthKit client={convex} useAuth={useAuth}>
     {children}
   </ConvexProviderWithAuthKit>
   ```

### Authentication in Convex Functions

- Use `ctx.auth.getUserIdentity()` to get the authenticated user
- The user ID is available as `identity.subject`
- Return `null` or `[]` for unauthenticated requests in queries
- Throw errors for unauthenticated requests in mutations

### UI Components for Auth State

Use Convex's built-in components instead of checking auth state manually:
- `<Authenticated>` - Renders children only when authenticated
- `<Unauthenticated>` - Renders children only when not authenticated
- `<AuthLoading>` - Renders children while auth is loading

### Key Patterns

1. **Don't pass userId from client** - Use `ctx.auth.getUserIdentity().subject` server-side
2. **Use `useConvexAuth()`** for auth state instead of WorkOS's `useAuth()`
3. **Queries that need auth should return empty data for unauthenticated users**
4. **Mutations that need auth should throw errors for unauthenticated users**

## Date Handling

- URL date format: `YYYY-MM-DD` (ISO date string)
- Convex stores dates as Unix timestamps (numbers)
- Calendar components expect ISO date strings
- Always validate date parsing with `Number.isNaN(parsed.getTime())`
