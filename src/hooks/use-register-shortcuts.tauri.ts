import { isTauri } from "@tauri-apps/api/core";

export async function registerGlobalTauriShortcuts() {
	if (!isTauri()) {
		return () => {};
	}

	const shortcut = "CommandOrControl+R";

	const { register, unregister } = await import(
		"@tauri-apps/plugin-global-shortcut"
	);
	await unregister(shortcut);
	await register(shortcut, (event) => {
		if (event.state === "Pressed") {
			window.location.reload();
		}
	});

	return async () => {
		await unregister(shortcut);
	};
}
