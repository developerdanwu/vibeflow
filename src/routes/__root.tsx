import { GlobalDialog } from "@/components/dialogs/global-dialog";
import { Toaster } from "@/components/ui/sonner";
import { DialogStoreProvider } from "@/lib/dialog-store";
import type { TEnv } from "@/lib/env";
import type { AuthContext } from "@/router";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { ConvexReactClient } from "convex/react";

interface MyRouterContext {
	queryClient: QueryClient;
	convex: ConvexReactClient;
	env: TEnv;
	authPromise: Promise<AuthContext>;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootComponent,
	beforeLoad: async ({ context }) => {
		const auth = await context.authPromise;
		return {
			auth,
		};
	},
});

function RootComponent() {
	return (
		<DialogStoreProvider>
			<Outlet />
			<TanStackDevtools
				config={{
					position: "bottom-right",
				}}
				plugins={[
					{
						name: "Tanstack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
					{
						name: "Tanstack Query",
						render: <ReactQueryDevtoolsPanel />,
					},
				]}
			/>
			<GlobalDialog />
			<Toaster />
		</DialogStoreProvider>
	);
}
