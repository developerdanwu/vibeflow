---
name: tanstack-start
description: |
    TanStack Start is a full-stack React framework that combines the power of TanStack Router with server-side rendering, data fetching, and modern deployment capabilities. It provides a seamless developer experience with type safety from database to frontend.
user-invocable: true
---

## Overview

TanStack Start is a full-stack React framework that combines the power of TanStack Router with server-side rendering, data fetching, and modern deployment capabilities. It provides a seamless developer experience with type safety from database to frontend.

## Core Concepts

### 1. File-Based Routing
- Routes are defined in `src/routes/` directory
- File names map to URL paths automatically
- Special naming conventions:
  - `index.tsx` → `/` (index route)
  - `$param.tsx` → Dynamic segments
  - `__root.tsx` → Root layout
  - `api.*.ts` → API routes

### 2. Route Creation Patterns

```typescript
// Standard route with loader
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/path')({
  component: Component,
  loader: async ({ params, context }) => {
    // Fetch data here
    return data
  },
  beforeLoad: async ({ params, context, location }) => {
    // Authentication/guards
  },
  errorComponent: ErrorBoundary,
})

// Root route with context
import { createRootRouteWithContext } from '@tanstack/react-router'

interface RouterContext {
  queryClient: QueryClient
  auth: AuthState
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})
```

### 3. Server Functions

```typescript
import { createServerFn } from '@tanstack/react-start'

// GET server function
const getServerData = createServerFn({
  method: 'GET',
}).handler(async () => {
  // Runs only on server
  return await db.getData()
})

// POST with validation
const updateData = createServerFn({
  method: 'POST',
})
  .validator((input: { id: string; data: any }) => input)
  .handler(async ({ data }) => {
    return await db.update(data)
  })
```

## Essential Patterns

### 1. Data Loading Strategy

```typescript
export const Route = createFileRoute('/posts/$id')({
  loader: async ({ params, context: { queryClient } }) => {
    // Parallel data loading
    const [post, user] = await Promise.all([
      queryClient.ensureQueryData(postQueryOptions(params.id)),
      queryClient.ensureQueryData(userQueryOptions(params.userId))
    ])
    
    // Deferred loading for non-critical data
    const deferredComments = queryClient.ensureQueryData(
      commentsQueryOptions(params.id)
    )
    
    return { post, user, deferredComments }
  },
  component: PostPage,
})
```

### 2. SSR Control

```typescript
// Selective SSR per route
export const Route = createFileRoute('/dashboard')({
  ssr: false, // Client-only rendering
  component: Dashboard,
})

// Full SSR (default)
export const Route = createFileRoute('/public')({
  ssr: true,
  component: PublicPage,
})
```

### 3. Authentication Pattern

```typescript
export const Route = createFileRoute('/protected')({
  beforeLoad: async ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.pathname }
      })
    }
  },
  component: ProtectedComponent,
})
```

### 4. API Routes

```typescript
// src/routes/api.users.ts
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/users')({
  // GET handler
  loader: async () => {
    const users = await db.users.findMany()
    return Response.json(users)
  },
})

// Server function for mutations
const createUser = createServerFn({
  method: 'POST'
}).handler(async ({ data }) => {
  return await db.users.create({ data })
})
```

## Project Setup

### 1. Initial Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    tanstackStart(),
    viteReact(),
  ],
})
```

### 2. Router Setup

```typescript
// src/router.tsx
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { routeTree } from './routeTree.gen'

export const getRouter = () => {
  const queryClient = getQueryClient()
  
  const router = createRouter({
    routeTree,
    context: {
      queryClient,
    },
    defaultPreload: 'intent',
  })
  
  setupRouterSsrQueryIntegration({ router, queryClient })
  
  return router
}
```

### 3. Root Layout

```typescript
// src/routes/__root.tsx
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
```

## Integration Patterns

### 1. TanStack Query Integration

```typescript
// Loader with query prefetching
export const Route = createFileRoute('/posts')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.prefetchQuery({
      queryKey: ['posts'],
      queryFn: fetchPosts,
    })
  },
  component: () => {
    const { data } = useSuspenseQuery({
      queryKey: ['posts'],
      queryFn: fetchPosts,
    })
    return <PostsList posts={data} />
  },
})
```

### 2. Convex Integration

```typescript
import { convexQuery } from '@convex-dev/react-query'

export const Route = createFileRoute('/messages')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(
      convexQuery(api.messages.list, {})
    )
  },
  component: () => {
    const { data } = useSuspenseQuery(
      convexQuery(api.messages.list, {})
    )
    return <MessagesList messages={data} />
  },
})
```

### 3. Authentication (WorkOS/Clerk)

```typescript
// With WorkOS
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context }) => {
    const { user } = await context.workos.getUser()
    if (!user) {
      throw redirect({ to: '/login' })
    }
    return { user }
  },
})

// With Clerk
import { SignedIn, SignedOut } from '@clerk/tanstack-react-start'

function Component() {
  return (
    <>
      <SignedIn>
        <Dashboard />
      </SignedIn>
      <SignedOut>
        <SignInButton />
      </SignedOut>
    </>
  )
}
```

## Advanced Features

### 1. Nested Layouts

```typescript
// src/routes/admin.tsx (layout)
export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

// src/routes/admin/users.tsx (nested route)
export const Route = createFileRoute('/admin/users')({
  component: UsersPage,
})
```

### 2. Error Boundaries

```typescript
export const Route = createFileRoute('/risky')({
  errorComponent: ({ error }) => (
    <div className="error">
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
    </div>
  ),
  component: RiskyComponent,
})
```

### 3. Loading States

```typescript
export const Route = createFileRoute('/slow')({
  pendingComponent: () => <Skeleton />,
  loader: async () => {
    // Slow data fetch
    await new Promise(r => setTimeout(r, 2000))
    return data
  },
  component: SlowComponent,
})
```

### 4. Search Params

```typescript
export const Route = createFileRoute('/search')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      query: (search.query as string) || '',
      page: Number(search.page ?? 1),
    }
  },
  component: () => {
    const { query, page } = Route.useSearch()
    const navigate = Route.useNavigate()
    
    return (
      <SearchPage
        query={query}
        page={page}
        onSearch={(q) => navigate({ search: { query: q, page: 1 } })}
      />
    )
  },
})
```

## Deployment

### 1. Cloudflare Pages/Workers

```typescript
// wrangler.jsonc
{
  "name": "my-app",
  "compatibility_date": "2024-01-01",
  "main": "./dist/server.js",
  "assets": "./dist/client"
}

// vite.config.ts
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart(),
  ],
})
```

### 2. Build Commands

```bash
# Development
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview

# Deploy to Cloudflare
pnpm deploy
```

## Performance Optimization

### 1. Code Splitting
- Automatic route-based code splitting
- Lazy loading with `createLazyFileRoute`

### 2. Prefetching
```typescript
// Prefetch on hover
<Link to="/posts" preload="intent">Posts</Link>

// Always prefetch
<Link to="/critical" preload="render">Critical</Link>
```

### 3. Data Caching
```typescript
// Cache in loader
export const Route = createFileRoute('/cached')({
  loader: async ({ context: { queryClient } }) => {
    return queryClient.fetchQuery({
      queryKey: ['data'],
      queryFn: fetchData,
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  },
})
```

## Common Pitfalls & Solutions

### 1. Hydration Mismatches
**Problem**: Content differs between server and client
**Solution**: Use `useIsMounted()` hook or conditional rendering

### 2. Environment Variables
**Problem**: Server variables exposed to client
**Solution**: Use `VITE_` prefix for client-safe variables

### 3. Route Generation
**Problem**: `routeTree.gen.ts` not updating
**Solution**: Restart dev server or run `pnpm dev`

### 4. Type Safety
**Problem**: Lost type inference in loaders
**Solution**: Always type context and use `Route.useLoaderData()`

## Testing Patterns

```typescript
// Route component testing
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from '@tanstack/react-router'

test('renders route', async () => {
  const router = createMemoryRouter({
    routes: [Route],
    initialEntries: ['/path'],
  })
  
  render(<RouterProvider router={router} />)
  // assertions...
})
```

## Migration Guide

### From Next.js
- Move pages from `pages/` to `src/routes/`
- Replace `getServerSideProps` with `loader`
- Replace `getStaticProps` with `loader` + caching
- Replace `_app.tsx` with `__root.tsx`

### From Remix
- Similar file-based routing structure
- Replace `loader` functions with TanStack Start loaders
- Replace `action` with server functions
- Update meta exports to `head` property

## Resources

- [Official Docs](https://tanstack.com/start/latest)
- [GitHub](https://github.com/TanStack/router)
- [Discord Community](https://tlinz.com/discord)
- [Examples](https://github.com/TanStack/router/tree/main/examples)

## Quick Reference

```typescript
// Essential imports
import { 
  createFileRoute,
  createRootRouteWithContext,
  createLazyFileRoute,
  redirect,
  Link,
  Outlet,
  useNavigate,
  useParams,
  useSearch,
} from '@tanstack/react-router'

import { 
  createServerFn,
  HeadContent,
  Scripts,
} from '@tanstack/react-start'

// Route exports
export const Route = createFileRoute('/path')({
  // Configuration
  ssr: true,              // Enable SSR
  component: Component,   // Main component
  loader: loaderFn,      // Data fetching
  beforeLoad: guardFn,   // Authentication/guards
  errorComponent: Error, // Error boundary
  pendingComponent: Loading, // Loading state
  validateSearch: validation, // Search params
  head: () => meta,      // Meta tags
})
```
