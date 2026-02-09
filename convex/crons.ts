import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Renew Google Calendar push channels before they expire (~7 day TTL)
crons.interval(
	"renew google calendar channels",
	{ hours: 12 },
	internal.googleCalendar.renewExpiringChannels
);

// Fallback sync for dropped push notifications
crons.interval(
	"fallback sync google calendars",
	{ minutes: 30 },
	internal.googleCalendar.runFallbackSync
);

export default crons;
