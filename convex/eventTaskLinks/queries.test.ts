import { api } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";
import { describe, test } from "../testFixture.nobundle";
import { addUserToTest, factories } from "../test.setup";

describe("getLinksByEventId", () => {
	test("returns links for event", async ({ auth, expect }) => {
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
			api.eventTaskLinks.mutations.linkTaskToEvent,
			{
				eventId,
				externalTaskId: "linear-issue-2",
				url: "https://linear.app/org/issue/2",
			},
		);
		const links = await asUser.query(
			api.eventTaskLinks.queries.getLinksByEventId,
			{ eventId },
		);
		expect(links).toHaveLength(2);
		expect(links).toEqual(
			expect.arrayContaining([
				{
					externalTaskId: "linear-issue-1",
					url: "https://linear.app/org/issue/1",
					linkType: "related",
				},
				{
					externalTaskId: "linear-issue-2",
					url: "https://linear.app/org/issue/2",
					linkType: "related",
				},
			]),
		);
	});

	test("returns empty array when event has no links", async ({
		auth,
		expect,
	}) => {
		const { asUser } = auth;
		const eventId = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		const links = await asUser.query(
			api.eventTaskLinks.queries.getLinksByEventId,
			{ eventId },
		);
		expect(links).toEqual([]);
	});

	test("returns empty array when event does not exist", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser } = auth;
		const eventId = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		await t.run(async (ctx: MutationCtx) => {
			await ctx.db.delete(eventId);
		});
		const links = await asUser.query(
			api.eventTaskLinks.queries.getLinksByEventId,
			{ eventId },
		);
		expect(links).toEqual([]);
	});

	test("requires auth", async ({ t, auth, expect }) => {
		const { asUser } = auth;
		const eventId = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		await expect(
			t.query(api.eventTaskLinks.queries.getLinksByEventId, {
				eventId,
			}),
		).rejects.toThrowError("Not authenticated");
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
			asBob.query(api.eventTaskLinks.queries.getLinksByEventId, {
				eventId,
			}),
		).rejects.toThrowError("Not authorized to view this event");
	});

	test("returns empty array when eventId is omitted", async ({
		auth,
		expect,
	}) => {
		const { asUser } = auth;
		const links = await asUser.query(
			api.eventTaskLinks.queries.getLinksByEventId,
			{},
		);
		expect(links).toEqual([]);
	});
});

describe("getScheduledLinkByEventId", () => {
	test("returns scheduled link when one exists", async ({ auth, expect }) => {
		const { asUser } = auth;
		const eventId = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		await asUser.mutation(
			api.eventTaskLinks.mutations.linkTaskToEvent,
			{
				eventId,
				externalTaskId: "linear-scheduled-1",
				url: "https://linear.app/org/issue/scheduled",
				linkType: "scheduled",
			},
		);
		const scheduled = await asUser.query(
			api.eventTaskLinks.queries.getScheduledLinkByEventId,
			{ eventId },
		);
		expect(scheduled).toEqual({
			externalTaskId: "linear-scheduled-1",
			url: "https://linear.app/org/issue/scheduled",
		});
	});

	test("returns null when event has no links", async ({ auth, expect }) => {
		const { asUser } = auth;
		const eventId = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event(),
		);
		const scheduled = await asUser.query(
			api.eventTaskLinks.queries.getScheduledLinkByEventId,
			{ eventId },
		);
		expect(scheduled).toBeNull();
	});

	test("returns null when only related links exist", async ({
		auth,
		expect,
	}) => {
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
		const scheduled = await asUser.query(
			api.eventTaskLinks.queries.getScheduledLinkByEventId,
			{ eventId },
		);
		expect(scheduled).toBeNull();
	});

	test("returns null when eventId is omitted", async ({ auth, expect }) => {
		const { asUser } = auth;
		const scheduled = await asUser.query(
			api.eventTaskLinks.queries.getScheduledLinkByEventId,
			{},
		);
		expect(scheduled).toBeNull();
	});
});
