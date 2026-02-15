import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";

/** HTTP webhook: Google POSTs here on calendar changes; return 200 and schedule sync. */
export const googleCalendarWebhook = httpAction(async (ctx, request) => {
	const channelId = request.headers.get("X-Goog-Channel-ID");
	if (!channelId) {
		return new Response("Missing X-Goog-Channel-ID", { status: 400 });
	}
	const data = await ctx.runQuery(internal.googleCalendar.queries.getByChannelId, {
		channelId,
	});
	if (data) {
		await ctx.scheduler.runAfter(0, internal.googleCalendar.actionsNode.syncCalendar, {
			connectionId: data.connectionId,
			externalCalendarId: data.externalCalendarId,
		});
	}
	return new Response(null, { status: 200 });
});
