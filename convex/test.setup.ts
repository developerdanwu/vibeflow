/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import type { Doc, TableNames } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import schema from "./schema";

export const modules = import.meta.glob("./**/*.ts");

/** Table names derived from schema; used for test data cleanup */
const CONVEX_TABLE_NAMES: TableNames[] = Object.keys(schema) as TableNames[];

/** Clear all documents from all tables in the given test instance. Call in fixture teardown. */
export async function clearAllTables(
	t: Awaited<ReturnType<typeof convexTest>>,
): Promise<void> {
	await t.run(async (ctx: MutationCtx) => {
		for (const table of CONVEX_TABLE_NAMES) {
			const docs = await ctx.db.query(table).collect();
			for (const doc of docs) {
				await ctx.db.delete(doc._id);
			}
		}
	});
}

export function setupTest() {
	return convexTest(schema, modules);
}

/** Create an authenticated test context with a user in the DB */
export async function setupAuthenticatedTest(
	overrides?: Partial<{ email: string; firstName: string; lastName: string }>,
) {
	const t = convexTest(schema, modules);
	const authId = `test-auth-${crypto.randomUUID()}`;
	const email = overrides?.email ?? "test@example.com";
	const firstName = overrides?.firstName ?? "Test";
	const lastName = overrides?.lastName ?? "User";

	const userId = await t.run(async (ctx: MutationCtx) => {
		return await ctx.db.insert("users", {
			authId,
			email,
			firstName,
			lastName,
			fullName: `${firstName} ${lastName}`,
			updatedAt: Date.now(),
		});
	});

	const asUser = t.withIdentity({
		subject: authId,
		name: `${firstName} ${lastName}`,
	});

	return { t, asUser, userId, authId };
}

/** Create authenticated context using an existing test instance (e.g. from a fixture). */
export async function setupAuthenticatedTestWithT(
	t: Awaited<ReturnType<typeof convexTest>>,
	overrides?: Partial<{ email: string; firstName: string; lastName: string }>,
) {
	const authId = `test-auth-${crypto.randomUUID()}`;
	const email = overrides?.email ?? "test@example.com";
	const firstName = overrides?.firstName ?? "Test";
	const lastName = overrides?.lastName ?? "User";

	const userId = await t.run(async (ctx: MutationCtx) => {
		return await ctx.db.insert("users", {
			authId,
			email,
			firstName,
			lastName,
			fullName: `${firstName} ${lastName}`,
			updatedAt: Date.now(),
		});
	});

	const asUser = t.withIdentity({
		subject: authId,
		name: `${firstName} ${lastName}`,
	});

	return { asUser, userId, authId };
}

/** Add a second user to an existing test instance (same DB). Use when testing multi-user scenarios. */
export async function addUserToTest(
	t: Awaited<ReturnType<typeof convexTest>>,
	overrides?: Partial<{ email: string; firstName: string; lastName: string }>,
) {
	const authId = `test-auth-${crypto.randomUUID()}`;
	const email = overrides?.email ?? "second@example.com";
	const firstName = overrides?.firstName ?? "Second";
	const lastName = overrides?.lastName ?? "User";
	const fullName = `${firstName} ${lastName}`;
	const userId = await t.run(async (ctx: MutationCtx) =>
		ctx.db.insert("users", {
			authId,
			email,
			firstName,
			lastName,
			fullName,
			updatedAt: Date.now(),
		}),
	);
	return {
		asUser: t.withIdentity({ subject: authId, name: fullName }),
		userId,
		authId,
	};
}

/** Event document fields (no system _id, _creationTime). Use for createEvent args and db.insert. */
export type EventFields = Omit<Doc<"events">, "_id" | "_creationTime">;

/** Factory for createEvent args or event doc (timed event by default). Return type omits userId so it works as createEvent args; for db.insert spread and add userId. */
export const factories = {
	event: (
		overrides?: Partial<EventFields>,
	): Partial<EventFields> &
		Pick<
			EventFields,
			| "title"
			| "startTimestamp"
			| "endTimestamp"
			| "allDay"
			| "busy"
			| "visibility"
		> => {
		const now = Date.now();
		return {
			title: "Test Event",
			startTimestamp: now,
			endTimestamp: now + 3600000,
			allDay: false,
			busy: "free",
			visibility: "public",
			...overrides,
		} satisfies Partial<EventFields> &
			Pick<
				EventFields,
				| "title"
				| "startTimestamp"
				| "endTimestamp"
				| "allDay"
				| "busy"
				| "visibility"
			>;
	},
	/** Calendar fields (for createCalendar args or db.insert). Input uses Doc for type safety. */
	calendar: (
		overrides?: Partial<Omit<Doc<"calendars">, "_id" | "_creationTime">>,
	): Pick<Doc<"calendars">, "name" | "color" | "isDefault"> => ({
		name: "Test Calendar",
		color: "blue",
		isDefault: false,
		...overrides,
	}),
	/** EventTaskLink fields for db.insert. Pass eventId in overrides when inserting. */
	eventTaskLink: (
		overrides?: Partial<Omit<Doc<"eventTaskLinks">, "_id" | "_creationTime">>,
	) => ({
		externalTaskId: "test-task-1",
		provider: "linear",
		url: "https://linear.app/test/issue/1",
		...overrides,
	}),
};
