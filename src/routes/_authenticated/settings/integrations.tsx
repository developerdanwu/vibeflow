import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/settings/integrations")({
	component: IntegrationsLayout,
});

function IntegrationsLayout() {
	return <Outlet />;
}
