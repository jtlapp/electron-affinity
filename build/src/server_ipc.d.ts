import { BrowserWindow } from "electron";
import { PublicProperty } from "./shared_ipc";
import { RecoveryFunction } from "./index";
export declare type ElectronMainApi<T> = {
    [K in keyof T]: K extends PublicProperty<K> ? (...args: any[]) => Promise<any> : any;
};
export declare class PassThroughError {
    passedError: Error;
    constructor(passedError: Error);
}
export declare function exposeMainApi<T>(toWindow: BrowserWindow, mainApi: ElectronMainApi<T>, recoveryFunc?: RecoveryFunction): void;
export declare function setIpcErrorLogger(loggerFunc: (err: Error) => void): void;
