export { exposeMainApi } from "./server_ipc";
export { setIpcBindingTimeout } from "./shared_ipc";

import { Recovery } from "./recovery";
export type RecoverableClass<T> = Recovery.RecoverableClass<T>;
export type RecoveryFunction = Recovery.RecoveryFunction;
