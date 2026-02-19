import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { useAuth } from "@workos-inc/authkit-react";
import { ConvexReactClient } from "convex/react";
import { useMemo } from "react";
import { GlobalDialog } from "./components/dialogs/global-dialog";
import { FullPageLoader } from "./components/full-page-loader";
import { Toaster } from "./components/ui/sonner";
import { AppAuthProvider } from "./lib/auth-context";
import { DialogStoreProvider } from "./lib/dialog-store";
import { ZEnvSchema } from "./lib/env";
import { routeTree } from "./routeTree.gen";

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>["router"];
	}
}

function AuthBridge({ children }: { children: React.ReactNode }) {
	const { user, isLoading } = useAuth();
	const value = useMemo(
		() => ({ user, loading: isLoading }),
		[user, isLoading],
	);
	return <AppAuthProvider value={value}>{children}</AppAuthProvider>;
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
		Wrap: ({ children }) => (
			<AuthBridge>
				<DialogStoreProvider>
					{children}
					<GlobalDialog />
					<Toaster />
				</DialogStoreProvider>
			</AuthBridge>
		),
	});

	return { router, queryClient, convexQueryClient, env };
}
