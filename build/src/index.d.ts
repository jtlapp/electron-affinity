export { exposeMainApi } from "./server_ipc";
export { bindMainApi } from "./client_ipc";
export { setIpcBindingTimeout } from "./shared_ipc";
import { Recovery } from "./recovery";
export declare type RecoverableClass<T> = Recovery.RecoverableClass<T>;
export declare type RecoveryFunction = Recovery.RecoveryFunction;
export declare type AwaitedType<T> = T extends (...args: any[]) => Promise<infer R> ? R : never;
