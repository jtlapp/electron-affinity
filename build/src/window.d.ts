/**
 * Function and types available to windows in Electron.
 */
export { ElectronWindowApi, exposeWindowApi, bindMainApi, } from "./lib/client_ipc";
export { setIpcBindingTimeout } from "./lib/shared_ipc";
export { RestorableClass, RestorerFunction } from "./lib/restorer";
/**
 * Type to which an asynchronous function T resolve. Used for extracting
 * the resolved return type of a main API method.
 */
export declare type AwaitedType<T> = T extends (...args: any[]) => Promise<infer R> ? R : never;
