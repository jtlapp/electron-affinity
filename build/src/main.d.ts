/**
 * Function and types available to the Electron main process.
 */
export { exposeMainApi, bindWindowApi, RelayedError, ElectronMainApi, } from "./server_ipc";
export { setIpcBindingTimeout } from "./shared_ipc";
export { RestorableClass, RestorerFunction } from "./restorer";
