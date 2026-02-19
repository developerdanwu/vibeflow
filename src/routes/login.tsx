import { selectPlatform } from "@/lib/tauri";
import {
	createFileRoute,
	redirect,
	useRouteContext,
} from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
	component: LoginPage,
	beforeLoad: async ({ context }) => {
		if (context.auth.user) {
			throw redirect({ to: "/calendar" });
		}
	},
});

function LoginPage() {
	const { auth } = useRouteContext({ from: "/login" });

	const handleSignIn = async () => {
		await selectPlatform({
			web: async () => {
				return await auth.signIn({
					state: { returnTo: "/calendar" },
				});
			},
			tauri: async () => {
				return await auth.signIn({
					state: { returnTo: "/calendar" },
				});
			},
		})();
	};

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="flex flex-col items-center gap-6 rounded-lg border bg-card p-8">
				<h1 className="font-semibold text-2xl">Sign in to VibeFlow</h1>
				<button
					type="button"
					onClick={handleSignIn}
					className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
				>
					Sign In
				</button>
			</div>
		</div>
	);
}
