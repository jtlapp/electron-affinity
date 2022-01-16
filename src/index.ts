/**
 * Function and types available to applications of this package.
 */

export { exposeMainApi, PassThroughError } from "./server_ipc";
export { bindMainApi } from "./client_ipc";
export { setIpcBindingTimeout } from "./shared_ipc";

import { Recovery } from "./recovery";
export type RecoverableClass<T> = Recovery.RecoverableClass<T>;
export type RecoveryFunction = Recovery.RecoveryFunction;

export type AwaitedType<T> = T extends (...args: any[]) => Promise<infer R>
  ? R
  : never;
