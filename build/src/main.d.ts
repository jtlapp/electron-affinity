/**
 * Function and types available to the Electron main process.
 */
export { ElectronMainApi, WindowApiBinding, exposeMainApi, checkMainApi, checkMainApiClass, bindWindowApi, RelayedError, } from "./lib/main_lib";
export { AwaitedType, setIpcBindingTimeout } from "./lib/shared_lib";
export { RestorableClass, RestorerFunction, genericRestorer, } from "./lib/restorer_lib";
