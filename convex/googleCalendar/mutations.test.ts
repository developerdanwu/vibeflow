import { api } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";
import { describe, test } from "../testFixture.nobundle";

describe("removeMyGoogleConnection", () => {
	test("removes connection and external calendars when connected", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser, userId } = auth;
		const now = Date.now();

		const connectionId = await t.run(async (ctx: MutationCtx) => {
			return await ctx.db.insert("calendarConnections", {
				userId,
				provider: "google",
				refreshToken: "test-refresh",
				createdAt: now,
				updatedAt: now,
			});
		});

		await t.run(async (ctx: MutationCtx) => {
			await ctx.db.insert("externalCalendars", {
				connectionId,
				provider: "google",
				externalCalendarId: "primary",
				name: "Primary",
				color: "#3B82F6",
			});
		});

		await asUser.mutation(api.googleCalendar.mutations.removeMyGoogleConnection, {
			removeSyncedEvents: false,
		});

		const connectionAfter = await t.run(async (ctx: MutationCtx) =>
			ctx.db
				.query("calendarConnections")
				.withIndex("by_user_and_provider", (q) =>
					q.eq("userId", userId).eq("provider", "google"),
				)
				.unique(),
		);
		expect(connectionAfter).toBeNull();

		const externalsAfter = await t.run(async (ctx: MutationCtx) =>
			ctx.db
				.query("externalCalendars")
				.withIndex("by_connection", (q) => q.eq("connectionId", connectionId))
				.collect(),
		);
		expect(externalsAfter).toHaveLength(0);
	});

	test("idempotent when no connection", async ({ auth, expect }) => {
		const { asUser } = auth;
		await expect(
			asUser.mutation(api.googleCalendar.mutations.removeMyGoogleConnection, {}),
		).resolves.not.toThrow();
	});

	test("requires auth", async ({ t, expect }) => {
		await expect(
			t.mutation(api.googleCalendar.mutations.removeMyGoogleConnection, {}),
		).rejects.toThrowError("Not authenticated");
	});

	test("when removeSyncedEvents true, deletes synced events", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser, userId } = auth;
		const now = Date.now();

		const connectionId = await t.run(async (ctx: MutationCtx) => {
			return await ctx.db.insert("calendarConnections", {
				userId,
				provider: "google",
				refreshToken: "test-refresh",
				createdAt: now,
				updatedAt: now,
			});
		});

		const externalCalendarId = "primary";
		await t.run(async (ctx: MutationCtx) => {
			await ctx.db.insert("externalCalendars", {
				connectionId,
				provider: "google",
				externalCalendarId,
				name: "Primary",
				color: "#3B82F6",
			});
		});

		const eventId = await t.run(async (ctx: MutationCtx) => {
			return await ctx.db.insert("events", {
				title: "Synced event",
				startTimestamp: now,
				endTimestamp: now + 3600000,
				userId,
				allDay: false,
				busy: "free",
				visibility: "public",
				externalProvider: "google",
				externalCalendarId,
				externalEventId: "google-event-1",
			});
		});

		await asUser.mutation(api.googleCalendar.mutations.removeMyGoogleConnection, {
			removeSyncedEvents: true,
		});

		const eventAfter = await t.run(async (ctx: MutationCtx) =>
			ctx.db.get("events", eventId),
		);
		expect(eventAfter).toBeNull();
	});

	test("when removeSyncedEvents false, keeps synced events", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser, userId } = auth;
		const now = Date.now();

		const connectionId = await t.run(async (ctx: MutationCtx) => {
			return await ctx.db.insert("calendarConnections", {
				userId,
				provider: "google",
				refreshToken: "test-refresh",
				createdAt: now,
				updatedAt: now,
			});
		});

		const externalCalendarId = "primary";
		await t.run(async (ctx: MutationCtx) => {
			await ctx.db.insert("externalCalendars", {
				connectionId,
				provider: "google",
				externalCalendarId,
				name: "Primary",
				color: "#3B82F6",
			});
		});

		const eventId = await t.run(async (ctx: MutationCtx) => {
			return await ctx.db.insert("events", {
				title: "Synced event",
				startTimestamp: now,
				endTimestamp: now + 3600000,
				userId,
				allDay: false,
				busy: "free",
				visibility: "public",
				externalProvider: "google",
				externalCalendarId,
				externalEventId: "google-event-1",
			});
		});

		await asUser.mutation(api.googleCalendar.mutations.removeMyGoogleConnection, {
			removeSyncedEvents: false,
		});

		const eventAfter = await t.run(async (ctx: MutationCtx) =>
			ctx.db.get("events", eventId),
		);
		expect(eventAfter).not.toBeNull();
		expect(eventAfter?.title).toBe("Synced event");
	});
});
