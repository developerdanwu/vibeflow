import { authQuery } from "../helpers";

export const getUserCalendars = authQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("calendars")
			.withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
			.collect();
	},
});

export const getDefaultCalendar = authQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("calendars")
			.withIndex("by_user_default", (q) =>
				q.eq("userId", ctx.user._id).eq("isDefault", true)
			)
			.first();
	},
});

export const getAllUserCalendars = authQuery({
	args: {},
	handler: async (ctx) => {
		const calendars = await ctx.db
			.query("calendars")
			.withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
			.collect();

		const allExternalCalendars = await ctx.db
			.query("externalCalendars")
			.collect();

		const googleCalendarMap = new Map<
			string,
			{ externalCalendarId: string; provider: "google" | "microsoft" }
		>();
		for (const ext of allExternalCalendars) {
			if (ext.calendarId) {
				googleCalendarMap.set(ext.calendarId, {
					externalCalendarId: ext.externalCalendarId,
					provider: ext.provider,
				});
			}
		}

		const calendarsWithGoogleFlag = calendars.map((cal) => {
			const googleInfo = googleCalendarMap.get(cal._id);
			return {
				id: cal._id,
				name: cal.name,
				color: cal.color,
				isGoogle: googleInfo?.provider === "google" || false,
				isDefault: cal.isDefault,
				externalCalendarId: googleInfo?.externalCalendarId,
			};
		});

		return calendarsWithGoogleFlag.sort((a, b) => {
			if (a.isDefault && !b.isDefault) return -1;
			if (!a.isDefault && b.isDefault) return 1;
			if (a.isGoogle && !b.isGoogle) return -1;
			if (!a.isGoogle && b.isGoogle) return 1;
			return a.name.localeCompare(b.name);
		});
	},
});
