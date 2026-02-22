#!/usr/bin/env node
/**
 * Syncs selected Railway (or host) env vars to Convex with `convex env set`,
 * then runs `convex deploy`. Used in Railway preDeployCommand so each deploy
 * pushes both Convex env and code.
 *
 * Requires CONVEX_DEPLOY_KEY in the environment. Only vars listed in
 * CONVEX_ENV_KEYS are synced (never syncs VITE_* or CONVEX_DEPLOY_KEY).
 */

const { spawnSync } = require("child_process");
const path = require("path");

const CONVEX_ENV_KEYS = [
	"WORKOS_CLIENT_ID",
	"LINEAR_CLIENT_ID",
	"LINEAR_CLIENT_SECRET",
	"GOOGLE_CALENDAR_CLIENT_ID",
	"GOOGLE_CALENDAR_CLIENT_SECRET",
	"GOOGLE_CALENDAR_WEBHOOK_URL",
];

function run(cmd, args, options = {}) {
	const r = spawnSync(cmd, args, {
		stdio: "inherit",
		shell: false,
		env: process.env,
		cwd: path.resolve(__dirname, ".."),
		...options,
	});
	return r.status;
}

function main() {
	for (const key of CONVEX_ENV_KEYS) {
		const value = process.env[key];
		if (value == null || value === "") continue;
		const status = run("pnpm", ["exec", "convex", "env", "set", key, value]);
		if (status !== 0) {
			process.exit(status ?? 1);
		}
	}

	const status = run("pnpm", ["exec", "convex", "deploy"]);
	process.exit(status ?? 0);
}

main();
