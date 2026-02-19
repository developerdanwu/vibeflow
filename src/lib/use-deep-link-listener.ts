import { isTauri } from "@/lib/tauri";
import type { getRouter } from "@/router";
import { useEffect } from "react";

const VIBEFLOW_SCHEME = "vibeflow://";

type AppRouter = ReturnType<typeof getRouter>["router"];

/**
 * Listens for vibeflow:// deep link URLs (e.g. from OAuth redirects) and navigates the router.
 * Only runs when in Tauri; no-op on web.
 * Pass the router instance (e.g. from App/InnerApp) so the listener can run outside RouterProvider.
 */
export function useDeepLinkListener(router: AppRouter): void {
	console.log("TESTING");
	useEffect(() => {
		if (!isTauri()) {
			return;
		}

		let unlisten: (() => void) | undefined;

		const setup = async () => {
			const { onOpenUrl } = await import("@tauri-apps/plugin-deep-link");
			unlisten = await onOpenUrl((urls: string[]) => {
				for (const rawUrl of urls) {
					if (!rawUrl.startsWith(VIBEFLOW_SCHEME)) {
						continue;
					}
					const withoutScheme = rawUrl.slice(VIBEFLOW_SCHEME.length);
					const pathPart = withoutScheme.startsWith("/")
						? withoutScheme
						: `/${withoutScheme}`;
					const urlObj = new URL(pathPart, "http://localhost");
					const search: Record<string, string> = {};
					urlObj.searchParams.forEach((value, key) => {
						search[key] = value;
					});
					router.navigate({
						to: urlObj.pathname,
						search: Object.keys(search).length > 0 ? search : undefined,
					});
				}
			});
		};

		setup();
		return () => {
			unlisten?.();
		};
	}, [router]);
}
