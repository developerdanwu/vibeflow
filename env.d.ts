/// <reference types="vite/client" />

/** Augments Vite's ImportMetaEnv so import.meta.env has typed keys. */
// biome-ignore lint: interface merge for import.meta.env typing
interface ImportMetaEnv {
	readonly VITE_CONVEX_URL: string;
	readonly VITE_GOOGLE_CALENDAR_CLIENT_ID: string;
	readonly VITE_LINEAR_CLIENT_ID: string;
	readonly VITE_WORKOS_CLIENT_ID: string;
	readonly VITE_WEB_WORKOS_REDIRECT_URI: string;
	readonly VITE_TAURI_WORKOS_REDIRECT_URI: string;
	readonly VITE_WORKOS_API_HOSTNAME: string;
	readonly VITE_CONVEX_DEPLOYMENT: string;
	readonly VITE_CONVEX_SITE_URL: string;
	readonly CONVEX_DEPLOYMENT: string;
	readonly WORKOS_API_KEY: string;
	readonly WORKOS_CLIENT_ID: string;
}
