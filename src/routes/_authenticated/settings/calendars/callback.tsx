import { api } from "@convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { z } from "zod";

const callbackSearchSchema = z.object({
	code: z.string().optional(),
	state: z.string().optional(),
});

export const Route = createFileRoute(
	"/_authenticated/settings/calendars/callback",
)({
	validateSearch: callbackSearchSchema,
	component: GoogleCalendarCallback,
});

function GoogleCalendarCallback() {
	const { code, state } = Route.useSearch();
	const navigate = useNavigate();
	const exchangeCode = useAction(api.googleCalendar.actionsNode.exchangeCode);
	const didRun = useRef(false);

	useEffect(() => {
		if (didRun.current) return;
		didRun.current = true;

		const redirectToCalendars = () => {
			navigate({ to: "/settings/calendars" });
		};

		if (!code || !state) {
			toast.error("Missing code or state");
			redirectToCalendars();
			return;
		}

		const redirectUri =
			typeof window !== "undefined"
				? `${window.location.origin}/settings/calendars/callback`
				: "";

		exchangeCode({ code, state, redirectUri })
			.then(() => {
				toast.success("Google Calendar connected");
				redirectToCalendars();
			})
			.catch((err: unknown) => {
				toast.error(getConvexErrorMessage(err, "Failed to connect Google Calendar"));
				redirectToCalendars();
			});
	}, [code, state, exchangeCode, navigate]);

	return (
		<div className="flex min-h-[200px] items-center justify-center">
			<p className="text-muted-foreground text-sm">
				Connecting Google Calendar…
			</p>
		</div>
	);
}
