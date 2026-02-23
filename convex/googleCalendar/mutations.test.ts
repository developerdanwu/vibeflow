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
			connectionId,
			removeSyncedEvents: false,
		});

		const connectionsAfter = await t.run(async (ctx: MutationCtx) =>
			ctx.db
				.query("calendarConnections")
				.withIndex("by_user_and_provider", (q) =>
					q.eq("userId", userId).eq("provider", "google"),
				)
				.collect(),
		);
		expect(connectionsAfter).toHaveLength(0);

		const externalsAfter = await t.run(async (ctx: MutationCtx) =>
			ctx.db
				.query("externalCalendars")
				.withIndex("by_connection", (q) => q.eq("connectionId", connectionId))
				.collect(),
		);
		expect(externalsAfter).toHaveLength(0);
	});

	test("no-op when connection not found", async ({ t, auth, expect }) => {
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
			await ctx.db.delete("calendarConnections", connectionId);
		});
		await expect(
			asUser.mutation(api.googleCalendar.mutations.removeMyGoogleConnection, {
				connectionId,
				removeSyncedEvents: false,
			}),
		).resolves.not.toThrow();
	});

	test("requires auth", async ({ t, auth, expect }) => {
		const { userId } = auth;
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
		await expect(
			t.mutation(api.googleCalendar.mutations.removeMyGoogleConnection, {
				connectionId,
			}),
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
			connectionId,
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
			connectionId,
			removeSyncedEvents: false,
		});

		const eventAfter = await t.run(async (ctx: MutationCtx) =>
			ctx.db.get("events", eventId),
		);
		expect(eventAfter).not.toBeNull();
		expect(eventAfter?.title).toBe("Synced event");
	});

	test("disconnecting one connection leaves other connections", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser, userId } = auth;
		const now = Date.now();

		const connectionId1 = await t.run(async (ctx: MutationCtx) => {
			return await ctx.db.insert("calendarConnections", {
				userId,
				provider: "google",
				refreshToken: "test-refresh-1",
				createdAt: now,
				updatedAt: now,
			});
		});
		const connectionId2 = await t.run(async (ctx: MutationCtx) => {
			return await ctx.db.insert("calendarConnections", {
				userId,
				provider: "google",
				refreshToken: "test-refresh-2",
				createdAt: now,
				updatedAt: now,
			});
		});

		await t.run(async (ctx: MutationCtx) => {
			await ctx.db.insert("externalCalendars", {
				connectionId: connectionId1,
				provider: "google",
				externalCalendarId: "primary1",
				name: "Primary 1",
				color: "#3B82F6",
			});
			await ctx.db.insert("externalCalendars", {
				connectionId: connectionId2,
				provider: "google",
				externalCalendarId: "primary2",
				name: "Primary 2",
				color: "#22C55E",
			});
		});

		await asUser.mutation(api.googleCalendar.mutations.removeMyGoogleConnection, {
			connectionId: connectionId1,
			removeSyncedEvents: false,
			removeLinkedCalendars: false,
		});

		const connection1After = await t.run(async (ctx: MutationCtx) =>
			ctx.db.get("calendarConnections", connectionId1),
		);
		const connection2After = await t.run(async (ctx: MutationCtx) =>
			ctx.db.get("calendarConnections", connectionId2),
		);
		expect(connection1After).toBeNull();
		expect(connection2After).not.toBeNull();
		expect(connection2After?.refreshToken).toBe("test-refresh-2");

		const externals2 = await t.run(async (ctx: MutationCtx) =>
			ctx.db
				.query("externalCalendars")
				.withIndex("by_connection", (q) => q.eq("connectionId", connectionId2))
				.collect(),
		);
		expect(externals2).toHaveLength(1);
		expect(externals2[0].externalCalendarId).toBe("primary2");
	});
});
