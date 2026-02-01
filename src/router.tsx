import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import {
	AuthKitProvider,
	useAccessToken,
	useAuth,
} from "@workos/authkit-tanstack-react-start/client";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useCallback, useMemo } from "react";
import { GlobalAlertDialog } from "./components/dialogs/global-alert-dialog";
import { Toaster } from "./components/ui/sonner";
import { DialogStoreProvider } from "./lib/dialog-store";
import { routeTree } from "./routeTree.gen";

function useAuthFromWorkOS() {
	const { loading, user } = useAuth();
	const { accessToken, getAccessToken } = useAccessToken();

	const fetchAccessToken = useCallback(
		async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
			if (!accessToken || forceRefreshToken) {
				return (await getAccessToken()) ?? null;
			}
			return accessToken;
		},
		[accessToken, getAccessToken],
	);

	return useMemo(
		() => ({
			isLoading: loading,
			isAuthenticated: !!user,
			fetchAccessToken,
		}),
		[loading, user, fetchAccessToken],
	);
}

// Create a new router instance
export const getRouter = () => {
	const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
	if (!CONVEX_URL) {
		throw new Error("missing VITE_CONVEX_URL env var");
	}
	const convex = new ConvexReactClient(CONVEX_URL);
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
		defaultPreloadStaleTime: 0, // Let React Query handle all caching
		defaultErrorComponent: (err) => <p>{err.error.stack}</p>,
		defaultNotFoundComponent: () => <p>not found</p>,
		context: {
			queryClient,
		},
		Wrap: ({ children }) => (
			<AuthKitProvider>
				<ConvexProviderWithAuth
					client={convexQueryClient.convexClient}
					useAuth={useAuthFromWorkOS}
				>
					<DialogStoreProvider>
						{children}
						<GlobalAlertDialog />
						<Toaster />
					</DialogStoreProvider>
				</ConvexProviderWithAuth>
			</AuthKitProvider>
		),
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient: queryClient,
	});

	return router;
};
