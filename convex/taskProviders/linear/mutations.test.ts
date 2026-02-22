import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { describe, test } from "../../testFixture.nobundle";

describe("setLatestSyncWorkflowRunId", () => {
	test("sets run ID and clears last error on task connection", async ({
		t,
		auth,
		expect,
	}) => {
		const { userId } = auth;
		const connectionId = await t.run(async (ctx: MutationCtx) => {
			const now = Date.now();
			return await ctx.db.insert("taskConnections", {
				userId,
				provider: "linear",
				accessToken: "test-token",
				refreshToken: "test-refresh",
				accessTokenExpiresAt: now + 3600000,
				createdAt: now,
				updatedAt: now,
				lastSyncErrorMessage: "Previous error",
			});
		});
		await t.run(async (ctx: MutationCtx) => {
			await ctx.runMutation(
				internal.taskProviders.linear.mutations.setLatestSyncWorkflowRunId,
				{
					connectionId: connectionId as Id<"taskConnections">,
					workflowRunId: "test-workflow-id",
				},
			);
		});
		const conn = await t.run(async (ctx: MutationCtx) =>
			ctx.db.get("taskConnections", connectionId as Id<"taskConnections">),
		);
		expect(conn?.latestSyncWorkflowRunId).toBe("test-workflow-id");
		expect(conn?.lastSyncErrorMessage).toBeUndefined();
	});
});
