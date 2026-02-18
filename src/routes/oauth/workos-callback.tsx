import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/oauth/workos-callback")({
	component: WorkosCallbackPage,
	beforeLoad: async ({ context }) => {
		if (context.auth.user) {
			throw redirect({ to: "/calendar" });
		}

		throw redirect({ to: "/login" });
	},
});

function WorkosCallbackPage() {
	return null;
}
