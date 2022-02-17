/**
 * Installs the generic IPC on which APIs are built in the renderer.
 * The API methods cannot themselves be installed this way because
 * they require receiving class and method names via IPC, and because
 * they need to support parameterized construction.
 */
export {};
