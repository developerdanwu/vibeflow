import { api } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";
import { describe, expect, test } from "../testFixture.nobundle";
import { addUserToTest, factories } from "../test.setup";

describe("createEvent", () => {
	test("creates a timed event", async ({ auth }) => {
		const { t, asUser, userId } = auth;
		const eventData = factories.event();

		const eventId = await asUser.mutation(
			api.events.mutations.createEvent,
			eventData,
		);

		const event = await t.run(async (ctx: MutationCtx) => ctx.db.get(eventId));
		expect(event).toMatchObject({
			title: "Test Event",
			userId,
			busy: "free",
			visibility: "public",
		});
	});

	test("rejects end date before start date", async ({ auth }) => {
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

	test("requires auth", async ({ t }) => {
		await expect(
			t.mutation(api.events.mutations.createEvent, factories.event()),
		).rejects.toThrowError("Not authenticated");
	});

	test("creates all-day event from date strings", async ({ auth }) => {
		const { t, asUser, userId } = auth;
		const eventId = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event({
				allDay: true,
				startDateStr: "2025-06-01",
				endDateStr: "2025-06-02",
				startTimestamp: undefined,
				endTimestamp: undefined,
			}),
		);
		const event = await t.run(async (ctx: MutationCtx) => ctx.db.get(eventId));
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
});

describe("updateEvent", () => {
	test("updates event title", async ({ auth }) => {
		const { t, asUser, userId } = auth;
		const eventId = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		await asUser.mutation(api.events.mutations.updateEvent, {
			id: eventId,
			title: "Updated Title",
		});
		const event = await t.run(async (ctx: MutationCtx) => ctx.db.get(eventId));
		expect(event?.title).toBe("Updated Title");
		expect(event?.userId).toEqual(userId);
	});

	test("prevents updating another user's event", async ({ auth }) => {
		const { t, asUser: asAlice } = auth;
		const { asUser: asBob } = await addUserToTest(t, { firstName: "Bob" });
		const eventId = await asAlice.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		await expect(
			asBob.mutation(api.events.mutations.updateEvent, {
				id: eventId,
				title: "Hacked",
			}),
		).rejects.toThrowError("Not authorized to update this event");
	});

	test("rejects update when event not found", async ({ auth }) => {
		const { t, asUser } = auth;
		const fakeId = await t.run(async (ctx: MutationCtx) => {
			const userId = (await ctx.db.query("users").first())!._id;
			const id = await ctx.db.insert("events", {
				...factories.event(),
				userId,
				busy: "free",
				visibility: "public",
			});
			await ctx.db.delete(id);
			return id;
		});
		await expect(
			asUser.mutation(api.events.mutations.updateEvent, {
				id: fakeId,
				title: "Hacked",
			}),
		).rejects.toThrowError("Event not found");
	});

	test("rejects updating non-editable Google event", async ({ auth }) => {
		const { t, asUser, userId } = auth;
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
});

describe("deleteEvent", () => {
	test("deletes own event", async ({ auth }) => {
		const { t, asUser } = auth;
		const eventId = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		await asUser.mutation(api.events.mutations.deleteEvent, {
			id: eventId,
		});
		const event = await t.run(async (ctx: MutationCtx) => ctx.db.get(eventId));
		expect(event).toBeNull();
	});

	test("prevents deleting another user's event", async ({ auth }) => {
		const { t, asUser: asAlice } = auth;
		const { asUser: asBob } = await addUserToTest(t, { firstName: "Bob" });
		const eventId = await asAlice.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		await expect(
			asBob.mutation(api.events.mutations.deleteEvent, { id: eventId }),
		).rejects.toThrowError("Not authorized to delete this event");
	});

	test("rejects delete when event not found", async ({ auth }) => {
		const { t, asUser } = auth;
		const fakeId = await t.run(async (ctx: MutationCtx) => {
			const userId = (await ctx.db.query("users").first())!._id;
			const id = await ctx.db.insert("events", {
				...factories.event(),
				userId,
				busy: "free",
				visibility: "public",
			});
			await ctx.db.delete(id);
			return id;
		});
		await expect(
			asUser.mutation(api.events.mutations.deleteEvent, { id: fakeId }),
		).rejects.toThrowError("Event not found");
	});
});
