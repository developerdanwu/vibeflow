import { useDeepLinkListener } from "@/lib/use-deep-link-listener";
import { ConvexProviderWithAuthKit } from "@convex-dev/workos";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { AuthKitProvider, useAuth } from "@workos-inc/authkit-react";
import { useEffect, useMemo } from "react";
import { selectPlatform } from "./lib/tauri";
import { type AuthContext, getRouter } from "./router";

const useAuthPromise = () => {
	const auth = useAuth();
	const authReady = useMemo(() => {
		let resolve: (auth: AuthContext) => void;
		const promise = new Promise<AuthContext>((r) => {
			resolve = r;
		});
		return { promise, resolve: resolve! };
	}, []);

	useEffect(() => {
		if (!auth.isLoading) {
			authReady.resolve(auth);
		}
	}, [auth, authReady]);

	return authReady.promise;
};

function InnerApp({
	router,
	queryClient,
}: {
	router: ReturnType<typeof getRouter>["router"];
	queryClient: QueryClient;
}) {
	const authPromise = useAuthPromise();
	useDeepLinkListener(router);

	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} context={{ authPromise }} />
		</QueryClientProvider>
	);
}

export function App() {
	const { router, queryClient, convexQueryClient, env } = useMemo(
		() => getRouter(),
		[],
	);

	return (
		<AuthKitProvider
			clientId={env.VITE_WORKOS_CLIENT_ID}
			redirectUri={selectPlatform({
				tauri: env.VITE_TAURI_WORKOS_REDIRECT_URI,
				web: env.VITE_WEB_WORKOS_REDIRECT_URI,
			})}
			devMode
		>
			<ConvexProviderWithAuthKit
				client={convexQueryClient.convexClient}
				useAuth={useAuth}
			>
				<InnerApp router={router} queryClient={queryClient} />
			</ConvexProviderWithAuthKit>
		</AuthKitProvider>
	);
}
