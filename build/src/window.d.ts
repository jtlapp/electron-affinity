/**
 * Function and types available to windows in Electron.
 */
export { ElectronWindowApi, MainApiBinding, exposeWindowApi, checkWindowApi, checkWindowApiClass, bindMainApi, } from "./lib/window_lib";
export { AwaitedType, setIpcBindingTimeout } from "./lib/shared_lib";
export { RestorableClass, RestorerFunction, genericRestorer, } from "./lib/restorer_lib";
