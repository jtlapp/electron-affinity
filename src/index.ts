/**
 * Function and types available to applications of this package.
 */

export { exposeMainApi, PassThroughError } from "./server_ipc";
export { bindMainApi } from "./client_ipc";
export { setIpcBindingTimeout } from "./shared_ipc";

import { Restorer } from "./restorer";
export type RestorableClass<T> = Restorer.RestorableClass<T>;
export type RestorerFunction = Restorer.RestorerFunction;

export type AwaitedType<T> = T extends (...args: any[]) => Promise<infer R>
  ? R
  : never;
