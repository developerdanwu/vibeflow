import { convexTest } from "convex-test";
import { test as base } from "vitest";
import schema from "./schema";
import {
	clearAllTables,
	modules,
	setupAuthenticatedTestWithT,
} from "./test.setup";
import type { Id } from "./_generated/dataModel";

type ConvexT = Awaited<ReturnType<typeof convexTest>>;

export const test = base.extend<{
	/** Fresh convex-test instance for this test. Cleared after test. */
	t: ConvexT;
	/** Authenticated context (user in DB + asUser). Use with t from fixture for DB access. */
	auth: {
		asUser: ReturnType<ConvexT["withIdentity"]>;
		userId: Id<"users">;
		authId: string;
	};
}>({
	t: async ({}, use) => {
		const t = convexTest(schema, modules);
		await use(t);
		await clearAllTables(t);
	},
	auth: async ({ t }, use) => {
		const result = await setupAuthenticatedTestWithT(t);
		await use(result);
	},
});

export { describe, it } from "vitest";
