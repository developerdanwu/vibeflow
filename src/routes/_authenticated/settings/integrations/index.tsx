import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { selectPlatform } from "@/lib/tauri";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings/integrations/")({
	component: IntegrationsSettings,
});

function IntegrationsSettings() {
	const { env, user } = useRouteContext({
		from: "/_authenticated",
	});

	const clientId = env.VITE_LINEAR_CLIENT_ID;
	// Linear only accepts http(s) callback URLs; public route so system-browser flow works
	const redirectUri = `${env.VITE_WEB_ORIGIN}/oauth/linear-callback`;
	const encodedState = btoa(
		JSON.stringify({
			redirectUri,
			userId: user._id,
			returnTo: selectPlatform({
				web: `${env.VITE_WEB_ORIGIN}/settings/integrations`,
				tauri: `${env.VITE_TAURI_ORIGIN}/settings/integrations`,
			}),
		}),
	);
	const linearAuthUrl = `https://linear.app/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=read&state=${encodeURIComponent(encodedState)}`;
	const { data: linearConnections } = useQuery(
		convexQuery(api.taskProviders.linear.queries.getMyLinearConnections),
	);
	const removeConnection = useConvexMutation(
		api.taskProviders.linear.mutations.removeMyLinearConnection,
	);
	const { mutate: disconnectLinear, isPending: isDisconnecting } = useMutation({
		mutationFn: removeConnection,
		onSuccess: () => {
			toast.success("Linear disconnected");
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-semibold text-2xl tracking-tight">Integrations</h1>
				<p className="text-muted-foreground text-sm">
					Connect task and calendar providers to schedule work from your
					calendar.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Linear</CardTitle>
					<CardDescription>
						Connect Linear to see your assigned issues in the calendar sidebar
						and schedule them as events.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{(linearConnections?.length ?? 0) > 0 ? (
						<div className="flex flex-col gap-3">
							{linearConnections?.map((conn) => {
								const label =
									conn.providerMetadata &&
									typeof conn.providerMetadata === "object" &&
									"organizationName" in conn.providerMetadata &&
									conn.providerMetadata.organizationName
										? String(conn.providerMetadata.organizationName)
										: "Linear workspace";
								return (
									<div
										key={conn.connectionId}
										className="flex items-center justify-between gap-2 rounded-md border p-3"
									>
										<span className="text-muted-foreground text-sm">
											Connected to {label}
										</span>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												disconnectLinear({ connectionId: conn.connectionId })
											}
											disabled={isDisconnecting}
										>
											Disconnect
										</Button>
									</div>
								);
							})}
							<Button
								onClick={selectPlatform({
									tauri: async () => {
										const { openUrl } = await import(
											"@tauri-apps/plugin-opener"
										);
										await openUrl(linearAuthUrl);
									},
									web: () => {
										window.location.href = linearAuthUrl;
									},
								})}
								disabled={!linearAuthUrl}
							>
								Connect another workspace
							</Button>
						</div>
					) : (
						<div className="space-y-2">
							<Button
								onClick={selectPlatform({
									tauri: async () => {
										const { openUrl } = await import(
											"@tauri-apps/plugin-opener"
										);
										await openUrl(linearAuthUrl);
									},
									web: () => {
										window.location.href = linearAuthUrl;
									},
								})}
								disabled={!linearAuthUrl}
							>
								Connect Linear
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
