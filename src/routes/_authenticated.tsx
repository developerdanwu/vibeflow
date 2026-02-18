import { AuthenticatedLayout } from "@/components/layouts/AuthenticatedLayout";
import { api } from "@convex/_generated/api";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ context, location }) => {
		if (!context.auth.user) {
			throw redirect({
				to: "/login",
				search: { redirect: location.pathname },
			});
		}

		const u = context.auth.user;
		const user = await context.convex.mutation(
			api.users.mutations.ensureUserExists,
			{
				authId: u.id,
				email: u.email,
				firstName: u.firstName ?? undefined,
				lastName: u.lastName ?? undefined,
				profileImageUrl: u.profilePictureUrl ?? undefined,
			},
		);
		return {
			user: user,
		};
	},
	component: AuthenticatedLayoutWithGate,
});

function AuthenticatedLayoutWithGate() {
	return (
		<AuthenticatedLayout>
			<Outlet />
		</AuthenticatedLayout>
	);
}
