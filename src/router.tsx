import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import {
	AuthKitProvider,
	useAccessToken,
	useAuth,
} from "@workos/authkit-tanstack-react-start/client";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useCallback, useMemo } from "react";
import * as TanstackQuery from "./integrations/tanstack-query/root-provider";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

const CONVEX_URL = (import.meta as ImportMeta & { env: Record<string, string> })
	.env.VITE_CONVEX_URL;
if (!CONVEX_URL) {
	console.error("missing envar VITE_CONVEX_URL");
}

const convex = new ConvexReactClient(CONVEX_URL);

function ConvexAuthBridge({ children }: { children: React.ReactNode }) {
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

	const authValue = useMemo(
		() => ({
			isLoading: loading,
			isAuthenticated: !!user,
			fetchAccessToken,
		}),
		[loading, user, fetchAccessToken],
	);

	return (
		<ConvexProviderWithAuth client={convex} useAuth={() => authValue}>
			{children}
		</ConvexProviderWithAuth>
	);
}

// Create a new router instance
export const getRouter = () => {
	const rqContext = TanstackQuery.getContext();

	const router = createRouter({
		routeTree,
		context: {
			...rqContext,
		},

		defaultPreload: "intent",

		Wrap: ({ children }) => (
			<AuthKitProvider>
				<ConvexAuthBridge>{children}</ConvexAuthBridge>
			</AuthKitProvider>
		),
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient: rqContext.queryClient,
	});

	return router;
};
