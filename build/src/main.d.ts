/**
 * Function and types available to the Electron main process.
 */
export { exposeMainApi, RelayedError } from "./server_ipc";
export { setIpcBindingTimeout } from "./shared_ipc";
export { RestorableClass, RestorerFunction } from "./restorer";
