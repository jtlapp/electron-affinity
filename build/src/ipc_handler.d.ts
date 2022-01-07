import { IpcMain } from "electron";
import { Recovery } from "./recovery";
export declare abstract class AsyncIpcHandler {
    channel: string;
    recoveryFunc?: Recovery.RecoveryFunction;
    constructor(channel: string, recoveryFunc?: Recovery.RecoveryFunction);
    register(ipcMain: IpcMain): void;
    abstract handler(...args: any[]): Promise<any>;
}
