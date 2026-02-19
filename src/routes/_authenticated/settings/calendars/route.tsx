import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/settings/calendars")({
	component: CalendarsLayout,
});

function CalendarsLayout() {
	return <Outlet />;
}
