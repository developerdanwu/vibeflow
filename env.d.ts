/// <reference types="vite/client" />

/** Augments Vite's ImportMetaEnv so import.meta.env has typed keys. */
// biome-ignore lint: interface merge for import.meta.env typing
interface ImportMetaEnv {
	readonly VITE_CONVEX_URL: string;
	readonly VITE_GOOGLE_CALENDAR_CLIENT_ID?: string;
	readonly VITE_LINEAR_CLIENT_ID?: string;
	readonly VITE_WORKOS_CLIENT_ID?: string;
	readonly VITE_WORKOS_REDIRECT_URI?: string;
}
