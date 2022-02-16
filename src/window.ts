/**
 * Function and types available to windows in Electron.
 */

export { bindMainApi, exposeWindowApi, ElectronWindowApi } from "./client_ipc";
export { setIpcBindingTimeout } from "./shared_ipc";
export { RestorableClass, RestorerFunction } from "./restorer";

/**
 * Type of the bound API returned by an asynchronous function T.
 */
export type AwaitedType<T> = T extends (...args: any[]) => Promise<infer R>
  ? R
  : never;