import { useDeepLinkListener } from "@/lib/use-deep-link-listener";
import { ConvexProviderWithAuthKit } from "@convex-dev/workos";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { AuthKitProvider, useAuth } from "@workos-inc/authkit-react";
import { useMemo } from "react";
import { FullPageLoader } from "./components/full-page-loader";
import { selectPlatform } from "./lib/tauri";
import { getRouter } from "./router";

function InnerApp({
	router,
	queryClient,
}: {
	router: ReturnType<typeof getRouter>["router"];
	queryClient: QueryClient;
}) {
	const auth = useAuth();
	useDeepLinkListener(router);

	if (auth.isLoading) {
		return <FullPageLoader />;
	}

	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} context={{ auth }} />
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
				tauri: env.VITE_WORKOS_REDIRECT_URI,
				web: env.VITE_WORKOS_REDIRECT_URI,
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
