import { api } from "../_generated/api";
import { describe, test } from "../testFixture.nobundle";
import { factories } from "../test.setup";

describe("getUserCalendars", () => {
	test("returns empty array for user with no calendars", async ({
		auth,
		expect,
	}) => {
		const { asUser } = auth;
		const calendars = await asUser.query(api.calendars.queries.getUserCalendars);
		expect(calendars).toEqual([]);
	});

	test("returns user calendars after create", async ({ auth, expect }) => {
		const { asUser } = auth;
		await asUser.mutation(
			api.calendars.mutations.createCalendar,
			factories.calendar({ name: "Work" }),
		);
		const calendars = await asUser.query(api.calendars.queries.getUserCalendars);
		expect(calendars).toHaveLength(1);
		expect(calendars[0].name).toBe("Work");
	});

	test("requires auth", async ({ t, expect }) => {
		await expect(
			t.query(api.calendars.queries.getUserCalendars),
		).rejects.toThrowError("Not authenticated");
	});
});

describe("getDefaultCalendar", () => {
	test("returns null when user has no default", async ({ auth, expect }) => {
		const { asUser } = auth;
		await asUser.mutation(
			api.calendars.mutations.createCalendar,
			factories.calendar({ isDefault: false }),
		);
		const defaultCal = await asUser.query(
			api.calendars.queries.getDefaultCalendar,
		);
		expect(defaultCal).toBeNull();
	});

	test("returns default calendar when one exists", async ({
		auth,
		expect,
	}) => {
		const { asUser } = auth;
		await asUser.mutation(
			api.calendars.mutations.createCalendar,
			factories.calendar({ name: "Default", isDefault: true }),
		);
		const defaultCal = await asUser.query(
			api.calendars.queries.getDefaultCalendar,
		);
		expect(defaultCal).not.toBeNull();
		expect(defaultCal?.name).toBe("Default");
		expect(defaultCal?.isDefault).toBe(true);
	});
});

describe("getAllUserCalendars", () => {
	test("returns list with id, name, color, isDefault, isGoogle, externalCalendarId", async ({
		auth,
		expect,
	}) => {
		const { asUser } = auth;
		await asUser.mutation(
			api.calendars.mutations.createCalendar,
			factories.calendar({ name: "My Cal", color: "red" }),
		);
		const all = await asUser.query(api.calendars.queries.getAllUserCalendars);
		expect(all).toHaveLength(1);
		expect(all[0]).toMatchObject({
			name: "My Cal",
			color: "red",
			isDefault: false,
			isGoogle: false,
		});
		expect(all[0]).toHaveProperty("id");
		expect(all[0].externalCalendarId).toBeUndefined();
	});

	test("requires auth", async ({ t, expect }) => {
		await expect(
			t.query(api.calendars.queries.getAllUserCalendars),
		).rejects.toThrowError("Not authenticated");
	});
});
