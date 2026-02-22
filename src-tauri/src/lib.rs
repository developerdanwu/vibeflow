use tauri_plugin_prevent_default::Flags;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build());

    // Only disable right-click context menu in production (keep it in dev for inspect etc.)
    if !cfg!(debug_assertions) {
        let prevent = tauri_plugin_prevent_default::Builder::new()
            .with_flags(Flags::CONTEXT_MENU)
            .build();
        builder = builder.plugin(prevent);
    }

    builder.setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
