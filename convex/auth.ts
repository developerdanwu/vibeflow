// convex/auth.ts
import { AuthKit, type AuthFunctions } from "@convex-dev/workos-authkit";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";

const authFunctions: AuthFunctions = internal.auth;

export const authKit = new AuthKit<DataModel>(components.workOSAuthKit, {
	authFunctions,
});

export const { authKitEvent } = authKit.events({
	"user.created": async (ctx, event) => {
		const existing = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", event.data.id))
			.unique();

		if (existing) {
			console.log(`User already exists: ${event.data.id}`);
			return;
		}

		try {
			await ctx.db.insert("users", {
				authId: event.data.id,
				email: event.data.email,
				firstName: event.data.firstName ?? undefined,
				lastName: event.data.lastName ?? undefined,
				fullName:
					`${event.data.firstName ?? ""} ${event.data.lastName ?? ""}`.trim() ||
					event.data.email,
				profileImageUrl: event.data.profilePictureUrl ?? undefined,
				updatedAt: Date.now(),
			});
		} catch (error) {
			console.log(`Concurrent user creation for: ${event.data.id}`, error);
		}
	},
	"user.updated": async (ctx, event) => {
		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", event.data.id))
			.unique();
		if (!user) {
			console.warn(`User not found: ${event.data.id}`);
			return;
		}
		await ctx.db.patch("users", user._id, {
			email: event.data.email,
			firstName: event.data.firstName ?? undefined,
			lastName: event.data.lastName ?? undefined,
			fullName:
				`${event.data.firstName ?? ""} ${event.data.lastName ?? ""}`.trim() ||
				event.data.email,
			profileImageUrl: event.data.profilePictureUrl ?? undefined,
			updatedAt: Date.now(),
		});
	},
	"user.deleted": async (ctx, event) => {
		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", event.data.id))
			.unique();
		if (!user) {
			console.warn(`User not found: ${event.data.id}`);
			return;
		}
		await ctx.db.delete("users", user._id);
	},

	// Session created - user creation handled by auth loader
	"session.created": async (_ctx, event) => {
		console.log("Session created:", event.data.userId);
	},
});
