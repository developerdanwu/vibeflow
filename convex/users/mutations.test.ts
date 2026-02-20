import { api } from "../_generated/api";
import { describe, test } from "../testFixture.nobundle";

describe("ensureUserExists", () => {
	test("creates user when none exists", async ({ t, expect }) => {
		const authId = `auth-${crypto.randomUUID()}`;
		const result = await t.mutation(api.users.mutations.ensureUserExists, {
			authId,
			email: "new@example.com",
			firstName: "New",
			lastName: "User",
		});
		expect(result).not.toBeNull();
		expect(result?.authId).toBe(authId);
		expect(result?.email).toBe("new@example.com");
		expect(result?.fullName).toBe("New User");
	});

	test("returns existing user when called again with same authId", async ({
		t,
		expect,
	}) => {
		const authId = `auth-${crypto.randomUUID()}`;
		const first = await t.mutation(api.users.mutations.ensureUserExists, {
			authId,
			email: "idem@example.com",
		});
		const second = await t.mutation(api.users.mutations.ensureUserExists, {
			authId,
			email: "idem@example.com",
		});
		expect(first?._id).toEqual(second?._id);
		expect(second?.authId).toBe(authId);
	});

	test("fullName falls back to email when first/last name empty", async ({
		t,
		expect,
	}) => {
		const authId = `auth-${crypto.randomUUID()}`;
		const result = await t.mutation(api.users.mutations.ensureUserExists, {
			authId,
			email: "only@example.com",
		});
		expect(result?.fullName).toBe("only@example.com");
	});
});

describe("updateUserPreferences", () => {
	test("requires auth", async ({ t, expect }) => {
		await expect(
			t.mutation(api.users.mutations.updateUserPreferences, {
				calendarSyncFromMonths: 3,
			}),
		).rejects.toThrowError("Not authenticated");
	});

	test("sets calendarSyncFromMonths for authenticated user", async ({
		auth,
		expect,
	}) => {
		const { asUser } = auth;
		await asUser.mutation(api.users.mutations.updateUserPreferences, {
			calendarSyncFromMonths: 6,
		});
		const prefs = await asUser.query(api.users.queries.getUserPreferences);
		expect(prefs).not.toBeNull();
		expect(prefs?.calendarSyncFromMonths).toBe(6);
	});

	test("updates existing preferences", async ({ auth, expect }) => {
		const { asUser } = auth;
		await asUser.mutation(api.users.mutations.updateUserPreferences, {
			calendarSyncFromMonths: 3,
		});
		await asUser.mutation(api.users.mutations.updateUserPreferences, {
			calendarSyncFromMonths: 12,
		});
		const prefs = await asUser.query(api.users.queries.getUserPreferences);
		expect(prefs?.calendarSyncFromMonths).toBe(12);
	});
});
