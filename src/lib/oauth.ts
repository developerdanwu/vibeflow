import { isTauri } from "@/lib/tauri";

/** Base URL for Tauri dev (Vite dev server). Used when a provider only accepts http(s) redirects. */
const TAURI_DEV_ORIGIN = "http://localhost:3000";

/**
 * Returns the OAuth redirect URI for the given path.
 * In Tauri: uses vibeflow:// scheme so the OS routes back to the app.
 * On web: uses current origin.
 */
export function getOAuthRedirectUri(path: string): string {
	if (isTauri()) {
		return `vibeflow://${path}`;
	}
	return `${window.location.origin}/${path}`;
}

/**
 * Opens an OAuth URL: in Tauri opens in the system browser; on web navigates the current window.
 */
export async function openOAuthUrl(url: string): Promise<void> {
	if (isTauri()) {
		const { openUrl } = await import("@tauri-apps/plugin-opener");
		await openUrl(url);
	} else {
		window.location.href = url;
	}
}
