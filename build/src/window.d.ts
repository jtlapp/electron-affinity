/**
 * Function and types available to windows in Electron.
 */
export { ElectronWindowApi, MainApiBinding, exposeWindowApi, checkWindowApi, bindMainApi, } from "./lib/client_ipc";
export { AwaitedType, setIpcBindingTimeout } from "./lib/shared_ipc";
export { RestorableClass, RestorerFunction } from "./lib/restorer";
