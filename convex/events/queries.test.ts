import { api } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";
import { test, describe } from "../testFixture.nobundle";
import { addUserToTest, factories } from "../test.setup";

describe("getEventsByUser", () => {
	test("returns only the authenticated user's events", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser: asAlice } = auth;
		const { asUser: asBob } = await addUserToTest(t, { firstName: "Bob" });
		await asAlice.mutation(
			api.events.mutations.createEvent,
			factories.event({ title: "Alice Event" }),
		);
		await asBob.mutation(
			api.events.mutations.createEvent,
			factories.event({ title: "Bob Event" }),
		);
		const aliceEvents = await asAlice.query(api.events.queries.getEventsByUser);
		const bobEvents = await asBob.query(api.events.queries.getEventsByUser);
		expect(aliceEvents).toHaveLength(1);
		expect(aliceEvents[0].title).toBe("Alice Event");
		expect(bobEvents).toHaveLength(1);
		expect(bobEvents[0].title).toBe("Bob Event");
	});

	test("requires auth", async ({ t, expect }) => {
		await expect(t.query(api.events.queries.getEventsByUser)).rejects.toThrow(
			"Not authenticated",
		);
	});
});

describe("getEventsByDateRange", () => {
	test("returns events within date range", async ({ auth, expect }) => {
		const { asUser } = auth;
		const start = Date.now();
		const end = start + 2 * 3600000;
		await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event({
				title: "In Range",
				startTimestamp: start + 3600000,
				endTimestamp: start + 3600000 + 1800000,
			}),
		);
		const events = await asUser.query(api.events.queries.getEventsByDateRange, {
			startTimestamp: start,
			endTimestamp: end,
		});
		expect(events).toHaveLength(1);
		expect(events[0].title).toBe("In Range");
	});

	test("requires auth", async ({ t, expect }) => {
		await expect(
			t.query(api.events.queries.getEventsByDateRange, {
				startTimestamp: Date.now(),
				endTimestamp: Date.now() + 3600000,
			}),
		).rejects.toThrow("Not authenticated");
	});
});

describe("getEventById", () => {
	test("returns event when owner", async ({ auth, expect }) => {
		const { asUser } = auth;
		const eventId = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event({ title: "My Event" }),
		);
		const event = await asUser.query(api.events.queries.getEventById, {
			id: eventId,
		});
		expect(event).not.toBeNull();
		expect(event?.title).toBe("My Event");
	});

	test("returns null when event does not exist", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser } = auth;
		const deletedId = await t.run(async (ctx: MutationCtx) => {
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
		const event = await asUser.query(api.events.queries.getEventById, {
			id: deletedId,
		});
		expect(event).toBeNull();
	});

	test("throws when not authorized to view event", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser: asAlice } = auth;
		const { asUser: asBob } = await addUserToTest(t, { firstName: "Bob" });
		const eventId = await asAlice.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		await expect(
			asBob.query(api.events.queries.getEventById, { id: eventId }),
		).rejects.toThrowError("Not authorized to view this event");
	});
});
