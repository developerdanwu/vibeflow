import { isTauri } from "@tauri-apps/api/core";

export function selectPlatform<TTauri, TWeb>({
	web,
	tauri,
}: {
	web: TWeb;
	tauri: TTauri;
}) {
	if (isTauri()) {
		return tauri;
	}

	return web;
}

export { isTauri };
