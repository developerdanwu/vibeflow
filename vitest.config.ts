import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
	plugins: [react()],
	test: {
		environmentMatchGlobs: [
			["convex/**", "edge-runtime"],
			["**", "jsdom"],
		],
		globals: true,
		server: { deps: { inline: ["convex-test"] } },
		setupFiles: ["./src/test/setup.ts"],
	},
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
});
