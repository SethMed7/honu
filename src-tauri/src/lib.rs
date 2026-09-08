use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, WebviewWindow,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

/// Run every toggle on the event loop so rapid tray/hotkey events are serialized.
fn request_toggle(app: &AppHandle) {
    let handle = app.clone();
    if let Err(error) = app.run_on_main_thread(move || {
        if let Err(error) = toggle_overlay(&handle) {
            eprintln!("Honu: cannot toggle overlay: {error}");
        }
    }) {
        eprintln!("Honu: cannot schedule toggle: {error}");
    }
}

fn toggle_overlay(app: &AppHandle) -> tauri::Result<()> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| tauri::Error::WindowNotFound)?;
    if window.is_visible()? {
        window.hide()?;
    } else {
        // Follow the pointer, including Retina displays with negative origins.
        let pointer = window.cursor_position()?;
        let monitor = window
            .monitor_from_point(pointer.x, pointer.y)?
            .or(window.primary_monitor()?);
        if let Some(monitor) = monitor {
            window.set_position(*monitor.position())?;
            window.set_size(*monitor.size())?;
        }
        window.show()?;
        window.set_focus()?;
    }
    Ok(())
}

#[cfg(target_os = "macos")]
fn configure_overlay(window: &WebviewWindow) -> tauri::Result<()> {
    use objc2_app_kit::{NSColor, NSWindow, NSWindowCollectionBehavior};

    // setup runs on AppKit's main thread. Tauri owns this borrowed NSWindow,
    // which remains alive for the duration of these synchronous calls.
    let native = window.ns_window()? as *mut NSWindow;
    unsafe {
        let native = &*native;
        native.setOpaque(false);
        native.setBackgroundColor(Some(&NSColor::clearColor()));
        native.setHasShadow(false);
        native.setLevel(25); // NSStatusWindowLevel: above normal/fullscreen content.
        native.setCollectionBehavior(
            NSWindowCollectionBehavior::CanJoinAllSpaces
                | NSWindowCollectionBehavior::FullScreenAuxiliary
                | NSWindowCollectionBehavior::Stationary
                | NSWindowCollectionBehavior::IgnoresCycle,
        );
    }
    // Wry's transparent(true) + macos-private-api clears WKWebView's backing
    // background. Avoid a second fragile private KVC implementation here.
    Ok(())
}

#[cfg(not(target_os = "macos"))]
fn configure_overlay(_window: &WebviewWindow) -> tauri::Result<()> {
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .on_window_event(|window, event| {
            // macOS's standard Close command must not destroy the one canvas
            // and leave a live tray that can no longer toggle it.
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                if let Err(error) = window.hide() {
                    eprintln!("Honu: cannot hide closed window: {error}");
                }
            }
        })
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let config = &app.config().app.windows[0];
            let builder = tauri::WebviewWindowBuilder::from_config(app, config)?;
            // macOS native fullscreen creates a separate Space. The configured
            // fullscreen intent is implemented as a monitor-sized borderless
            // window, created hidden so launch never switches the user's Space.
            #[cfg(target_os = "macos")]
            let builder = builder.fullscreen(false);
            let window = builder
                .focused(false)
                .incognito(true)
                .on_download(|_, _| false)
                .build()?;
            configure_overlay(&window)?;

            let toggle = MenuItem::with_id(
                app,
                "toggle",
                "Toggle Overlay (⌘+Shift+D)",
                true,
                None::<&str>,
            )?;
            let separator = PredefinedMenuItem::separator(app)?;
            let quit = MenuItem::with_id(app, "quit", "Quit Honu", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle, &separator, &quit])?;
            TrayIconBuilder::with_id("honu")
                .icon(Image::from_bytes(include_bytes!("../icons/tray.png"))?)
                .icon_as_template(true)
                .tooltip("Honu · ⌘⇧D to draw")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "toggle" => request_toggle(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        request_toggle(tray.app_handle());
                    }
                })
                .build(app)?;

            // Registration errors propagate: don't silently run without the
            // advertised global shortcut (e.g. another app already owns it).
            app.global_shortcut()
                .on_shortcut("CommandOrControl+Shift+D", |app, _, event| {
                    if event.state == ShortcutState::Pressed {
                        request_toggle(app);
                    }
                })?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Honu failed to start");
}
