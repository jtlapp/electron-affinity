/**
 * Function and types available to applications of this package.
 */
export { exposeMainApi, PassThroughError } from "./server_ipc";
export { bindMainApi } from "./client_ipc";
export { setIpcBindingTimeout } from "./shared_ipc";
import { Restorer } from "./restorer";
export declare type RestorableClass<T> = Restorer.RestorableClass<T>;
export declare type RestorerFunction = Restorer.RestorerFunction;
/**
 * Type of the bound API returned by an asynchronous function T.
 */
export declare type AwaitedType<T> = T extends (...args: any[]) => Promise<infer R> ? R : never;
