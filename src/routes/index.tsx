import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HomePage,
	beforeLoad: async ({ context }) => {
		if (context.auth.user) {
			throw redirect({ to: "/calendar" });
		}
		throw redirect({ to: "/login", search: { redirect: location.pathname } });
	},
});

function HomePage() {
	return null;
}
