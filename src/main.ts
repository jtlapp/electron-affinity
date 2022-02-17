/**
 * Function and types available to the Electron main process.
 */

export {
  ElectronMainApi,
  exposeMainApi,
  bindWindowApi,
  RelayedError,
} from "./server_ipc";
export { setIpcBindingTimeout } from "./shared_ipc";
export { RestorableClass, RestorerFunction } from "./restorer";
