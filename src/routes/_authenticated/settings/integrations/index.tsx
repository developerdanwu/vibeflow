import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings/integrations/")({
	component: IntegrationsSettings,
});

function IntegrationsSettings() {
	const { data: linearConnection } = useQuery(
		convexQuery(api.taskProviders.linear.queries.getMyLinearConnection),
	);
	const { data: currentUserId } = useQuery(
		convexQuery(api.users.queries.getCurrentUserId),
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

	const clientId = import.meta.env.VITE_LINEAR_CLIENT_ID as string | undefined;
	const redirectUri =
		typeof window !== "undefined"
			? `${window.location.origin}/settings/integrations/linear-callback`
			: "";
	const encodedState =
		currentUserId && typeof btoa !== "undefined"
			? btoa(JSON.stringify({ userId: currentUserId }))
			: "";
	const linearAuthUrl =
		clientId && redirectUri && encodedState
			? `https://linear.app/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=read&state=${encodeURIComponent(encodedState)}`
			: null;

	const handleConnectLinear = () => {
		if (linearAuthUrl) {
			window.location.href = linearAuthUrl;
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-semibold text-2xl tracking-tight">
					Integrations
				</h1>
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
					{linearConnection ? (
						<div className="flex flex-col gap-3">
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground text-sm">
									Connected
									{linearConnection.providerMetadata &&
										typeof linearConnection.providerMetadata === "object" &&
										"organizationName" in linearConnection.providerMetadata &&
										linearConnection.providerMetadata.organizationName &&
										` to ${String(linearConnection.providerMetadata.organizationName)}`}
								</span>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => disconnectLinear()}
								disabled={isDisconnecting}
							>
								Disconnect
							</Button>
						</div>
					) : (
						<div className="space-y-2">
							<Button
								onClick={handleConnectLinear}
								disabled={!linearAuthUrl}
								title={
									!clientId
										? "Configure VITE_LINEAR_CLIENT_ID to connect"
										: undefined
								}
							>
								Connect Linear
							</Button>
							{!clientId && (
								<p className="text-muted-foreground text-sm">
									Configure VITE_LINEAR_CLIENT_ID in .env.local to connect.
								</p>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
