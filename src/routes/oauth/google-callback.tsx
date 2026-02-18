import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { api } from "@convex/_generated/api";
import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

const callbackSearchSchema = z.object({
	code: z.string().optional(),
	state: z.string().optional(),
});
type Result<TData> =
	| { success: true; data: TData }
	| { success: false; error: string };

export const Route = createFileRoute("/oauth/google-callback")({
	validateSearch: callbackSearchSchema,
	component: GoogleCallback,
	beforeLoad: async ({
		context,
		search,
	}): Promise<{
		codeExchange: Result<{ returnTo: string }>;
	}> => {
		if (!search.code || !search.state) {
			return {
				codeExchange: {
					success: false,
					error: "Missing code or state",
				},
			};
		}

		try {
			const codeExchangeResult = await context.convex.action(
				api.googleCalendar.actionsNode.exchangeCode,
				{
					code: search.code,
					state: search.state,
				},
			);

			if (codeExchangeResult.returnTo.startsWith("http")) {
				throw redirect({
					to: codeExchangeResult.returnTo,
				});
			}

			return {
				codeExchange: {
					success: true,
					data: {
						returnTo: codeExchangeResult.returnTo,
					},
				},
			};
		} catch (error) {
			if (isRedirect(error)) {
				throw error;
			}

			return {
				codeExchange: {
					success: false,
					error: "Failed to connect Google Calendar",
				} satisfies Result<never>,
			};
		}
	},
});

function SuccessView({ returnTo }: { returnTo: string }) {
	const [showManualLink, setShowManualLink] = useState(false);

	useEffect(() => {
		window.location.href = returnTo;
		const timer = setTimeout(() => setShowManualLink(true), 1500);
		return () => clearTimeout(timer);
	}, [returnTo]);

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="items-center text-center">
				<div className="mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
					<CheckCircle2 className="size-6 text-emerald-500" />
				</div>
				<CardTitle className="text-xl">Google Calendar Connected</CardTitle>
				<CardDescription>
					Your Google Calendar has been linked successfully. Redirecting you back
					to VibeFlow…
				</CardDescription>
			</CardHeader>
			{showManualLink && (
				<CardContent className="flex flex-col items-center gap-3">
					<p className="text-center text-muted-foreground text-xs">
						Didn't redirect automatically?
					</p>
					<Button
						variant="outline"
						onClick={() => {
							window.location.href = returnTo;
						}}
					>
						<ExternalLink />
						Open VibeFlow
					</Button>
				</CardContent>
			)}
		</Card>
	);
}

function ErrorView({ error }: { error: string }) {
	return (
		<Card className="w-full max-w-md">
			<CardHeader className="items-center text-center">
				<div className="mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10">
					<AlertCircle className="size-6 text-destructive" />
				</div>
				<CardTitle className="text-xl">Connection Failed</CardTitle>
				<CardDescription>
					{error === "Missing code or state"
						? "The authorization request was incomplete. Please try connecting Google Calendar again from Settings."
						: "Something went wrong while connecting your Google Calendar. Please go back to Settings and try again."}
				</CardDescription>
			</CardHeader>
		</Card>
	);
}

function GoogleCallback() {
	const { codeExchange } = Route.useRouteContext();

	return (
		<div className="flex min-h-svh items-center justify-center p-4">
			{codeExchange.success ? (
				<SuccessView returnTo={codeExchange.data.returnTo} />
			) : (
				<ErrorView error={codeExchange.error} />
			)}
		</div>
	);
}
