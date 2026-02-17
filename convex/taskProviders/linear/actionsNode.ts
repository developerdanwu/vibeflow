"use node";

import { LinearClient } from "@linear/sdk";
import type { FunctionArgs } from "convex/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { ActionCtx } from "../../_generated/server";
import { action } from "../../_generated/server";
import { ErrorCode, throwConvexError } from "../../errors";
import { authAction } from "../../helpers";

type UpsertTaskItemsArgs = FunctionArgs<
	typeof internal.taskProviders.linear.mutations.upsertTaskItems
>;
type TaskItem = UpsertTaskItemsArgs["items"][number];

function normalizeState(type: string | undefined): string | undefined {
	if (!type) return undefined;
	const m: Record<string, string> = {
		triage: "backlog",
		backlog: "backlog",
		unstarted: "todo",
		started: "in_progress",
		completed: "done",
		canceled: "cancelled",
	};
	return m[type] ?? type;
}

type StatePayload = { userId: string };

function decodeState(state: string): StatePayload {
	try {
		const decoded = atob(state.replace(/-/g, "+").replace(/_/g, "/"));
		return JSON.parse(decoded) as StatePayload;
	} catch {
		throwConvexError(ErrorCode.INVALID_STATE, "Invalid state parameter");
	}
}

async function exchangeCodeForTokens(
	code: string,
	redirectUri: string,
): Promise<{
	access_token: string;
	refresh_token?: string;
	expires_in: number;
}> {
	const clientId = process.env.LINEAR_CLIENT_ID;
	const clientSecret = process.env.LINEAR_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		throwConvexError(ErrorCode.OAUTH_NOT_CONFIGURED, "Linear OAuth not configured");
	}
	const body = new URLSearchParams({
		grant_type: "authorization_code",
		code,
		redirect_uri: redirectUri,
		client_id: clientId,
		client_secret: clientSecret,
	});
	const res = await fetch("https://api.linear.app/oauth/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: body.toString(),
	});
	if (!res.ok) {
		const text = await res.text();
		throwConvexError(
			ErrorCode.LINEAR_TOKEN_EXCHANGE_FAILED,
			`Linear token exchange failed: ${res.status} ${text}`,
		);
	}
	const data = (await res.json()) as {
		access_token: string;
		refresh_token?: string;
		expires_in: number;
	};
	return {
		access_token: data.access_token,
		refresh_token: data.refresh_token,
		expires_in: data.expires_in,
	};
}

async function refreshAccessToken(refreshToken: string): Promise<{
	access_token: string;
	refresh_token?: string;
	expires_in: number;
}> {
	const clientId = process.env.LINEAR_CLIENT_ID;
	const clientSecret = process.env.LINEAR_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		throwConvexError(ErrorCode.OAUTH_NOT_CONFIGURED, "Linear OAuth not configured");
	}
	const body = new URLSearchParams({
		grant_type: "refresh_token",
		refresh_token: refreshToken,
		client_id: clientId,
		client_secret: clientSecret,
	});
	const res = await fetch("https://api.linear.app/oauth/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: body.toString(),
	});
	if (!res.ok) {
		const text = await res.text();
		throwConvexError(
			ErrorCode.LINEAR_TOKEN_REFRESH_FAILED,
			`Linear token refresh failed: ${res.status} ${text}`,
		);
	}
	const data = (await res.json()) as {
		access_token: string;
		refresh_token?: string;
		expires_in: number;
	};
	return {
		access_token: data.access_token,
		refresh_token: data.refresh_token,
		expires_in: data.expires_in,
	};
}

/** Exchange OAuth code for tokens, store connection, fetch org metadata. */
export const exchangeCode = action({
	args: {
		code: v.string(),
		state: v.string(),
		redirectUri: v.string(),
	},
	handler: async (ctx, args): Promise<{ connectionId: Id<"taskConnections"> }> => {
		const { userId: userIdStr } = decodeState(args.state);
		const userId = userIdStr as Id<"users">;

		const tokens = await exchangeCodeForTokens(
			args.code,
			args.redirectUri,
		);
		const now = Date.now();
		const accessTokenExpiresAt = tokens.refresh_token
			? now + tokens.expires_in * 1000
			: undefined;

		const client = new LinearClient({ accessToken: tokens.access_token });
		let providerMetadata: { organizationName?: string; urlKey?: string } | undefined;
		try {
			const org = await client.organization;
			if (org) {
				providerMetadata = {
					organizationName: org.name ?? undefined,
					urlKey: org.urlKey ?? undefined,
				};
			}
		} catch (e) {
			console.warn("Failed to fetch Linear organization for metadata:", e);
		}

		const connectionId = (await ctx.runMutation(
			internal.taskProviders.linear.mutations.saveConnection,
			{
				userId,
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token,
				accessTokenExpiresAt,
				providerMetadata,
			},
		)) as Id<"taskConnections">;

		return { connectionId };
	},
});

/** Get a LinearClient with a valid token (refreshes if needed). Call from actions that need to call Linear API. */
export async function getLinearClient(
	ctx: ActionCtx,
	connectionId: Id<"taskConnections">,
): Promise<{ client: LinearClient; connectionId: Id<"taskConnections"> }> {
	const connection = await ctx.runQuery(
		internal.taskProviders.linear.queries.getConnectionById,
		{ connectionId },
	);
	if (!connection || typeof connection !== "object" || !("accessToken" in connection)) {
		throwConvexError(ErrorCode.LINEAR_CONNECTION_NOT_FOUND, "Linear connection not found");
	}
	const conn = connection as {
		accessToken: string;
		refreshToken?: string;
		accessTokenExpiresAt?: number;
	};
	const now = Date.now();
	if (
		conn.refreshToken &&
		(!conn.accessTokenExpiresAt || conn.accessTokenExpiresAt < now + 60 * 1000)
	) {
		const refreshed = await refreshAccessToken(conn.refreshToken);
		const newExpiresAt = now + refreshed.expires_in * 1000;
		await ctx.runMutation(
			internal.taskProviders.linear.mutations.updateConnectionTokens,
			{
				connectionId,
				accessToken: refreshed.access_token,
				...(refreshed.refresh_token !== undefined && {
					refreshToken: refreshed.refresh_token,
				}),
				accessTokenExpiresAt: newExpiresAt,
			},
		);
		return {
			client: new LinearClient({ accessToken: refreshed.access_token }),
			connectionId,
		};
	}
	return {
		client: new LinearClient({ accessToken: conn.accessToken }),
		connectionId,
	};
}

/** Fetch current user's assigned Linear issues (non-completed) and cache in taskItems. */
export const fetchMyIssues = authAction({
	args: {},
	handler: async (ctx): Promise<{ count: number }> => {
		const connection = await ctx.runQuery(
			internal.taskProviders.linear.queries.getConnectionByUserId,
			{ userId: ctx.user._id },
		);
		if (!connection) {
			throwConvexError(ErrorCode.LINEAR_NOT_CONNECTED, "Linear not connected");
		}
		const { client } = await getLinearClient(ctx, connection._id);
		const viewer = await client.viewer;
		if (!viewer) {
			throwConvexError(ErrorCode.LINEAR_VIEWER_LOAD_FAILED, "Could not load Linear viewer");
		}
		const issuesConnection = await viewer.assignedIssues({
			first: 50,
			filter: {
				state: { type: { nin: ["completed", "canceled"] } },
			},
		});
		const nodes = issuesConnection.nodes ?? [];
		const items: UpsertTaskItemsArgs["items"] = [];
		for (const issue of nodes) {
			const state = await issue.state;
			const project = await issue.project;
			items.push({
				externalTaskId: issue.id,
				title: issue.title ?? "",
				identifier: issue.identifier ?? undefined,
				state: normalizeState(state?.type ?? undefined),
				priority: issue.priority ?? undefined,
				dueDate: issue.dueDate ?? undefined,
				projectName: project?.name ?? undefined,
				projectId: project?.id ?? undefined,
				url: issue.url ?? "",
			} satisfies TaskItem);
		}
		await ctx.runMutation(internal.taskProviders.linear.mutations.upsertTaskItems, {
			userId: ctx.user._id,
			connectionId: connection._id,
			items,
		});
		return { count: items.length };
	},
});
