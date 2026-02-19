import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import type { useAuth } from "@workos-inc/authkit-react";
import { ConvexReactClient } from "convex/react";
import { FullPageLoader } from "./components/full-page-loader";
import { ZEnvSchema } from "./lib/env";
import { routeTree } from "./routeTree.gen";

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>["router"];
	}
}

export type AuthContext = ReturnType<typeof useAuth>;

export function getRouter() {
	const env = ZEnvSchema.parse(import.meta.env);
	const convex = new ConvexReactClient(env.VITE_CONVEX_URL);
	const convexQueryClient = new ConvexQueryClient(convex);

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				queryKeyHashFn: convexQueryClient.hashFn(),
				queryFn: convexQueryClient.queryFn(),
				gcTime: 5000,
			},
		},
	});
	convexQueryClient.connect(queryClient);

	const router = createRouter({
		routeTree,
		defaultPreload: "intent",
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
		defaultPendingComponent: () => <FullPageLoader />,
		defaultErrorComponent: (err) => <p>{err.error.stack}</p>,
		defaultNotFoundComponent: () => <p>not found</p>,
		context: {
			convex,
			queryClient,
			env,
			authPromise: undefined as unknown as Promise<AuthContext>,
		},
	});

	return { router, queryClient, convexQueryClient, env };
}
