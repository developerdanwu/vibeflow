import { api } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";
import { describe, test } from "../testFixture.nobundle";
import { addUserToTest, factories } from "../test.setup";

describe("linkTaskToEvent", () => {
	test("creates link and returns id", async ({ t, auth, expect }) => {
		const { asUser } = auth;
		const eventId = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		const linkId = await asUser.mutation(
			api.eventTaskLinks.mutations.linkTaskToEvent,
			{
				eventId,
				externalTaskId: "linear-issue-1",
				url: "https://linear.app/org/issue/1",
			},
		);
		const link = await t.run(async (ctx: MutationCtx) =>
			ctx.db.get(linkId),
		);
		expect(link).toMatchObject({
			eventId,
			externalTaskId: "linear-issue-1",
			provider: "linear",
			url: "https://linear.app/org/issue/1",
		});
	});

	test("returns existing link id when same event and externalTaskId", async ({
		auth,
		expect,
	}) => {
		const { asUser } = auth;
		const eventId = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		const id1 = await asUser.mutation(
			api.eventTaskLinks.mutations.linkTaskToEvent,
			{
				eventId,
				externalTaskId: "linear-issue-1",
				url: "https://linear.app/org/issue/1",
			},
		);
		const id2 = await asUser.mutation(
			api.eventTaskLinks.mutations.linkTaskToEvent,
			{
				eventId,
				externalTaskId: "linear-issue-1",
				url: "https://linear.app/org/issue/1",
			},
		);
		expect(id1).toEqual(id2);
	});

	test("requires auth", async ({ t, auth, expect }) => {
		const { asUser } = auth;
		const eventId = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		await expect(
			t.mutation(api.eventTaskLinks.mutations.linkTaskToEvent, {
				eventId,
				externalTaskId: "linear-issue-1",
				url: "https://linear.app/org/issue/1",
			}),
		).rejects.toThrowError("Not authenticated");
	});

	test("throws when event not found", async ({ auth, expect }) => {
		const { asUser } = auth;
		const deletedId = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		await asUser.mutation(api.events.mutations.deleteEvent, {
			id: deletedId,
		});
		await expect(
			asUser.mutation(api.eventTaskLinks.mutations.linkTaskToEvent, {
				eventId: deletedId,
				externalTaskId: "linear-issue-1",
				url: "https://linear.app/org/issue/1",
			}),
		).rejects.toThrowError("Event not found");
	});

	test("throws when not authorized to link task to event", async ({
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
			asBob.mutation(api.eventTaskLinks.mutations.linkTaskToEvent, {
				eventId,
				externalTaskId: "linear-issue-1",
				url: "https://linear.app/org/issue/1",
			}),
		).rejects.toThrowError("Not authorized to link task to this event");
	});
});

describe("unlinkTaskFromEvent", () => {
	test("deletes existing link", async ({ t, auth, expect }) => {
		const { asUser } = auth;
		const eventId = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		await asUser.mutation(
			api.eventTaskLinks.mutations.linkTaskToEvent,
			{
				eventId,
				externalTaskId: "linear-issue-1",
				url: "https://linear.app/org/issue/1",
			},
		);
		await asUser.mutation(
			api.eventTaskLinks.mutations.unlinkTaskFromEvent,
			{ eventId, externalTaskId: "linear-issue-1" },
		);
		const links = await t.run(async (ctx: MutationCtx) =>
			ctx.db
				.query("eventTaskLinks")
				.withIndex("by_event", (q) => q.eq("eventId", eventId))
				.collect(),
		);
		expect(links).toHaveLength(0);
	});

	test("no-op when link does not exist", async ({ auth, expect }) => {
		const { asUser } = auth;
		const eventId = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		await expect(
			asUser.mutation(
				api.eventTaskLinks.mutations.unlinkTaskFromEvent,
				{ eventId, externalTaskId: "nonexistent-task" },
			),
		).resolves.toBeNull();
	});

	test("requires auth", async ({ t, auth, expect }) => {
		const { asUser } = auth;
		const eventId = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		await expect(
			t.mutation(api.eventTaskLinks.mutations.unlinkTaskFromEvent, {
				eventId,
				externalTaskId: "linear-issue-1",
			}),
		).rejects.toThrowError("Not authenticated");
	});

	test("throws when event not found", async ({ auth, expect }) => {
		const { asUser } = auth;
		const deletedId = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		await asUser.mutation(api.events.mutations.deleteEvent, {
			id: deletedId,
		});
		await expect(
			asUser.mutation(
				api.eventTaskLinks.mutations.unlinkTaskFromEvent,
				{ eventId: deletedId, externalTaskId: "linear-issue-1" },
			),
		).rejects.toThrowError("Event not found");
	});

	test("throws when not authorized to unlink task from event", async ({
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
		await asAlice.mutation(
			api.eventTaskLinks.mutations.linkTaskToEvent,
			{
				eventId,
				externalTaskId: "linear-issue-1",
				url: "https://linear.app/org/issue/1",
			},
		);
		await expect(
			asBob.mutation(
				api.eventTaskLinks.mutations.unlinkTaskFromEvent,
				{ eventId, externalTaskId: "linear-issue-1" },
			),
		).rejects.toThrowError("Not authorized to unlink task from this event");
	});
});
