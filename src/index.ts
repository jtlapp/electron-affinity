export { exposeMainApi } from "./server_ipc";

import { Recovery } from "./recovery";
export type RecoverableClass<T> = Recovery.RecoverableClass<T>;
export type RecoveryFunction = Recovery.RecoveryFunction;
