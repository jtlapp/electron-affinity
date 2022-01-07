import { PublicProperty } from "./shared_ipc";
import { Recovery } from "./recovery";
export declare type MainApiBinding<T> = {
    [K in Extract<keyof T, PublicProperty<keyof T>>]: T[K];
};
export declare function bindMainApi<T>(apiClassName: string, recoveryFunc?: Recovery.RecoveryFunction): Promise<MainApiBinding<T>>;
