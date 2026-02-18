import contentCollections from "@content-collections/vite";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import tanstackRouter from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const host: string | undefined = process.env.TAURI_DEV_HOST;

export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
			"@convex": fileURLToPath(new URL("./convex", import.meta.url)),
		},
	},
	envPrefix: ["VITE_", "TAURI_ENV_"],
	plugins: [
		devtools(),
		viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
		contentCollections(),
		tailwindcss(),
		tanstackRouter(),
		viteReact({
			babel: {
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
	],
	clearScreen: false,
	server: {
		port: 3000,
		strictPort: true,
		host: host ?? false,
		hmr: host ? { protocol: "ws", host, port: 3001 } : undefined,
		watch: {
			ignored: ["**/src-tauri/**"],
		},
	},
});
