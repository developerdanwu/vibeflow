import { internal } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";
import { api } from "../_generated/api";
import { describe, test } from "../testFixture.nobundle";

describe("getUserByAuthId", () => {
	test("returns null for unknown authId", async ({ t, expect }) => {
		const user = await t.run(async (ctx: MutationCtx) =>
			ctx.runQuery(internal.users.queries.getUserByAuthId, {
				authId: "unknown-auth-id",
			}),
		);
		expect(user).toBeNull();
	});

	test("returns user when authId exists", async ({ auth, t, expect }) => {
		const { authId } = auth;
		const user = await t.run(async (ctx: MutationCtx) =>
			ctx.runQuery(internal.users.queries.getUserByAuthId, { authId }),
		);
		expect(user).not.toBeNull();
		expect(user?.authId).toBe(authId);
	});
});

describe("getUserPreferences", () => {
	test("requires auth", async ({ t, expect }) => {
		await expect(
			t.query(api.users.queries.getUserPreferences),
		).rejects.toThrowError("Not authenticated");
	});

	test("returns null when user has no preferences", async ({
		auth,
		expect,
	}) => {
		const { asUser } = auth;
		const prefs = await asUser.query(api.users.queries.getUserPreferences);
		expect(prefs).toBeNull();
	});

	test("returns preferences after updateUserPreferences", async ({
		auth,
		expect,
	}) => {
		const { asUser } = auth;
		await asUser.mutation(api.users.mutations.updateUserPreferences, {
			calendarSyncFromMonths: 3,
		});
		const prefs = await asUser.query(api.users.queries.getUserPreferences);
		expect(prefs).not.toBeNull();
		expect(prefs?.calendarSyncFromMonths).toBe(3);
	});
});
