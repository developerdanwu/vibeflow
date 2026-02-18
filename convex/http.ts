import { httpRouter } from "convex/server";
import { authKit } from "./auth";
import { googleCalendarWebhook } from "./googleCalendar/http";

const http = httpRouter();
authKit.registerRoutes(http);
http.route({
	path: "/google-calendar-webhook",
	method: "POST",
	handler: googleCalendarWebhook,
});
export default http;
