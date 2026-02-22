import { api } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";
import { describe, test } from "../testFixture.nobundle";
import { addUserToTest, factories } from "../test.setup";

describe("createEvent", () => {
	test("creates a timed event", async ({ t, auth, expect }) => {
		const { asUser, userId } = auth;
		const eventData = factories.event();

		const created = await asUser.mutation(
			api.events.mutations.createEvent,
			eventData,
		);
		const eventId = created._id;

		const event = await t.run(async (ctx: MutationCtx) => ctx.db.get("events", eventId));
		expect(event).toMatchObject({
			title: "Test Event",
			userId,
			busy: "free",
			visibility: "public",
		});
	});

	test("rejects end date before start date", async ({ auth, expect }) => {
		const { asUser } = auth;
		const now = Date.now();

		await expect(
			asUser.mutation(api.events.mutations.createEvent, {
				...factories.event({
					startTimestamp: now,
					endTimestamp: now - 1000,
				}),
			}),
		).rejects.toThrowError("End date must be after start date");
	});

	test("requires auth", async ({ t, expect }) => {
		await expect(
			t.mutation(api.events.mutations.createEvent, factories.event()),
		).rejects.toThrowError("Not authenticated");
	});

	test("rejects invalid args (Zod validation)", async ({ auth, expect }) => {
		const { asUser } = auth;
		await expect(
			asUser.mutation(api.events.mutations.createEvent, {
				...factories.event(),
				allDay: "not-a-boolean" as unknown as boolean,
			}),
		).rejects.toThrow();
	});

	test("creates event with recurrence and persists recurrence on doc", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser, userId } = auth;
		const recurrence = ["RRULE:FREQ=WEEKLY;COUNT=3"];
		const created = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event({ recurrence }),
		);
		const eventId = created._id;
		const event = await t.run(async (ctx: MutationCtx) =>
			ctx.db.get("events", eventId),
		);
		expect(event).toMatchObject({
			title: "Test Event",
			userId,
			recurrence,
		});
	});

	test("creates all-day event from date strings", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser, userId } = auth;
		const created = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event({
				allDay: true,
				startDateStr: "2025-06-01",
				endDateStr: "2025-06-02",
				startTimestamp: undefined,
				endTimestamp: undefined,
			}),
		);
		const eventId = created._id;
		const event = await t.run(async (ctx: MutationCtx) => ctx.db.get("events", eventId));
		expect(event).toMatchObject({
			title: "Test Event",
			userId,
			allDay: true,
			startTimestamp: new Date("2025-06-01T00:00:00Z").getTime(),
			endTimestamp: new Date("2025-06-02T00:00:00Z").getTime(),
		});
	});

	test("rejects timed event without timestamps or date strings", async ({
		auth,
		expect,
	}) => {
		const { asUser } = auth;
		await expect(
			asUser.mutation(api.events.mutations.createEvent, {
				...factories.event(),
				startTimestamp: undefined,
				endTimestamp: undefined,
				allDay: false,
			}),
		).rejects.toThrowError(
			"Must provide startTimestamp/endTimestamp for timed events",
		);
	});

	test("creates task block with scheduled link when eventKind task and scheduledTaskLinks", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser, userId } = auth;
		const created = await asUser.mutation(api.events.mutations.createEvent, {
			...factories.event(),
			eventKind: "task",
			scheduledTaskLinks: [
				{
					externalTaskId: "linear-123",
					url: "https://linear.app/org/issue/123",
				},
			],
		});
		const eventId = created._id;
		const event = await t.run(async (ctx: MutationCtx) => ctx.db.get("events", eventId));
		expect(event).toMatchObject({
			title: "Test Event",
			userId,
			eventKind: "task",
		});
		const links = await t.run(async (ctx: MutationCtx) =>
			ctx.db
				.query("eventTaskLinks")
				.withIndex("by_event", (q) => q.eq("eventId", eventId))
				.collect(),
		);
		expect(links).toHaveLength(1);
		expect(links[0]).toMatchObject({
			externalTaskId: "linear-123",
			url: "https://linear.app/org/issue/123",
			linkType: "scheduled",
		});
	});

	test("creates task block with multiple scheduledTaskLinks", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser, userId } = auth;
		const created = await asUser.mutation(api.events.mutations.createEvent, {
			...factories.event(),
			eventKind: "task",
			scheduledTaskLinks: [
				{
					externalTaskId: "linear-a",
					url: "https://linear.app/org/issue/a",
				},
				{
					externalTaskId: "linear-b",
					url: "https://linear.app/org/issue/b",
				},
			],
		});
		const eventId = created._id;
		const event = await t.run(async (ctx: MutationCtx) => ctx.db.get("events", eventId));
		expect(event).toMatchObject({
			userId,
			eventKind: "task",
		});
		const links = await t.run(async (ctx: MutationCtx) =>
			ctx.db
				.query("eventTaskLinks")
				.withIndex("by_event", (q) => q.eq("eventId", eventId))
				.collect(),
		);
		expect(links).toHaveLength(2);
		expect(links).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					externalTaskId: "linear-a",
					url: "https://linear.app/org/issue/a",
					linkType: "scheduled",
				}),
				expect.objectContaining({
					externalTaskId: "linear-b",
					url: "https://linear.app/org/issue/b",
					linkType: "scheduled",
				}),
			]),
		);
	});

	test("creates task event with both scheduledTaskLinks and relatedTaskLinks", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser, userId } = auth;
		const created = await asUser.mutation(api.events.mutations.createEvent, {
			...factories.event(),
			eventKind: "task",
			scheduledTaskLinks: [
				{
					externalTaskId: "linear-scheduled",
					url: "https://linear.app/org/issue/scheduled",
				},
			],
			relatedTaskLinks: [
				{
					externalTaskId: "linear-related",
					url: "https://linear.app/org/issue/related",
				},
			],
		});
		const eventId = created._id;
		const event = await t.run(async (ctx: MutationCtx) =>
			ctx.db.get("events", eventId),
		);
		expect(event).toMatchObject({
			userId,
			eventKind: "task",
		});
		const links = await t.run(async (ctx: MutationCtx) =>
			ctx.db
				.query("eventTaskLinks")
				.withIndex("by_event", (q) => q.eq("eventId", eventId))
				.collect(),
		);
		expect(links).toHaveLength(2);
		expect(links).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					externalTaskId: "linear-scheduled",
					url: "https://linear.app/org/issue/scheduled",
					linkType: "scheduled",
				}),
				expect.objectContaining({
					externalTaskId: "linear-related",
					url: "https://linear.app/org/issue/related",
					linkType: "related",
				}),
			]),
		);
	});

	test("creates task event with same externalTaskId in scheduled and related dedupes to scheduled only", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser } = auth;
		const created = await asUser.mutation(api.events.mutations.createEvent, {
			...factories.event(),
			eventKind: "task",
			scheduledTaskLinks: [
				{
					externalTaskId: "linear-same",
					url: "https://linear.app/org/issue/same",
				},
			],
			relatedTaskLinks: [
				{
					externalTaskId: "linear-same",
					url: "https://linear.app/org/issue/same",
				},
			],
		});
		const eventId = created._id;
		const links = await t.run(async (ctx: MutationCtx) =>
			ctx.db
				.query("eventTaskLinks")
				.withIndex("by_event", (q) => q.eq("eventId", eventId))
				.collect(),
		);
		expect(links).toHaveLength(1);
		expect(links[0]).toMatchObject({
			externalTaskId: "linear-same",
			linkType: "scheduled",
		});
	});

	test("creates event with relatedTaskLinks and inserts eventTaskLinks", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser, userId } = auth;
		const created = await asUser.mutation(api.events.mutations.createEvent, {
			...factories.event(),
			relatedTaskLinks: [
				{
					externalTaskId: "linear-related-1",
					url: "https://linear.app/org/issue/related-1",
				},
				{
					externalTaskId: "linear-related-2",
					url: "https://linear.app/org/issue/related-2",
				},
			],
		});
		const eventId = created._id;
		const event = await t.run(async (ctx: MutationCtx) => ctx.db.get("events", eventId));
		expect(event).toMatchObject({ userId });
		const links = await t.run(async (ctx: MutationCtx) =>
			ctx.db
				.query("eventTaskLinks")
				.withIndex("by_event", (q) => q.eq("eventId", eventId))
				.collect(),
		);
		expect(links).toHaveLength(2);
		expect(links).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					externalTaskId: "linear-related-1",
					url: "https://linear.app/org/issue/related-1",
					linkType: "related",
				}),
				expect.objectContaining({
					externalTaskId: "linear-related-2",
					url: "https://linear.app/org/issue/related-2",
					linkType: "related",
				}),
			]),
		);
	});

	test("creates event with default eventKind when omitted", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser } = auth;
		const created = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		const eventId = created._id;
		const event = await t.run(async (ctx: MutationCtx) => ctx.db.get("events", eventId));
		expect(event?.eventKind).toBe("event");
	});
});

describe("updateEvent", () => {
	test("updates event title", async ({ t, auth, expect }) => {
		const { asUser, userId } = auth;
		const created = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		const eventId = created._id;
		await asUser.mutation(api.events.mutations.updateEvent, {
			id: eventId,
			title: "Updated Title",
		});
		const event = await t.run(async (ctx: MutationCtx) => ctx.db.get("events", eventId));
		expect(event?.title).toBe("Updated Title");
		expect(event?.userId).toEqual(userId);
	});

	test("prevents updating another user's event", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser: asAlice } = auth;
		const { asUser: asBob } = await addUserToTest(t, { firstName: "Bob" });
		const created = await asAlice.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		const eventId = created._id;
		await expect(
			asBob.mutation(api.events.mutations.updateEvent, {
				id: eventId,
				title: "Hacked",
			}),
		).rejects.toThrowError("Not authorized to update this event");
	});

	test("rejects update when event not found", async ({ t, auth, expect }) => {
		const { asUser } = auth;
		const fakeId = await t.run(async (ctx: MutationCtx) => {
			const userId = (await ctx.db.query("users").first())!._id;
			const id = await ctx.db.insert("events", {
				...factories.event(),
				userId,
				busy: "free",
				visibility: "public",
			});
			await ctx.db.delete("events", id);
			return id;
		});
		await expect(
			asUser.mutation(api.events.mutations.updateEvent, {
				id: fakeId,
				title: "Hacked",
			}),
		).rejects.toThrowError("Event not found");
	});

	test("rejects updating non-editable Google event", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser, userId } = auth;
		const eventId = await t.run(async (ctx: MutationCtx) => {
			return await ctx.db.insert("events", {
				...factories.event(),
				userId,
				busy: "free",
				visibility: "public",
				externalProvider: "google",
				isEditable: false,
			});
		});
		await expect(
			asUser.mutation(api.events.mutations.updateEvent, {
				id: eventId,
				title: "Hacked",
			}),
		).rejects.toThrowError("This event cannot be edited");
	});

	test("updates eventKind", async ({ t, auth, expect }) => {
		const { asUser } = auth;
		const created = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		const eventId = created._id;
		await asUser.mutation(api.events.mutations.updateEvent, {
			id: eventId,
			eventKind: "task",
		});
		const event = await t.run(async (ctx: MutationCtx) => ctx.db.get("events", eventId));
		expect(event?.eventKind).toBe("task");
	});

	test("converting synced Google event to task detaches and sets busy", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser, userId } = auth;
		const externalCalendarId = "google-cal-1";
		const eventId = await t.run(async (ctx: MutationCtx) =>
			ctx.db.insert("events", {
				...factories.event(),
				userId,
				externalProvider: "google",
				externalEventId: "google-ev-1",
				externalCalendarId,
				isEditable: true,
			}),
		);
		await asUser.mutation(api.events.mutations.updateEvent, {
			id: eventId,
			eventKind: "task",
		});
		const event = await t.run(async (ctx: MutationCtx) => ctx.db.get("events", eventId));
		expect(event?.eventKind).toBe("task");
		expect(event?.busy).toBe("busy");
		expect(event?.externalProvider).toBeUndefined();
		expect(event?.externalCalendarId).toBeUndefined();
		expect(event?.externalEventId).toBeUndefined();
	});

	test("updates scheduled and related task links when provided", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser } = auth;
		const created = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		const eventId = created._id;
		await asUser.mutation(api.eventTaskLinks.mutations.linkTaskToEvent, {
			eventId,
			externalTaskId: "linear-old-scheduled",
			url: "https://linear.app/org/issue/old-sched",
			linkType: "scheduled",
		});
		await asUser.mutation(api.eventTaskLinks.mutations.linkTaskToEvent, {
			eventId,
			externalTaskId: "linear-old-related",
			url: "https://linear.app/org/issue/old-rel",
			linkType: "related",
		});
		await asUser.mutation(api.events.mutations.updateEvent, {
			id: eventId,
			scheduledTaskLinks: [
				{
					externalTaskId: "linear-new-sched",
					url: "https://linear.app/org/issue/new-sched",
				},
			],
			relatedTaskLinks: [
				{
					externalTaskId: "linear-new-rel",
					url: "https://linear.app/org/issue/new-rel",
				},
			],
		});
		const links = await t.run(async (ctx: MutationCtx) =>
			ctx.db
				.query("eventTaskLinks")
				.withIndex("by_event", (q) => q.eq("eventId", eventId))
				.collect(),
		);
		expect(links).toHaveLength(2);
		expect(links).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					externalTaskId: "linear-new-sched",
					url: "https://linear.app/org/issue/new-sched",
					linkType: "scheduled",
				}),
				expect.objectContaining({
					externalTaskId: "linear-new-rel",
					url: "https://linear.app/org/issue/new-rel",
					linkType: "related",
				}),
			]),
		);
	});
});

describe("deleteEvent", () => {
	test("deletes own event", async ({ t, auth, expect }) => {
		const { asUser } = auth;
		const created = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		const eventId = created._id;
		await asUser.mutation(api.events.mutations.deleteEvent, {
			id: eventId,
		});
		const event = await t.run(async (ctx: MutationCtx) => ctx.db.get("events", eventId));
		expect(event).toBeNull();
	});

	test("prevents deleting another user's event", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser: asAlice } = auth;
		const { asUser: asBob } = await addUserToTest(t, { firstName: "Bob" });
		const created = await asAlice.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		const eventId = created._id;
		await expect(
			asBob.mutation(api.events.mutations.deleteEvent, { id: eventId }),
		).rejects.toThrowError("Not authorized to delete this event");
	});

	test("rejects delete when event not found", async ({ t, auth, expect }) => {
		const { asUser } = auth;
		const fakeId = await t.run(async (ctx: MutationCtx) => {
			const userId = (await ctx.db.query("users").first())!._id;
			const id = await ctx.db.insert("events", {
				...factories.event(),
				userId,
				busy: "free",
				visibility: "public",
			});
			await ctx.db.delete("events", id);
			return id;
		});
		await expect(
			asUser.mutation(api.events.mutations.deleteEvent, { id: fakeId }),
		).rejects.toThrowError("Event not found");
	});
});
