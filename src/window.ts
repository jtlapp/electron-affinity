/**
 * Function and types available to windows in Electron.
 */

export { ElectronWindowApi, exposeWindowApi, bindMainApi } from "./client_ipc";
export { setIpcBindingTimeout } from "./shared_ipc";
export { RestorableClass, RestorerFunction } from "./restorer";

/**
 * Type to which an asynchronous function T resolve. Used for extracting
 * the resolved return type of a main API method.
 */
export type AwaitedType<T> = T extends (...args: any[]) => Promise<infer R>
  ? R
  : never;
