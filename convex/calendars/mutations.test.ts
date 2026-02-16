import { api } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";
import { describe, test } from "../testFixture.nobundle";
import { addUserToTest, factories } from "../test.setup";

describe("createCalendar", () => {
	test("creates calendar for authenticated user", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser, userId } = auth;
		const calId = await asUser.mutation(
			api.calendars.mutations.createCalendar,
			factories.calendar({ name: "Work" }),
		);
		const cal = await t.run(async (ctx: MutationCtx) => ctx.db.get(calId));
		expect(cal).toMatchObject({
			name: "Work",
			userId,
			color: "blue",
			isDefault: false,
		});
	});

	test("requires auth", async ({ t, expect }) => {
		await expect(
			t.mutation(
				api.calendars.mutations.createCalendar,
				factories.calendar(),
			),
		).rejects.toThrowError("Not authenticated");
	});

	test("when isDefault true, unsets previous default", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser, userId } = auth;
		const firstId = await asUser.mutation(
			api.calendars.mutations.createCalendar,
			factories.calendar({ name: "First", isDefault: true }),
		);
		const secondId = await asUser.mutation(
			api.calendars.mutations.createCalendar,
			factories.calendar({ name: "Second", isDefault: true }),
		);
		const first = await t.run(async (ctx: MutationCtx) => ctx.db.get(firstId));
		const second = await t.run(async (ctx: MutationCtx) => ctx.db.get(secondId));
		expect(first?.isDefault).toBe(false);
		expect(second?.isDefault).toBe(true);
	});
});

describe("updateCalendar", () => {
	test("updates name and color", async ({ t, auth, expect }) => {
		const { asUser } = auth;
		const calId = await asUser.mutation(
			api.calendars.mutations.createCalendar,
			factories.calendar(),
		);
		await asUser.mutation(api.calendars.mutations.updateCalendar, {
			id: calId,
			name: "Updated Name",
			color: "red",
		});
		const cal = await t.run(async (ctx: MutationCtx) => ctx.db.get(calId));
		expect(cal?.name).toBe("Updated Name");
		expect(cal?.color).toBe("red");
	});

	test("throws Calendar not found for bad id", async ({
		auth,
		t,
		expect,
	}) => {
		const { asUser } = auth;
		const badId = await t.run(async (ctx: MutationCtx) => {
			const userId = (await ctx.db.query("users").first())!._id;
			const id = await ctx.db.insert("calendars", {
				...factories.calendar(),
				userId,
			});
			await ctx.db.delete(id);
			return id;
		});
		await expect(
			asUser.mutation(api.calendars.mutations.updateCalendar, {
				id: badId,
				name: "X",
			}),
		).rejects.toThrowError("Calendar not found");
	});

	test("throws Not authorized when updating another user's calendar", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser: asAlice } = auth;
		const { asUser: asBob } = await addUserToTest(t, { firstName: "Bob" });
		const calId = await asAlice.mutation(
			api.calendars.mutations.createCalendar,
			factories.calendar(),
		);
		await expect(
			asBob.mutation(api.calendars.mutations.updateCalendar, {
				id: calId,
				name: "Hacked",
			}),
		).rejects.toThrowError("Not authorized to update this calendar");
	});

	test("setting isDefault true unsets other default", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser } = auth;
		const cal1Id = await asUser.mutation(
			api.calendars.mutations.createCalendar,
			factories.calendar({ name: "A", isDefault: true }),
		);
		const cal2Id = await asUser.mutation(
			api.calendars.mutations.createCalendar,
			factories.calendar({ name: "B", isDefault: false }),
		);
		await asUser.mutation(api.calendars.mutations.updateCalendar, {
			id: cal2Id,
			isDefault: true,
		});
		const cal1 = await t.run(async (ctx: MutationCtx) => ctx.db.get(cal1Id));
		const cal2 = await t.run(async (ctx: MutationCtx) => ctx.db.get(cal2Id));
		expect(cal1?.isDefault).toBe(false);
		expect(cal2?.isDefault).toBe(true);
	});
});

describe("deleteCalendar", () => {
	test("deletes non-default calendar", async ({ t, auth, expect }) => {
		const { asUser } = auth;
		const calId = await asUser.mutation(
			api.calendars.mutations.createCalendar,
			factories.calendar({ isDefault: false }),
		);
		await asUser.mutation(api.calendars.mutations.deleteCalendar, { id: calId });
		const cal = await t.run(async (ctx: MutationCtx) => ctx.db.get(calId));
		expect(cal).toBeNull();
	});

	test("throws Calendar not found for bad id", async ({
		auth,
		t,
		expect,
	}) => {
		const { asUser } = auth;
		const badId = await t.run(async (ctx: MutationCtx) => {
			const userId = (await ctx.db.query("users").first())!._id;
			const id = await ctx.db.insert("calendars", {
				...factories.calendar(),
				userId,
			});
			await ctx.db.delete(id);
			return id;
		});
		await expect(
			asUser.mutation(api.calendars.mutations.deleteCalendar, { id: badId }),
		).rejects.toThrowError("Calendar not found");
	});

	test("throws Not authorized when deleting another user's calendar", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser: asAlice } = auth;
		const { asUser: asBob } = await addUserToTest(t, { firstName: "Bob" });
		const calId = await asAlice.mutation(
			api.calendars.mutations.createCalendar,
			factories.calendar({ isDefault: false }),
		);
		await expect(
			asBob.mutation(api.calendars.mutations.deleteCalendar, { id: calId }),
		).rejects.toThrowError("Not authorized to delete this calendar");
	});

	test("throws Cannot delete the default calendar when isDefault", async ({
		auth,
		expect,
	}) => {
		const { asUser } = auth;
		const calId = await asUser.mutation(
			api.calendars.mutations.createCalendar,
			factories.calendar({ isDefault: true }),
		);
		await expect(
			asUser.mutation(api.calendars.mutations.deleteCalendar, { id: calId }),
		).rejects.toThrowError("Cannot delete the default calendar");
	});

	test("unpatches events calendarId when deleting calendar", async ({
		t,
		auth,
		expect,
	}) => {
		const { asUser } = auth;
		const calId = await asUser.mutation(
			api.calendars.mutations.createCalendar,
			factories.calendar({ isDefault: false }),
		);
		const eventId = await asUser.mutation(
			api.events.mutations.createEvent,
			factories.event({ calendarId: calId }),
		);
		await asUser.mutation(api.calendars.mutations.deleteCalendar, { id: calId });
		const event = await t.run(async (ctx: MutationCtx) => ctx.db.get(eventId));
		expect(event?.calendarId).toBeUndefined();
	});
});
