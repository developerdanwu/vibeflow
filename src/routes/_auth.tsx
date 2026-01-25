import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { AuthenticatedLayout } from "@/components/layouts/AuthenticatedLayout";

export const Route = createFileRoute("/_auth")({
	component: RouteComponent,
});

function LoadingState({ message }: { message: string }) {
	return (
		<div className="min-h-screen bg-background flex items-center justify-center">
			<div className="flex flex-col items-center gap-4">
				<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				<p className="text-muted-foreground">{message}</p>
			</div>
		</div>
	);
}

function RouteComponent() {
	return (
		<>
			<AuthLoading>
				<LoadingState message="Loading..." />
			</AuthLoading>
			<Unauthenticated>
				<SignInPrompt />
			</Unauthenticated>
			<Authenticated>
				<AuthenticatedLayout>
					<CalendarContent />
				</AuthenticatedLayout>
			</Authenticated>
		</>
	);
}
