/**
 * Function and types available to the Electron main process.
 */
export { ElectronMainApi, exposeMainApi, bindWindowApi, RelayedError, } from "./lib/server_ipc";
export { setIpcBindingTimeout } from "./lib/shared_ipc";
export { RestorableClass, RestorerFunction } from "./lib/restorer";
