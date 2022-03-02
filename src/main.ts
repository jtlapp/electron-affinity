/**
 * Function and types available to the Electron main process.
 */

export {
  ElectronMainApi,
  WindowApiBinding,
  exposeMainApi,
  checkMainApi,
  checkMainApiClass,
  bindWindowApi,
  RelayedError,
} from "./lib/server_ipc";
export { AwaitedType, setIpcBindingTimeout } from "./lib/shared_ipc";
export {
  RestorableClass,
  RestorerFunction,
  genericRestorer,
} from "./lib/restorer";
