import { AuthenticatedLayout } from "@/components/layouts/AuthenticatedLayout";
import { api } from "@convex/_generated/api";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getAuth, getSignInUrl } from "@workos/authkit-tanstack-react-start";
import { ConvexHttpClient } from "convex/browser";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
	throw new Error("VITE_CONVEX_URL is not defined");
}
const convex = new ConvexHttpClient(convexUrl);

export const Route = createFileRoute("/_authenticated")({
	loader: async ({ location }) => {
		const { user } = await getAuth();
		if (!user) {
			const path = location.pathname;
			const href = await getSignInUrl({ data: { returnPathname: path } });
			throw redirect({ href });
		}

		// Ensure user exists in database before proceeding
		await convex.mutation(api.users.ensureUserExists, {
			authId: user.id,
			email: user.email,
			firstName: user.firstName ?? undefined,
			lastName: user.lastName ?? undefined,
			profileImageUrl: user.profilePictureUrl ?? undefined,
		});

		return { user };
	},
	component: () => (
		<AuthenticatedLayout>
			<Outlet />
		</AuthenticatedLayout>
	),
});
