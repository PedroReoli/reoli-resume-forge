fn main() {
    let args = std::env::args().skip(1).collect::<Vec<_>>();
    if reoli_resume_forge::cli::is_ui_request(&args) {
        hide_private_console_for_ui();
        reoli_resume_forge::run();
        return;
    }

    if let Err(error) = reoli_resume_forge::cli::run(&args) {
        eprintln!("erro: {error}");
        std::process::exit(2);
    }
}

#[cfg(all(target_os = "windows", not(debug_assertions)))]
fn hide_private_console_for_ui() {
    #[link(name = "Kernel32")]
    unsafe extern "system" {
        fn GetConsoleProcessList(process_list: *mut u32, process_count: u32) -> u32;
        fn GetConsoleWindow() -> *mut core::ffi::c_void;
    }
    #[link(name = "User32")]
    unsafe extern "system" {
        fn ShowWindow(window: *mut core::ffi::c_void, command: i32) -> i32;
    }

    let mut processes = [0_u32; 2];
    // A console created only for this process is the double-click case. Consoles
    // shared with PowerShell/cmd remain visible so `reoli-cv ui` does not hide them.
    let count = unsafe { GetConsoleProcessList(processes.as_mut_ptr(), processes.len() as u32) };
    if count == 1 {
        let window = unsafe { GetConsoleWindow() };
        if !window.is_null() {
            unsafe { ShowWindow(window, 0) };
        }
    }
}

#[cfg(any(not(target_os = "windows"), debug_assertions))]
fn hide_private_console_for_ui() {}
